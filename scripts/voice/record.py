#!/usr/bin/env python3
"""Record Forge's natural coach voices.

Every sentence the app can say (exported by `npm run voice:lines`) is synthesized once with
Kokoro-82M (https://huggingface.co/hexgrad/Kokoro-82M, Apache-2.0), trimmed and saved as a small
MP3 named after the sentence's key. Only missing sentences are recorded; recordings that are no
longer in the catalog are removed. To re-record a voice from scratch, delete its folder (and give
it a new pack id if it has shipped: phones keep the clips they already have).

    npm run voice                       # export the catalog, then record every pack
    python3 scripts/voice/record.py voice-lines.json public/voice --packs heart --jobs 2

Needs Python 3.10-3.12 with `pip install "kokoro>=0.9.4" soundfile`, spaCy's en_core_web_sm model
and ffmpeg on PATH. Writes <out>/<pack>/<id>.mp3 and <out>/<pack>/manifest.json
({"clips": {id: milliseconds}}).
"""

import argparse
import json
import os
import subprocess
import sys
import time
from multiprocessing import get_context

RATE = 24000
BITRATE = '32k'

# Lines a voice says unclearly on their own, and how to record them instead (each checked with
# Whisper). 'say' replaces the text, 'speed' changes the pace, and 'cut' says the carrier phrase and
# keeps just that word: a number said mid-phrase keeps its "-ty" ("sixty", not "sixteen"), and the
# "t" of "times" gives a clean place to cut.
TAKES = {
    'am_michael': {
        '50.': {'say': 'Fifty times.', 'cut': 'Fifty'},
        '60.': {'say': 'Sixty times.', 'cut': 'Sixty'},
        '70.': {'say': 'Seventy times.', 'cut': 'Seventy'},
        'Wall sit.': {'speed': 0.8},
        'Quick, light feet.': {'speed': 0.9},
    },
}


def trim(audio, rate=RATE):
    """Cut leading and trailing silence, keeping a short natural edge. The ends fade, so a breath
    that runs past the cut doesn't click."""
    import numpy as np

    level = np.abs(audio)
    loud = np.flatnonzero(level > max(0.004, float(level.max()) * 0.006))
    if not len(loud):
        return audio
    start = max(0, loud[0] - int(0.03 * rate))
    end = min(len(audio), loud[-1] + int(0.12 * rate))
    out = np.array(audio[start:end], dtype=np.float32)
    fade_in, fade_out = min(len(out), int(0.005 * rate)), min(len(out), int(0.05 * rate))
    out[:fade_in] *= np.linspace(0, 1, fade_in, dtype=np.float32)
    out[len(out) - fade_out:] *= np.linspace(1, 0, fade_out, dtype=np.float32)
    return out


def encode(audio, path):
    """Mono 24 kHz MP3 at 32 kbps, no tags."""
    import numpy as np

    pcm = np.clip(audio, -1, 1).astype('<f4').tobytes()
    subprocess.run(
        ['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(RATE), '-ac', '1', '-i', 'pipe:0',
         '-codec:a', 'libmp3lame', '-b:a', BITRATE, '-map_metadata', '-1', '-id3v2_version', '0', path],
        input=pcm, check=True)


def duration_ms(path):
    """Length of an MP3 as ffprobe reads it (None if it can't be read)."""
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                       capture_output=True, text=True)
    try:
        return None if r.stderr.strip() else float(r.stdout.strip()) * 1000
    except ValueError:
        return None


def speakable(text):
    return text.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')


def synth(pipe, voice, text):
    """A sentence as raw audio, recorded the way TAKES says for this voice (None if nothing came out)."""
    import numpy as np

    take = TAKES.get(voice, {}).get(text, {})
    results = list(pipe(speakable(take.get('say', text)), voice=voice, speed=take.get('speed', 1.0)))
    if not results:
        return None
    audio = np.concatenate([r.audio.numpy() if hasattr(r.audio, 'numpy') else np.asarray(r.audio) for r in results])
    if 'cut' in take:
        word = next(t for t in results[0].tokens if t.text.lower() == take['cut'].lower())
        audio = audio[int(max(0, word.start_ts - 0.05) * RATE):int((word.end_ts + 0.03) * RATE)]
    return audio


def work(args):
    """Record a batch of sentences in one worker process: [(id, text)] -> [(id, ms)]."""
    voice, items, out_dir, threads = args
    import torch
    from kokoro import KPipeline

    torch.set_num_threads(threads)
    pipe = KPipeline(lang_code='a', repo_id='hexgrad/Kokoro-82M')
    done = []
    for cid, text in items:
        audio = synth(pipe, voice, text)
        if audio is None:
            print(f'  ! nothing for {text!r}', file=sys.stderr)
            continue
        audio = trim(audio)
        encode(audio, os.path.join(out_dir, f'{cid}.mp3'))
        done.append((cid, round(len(audio) * 1000 / RATE)))
    return done


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('lines', help='JSON from `npm run voice:lines`')
    ap.add_argument('out', help='output folder, e.g. public/voice')
    ap.add_argument('--packs', help='comma-separated pack ids (default: all)')
    ap.add_argument('--jobs', type=int, default=2, help='worker processes')
    ap.add_argument('--batch', type=int, default=40, help='sentences per work unit')
    ap.add_argument('--verify', action='store_true', help='re-record any file that is unreadable or the wrong length')
    opts = ap.parse_args()

    data = json.load(open(opts.lines))
    wanted = set(opts.packs.split(',')) if opts.packs else None
    sentences = {s['id']: s['text'] for s in data['sentences']}
    threads = max(1, (os.cpu_count() or 2) // opts.jobs)

    for pack in data['packs']:
        if wanted and pack['id'] not in wanted:
            continue
        out_dir = os.path.join(opts.out, pack['id'])
        os.makedirs(out_dir, exist_ok=True)
        manifest_path = os.path.join(out_dir, 'manifest.json')
        clips = json.load(open(manifest_path))['clips'] if os.path.exists(manifest_path) else {}
        # Forget recordings that are gone, or no longer in the catalog.
        clips = {k: v for k, v in clips.items() if k in sentences and os.path.exists(os.path.join(out_dir, f'{k}.mp3'))}
        for f in os.listdir(out_dir):
            if f.endswith('.mp3') and f[:-4] not in sentences:
                os.remove(os.path.join(out_dir, f))
        if opts.verify:
            broken = [k for k, ms in clips.items() if abs((duration_ms(os.path.join(out_dir, f'{k}.mp3')) or -1e9) - ms) > 80]
            print(f'{pack["id"]}: {len(broken)} broken recordings', flush=True)
            for k in broken:
                del clips[k]
        todo = [(k, t) for k, t in sentences.items() if k not in clips]
        print(f'{pack["id"]} ({pack["kokoro"]}): {len(clips)} recorded, {len(todo)} to record', flush=True)

        def save():
            with open(manifest_path, 'w') as f:
                json.dump({'v': 1, 'pack': pack['id'], 'clips': dict(sorted(clips.items()))}, f, separators=(',', ':'))

        batches = [todo[i:i + opts.batch] for i in range(0, len(todo), opts.batch)]
        started = time.time()
        with get_context('spawn').Pool(opts.jobs) as pool:
            for n, done in enumerate(pool.imap_unordered(work, [(pack['kokoro'], b, out_dir, threads) for b in batches]), 1):
                clips.update(dict(done))
                save()
                rate = (time.time() - started) / n
                print(f'  {n}/{len(batches)} batches, ~{round(rate * (len(batches) - n) / 60)} min left', flush=True)
        save()
        print(f'{pack["id"]}: {len(clips)} recordings', flush=True)


if __name__ == '__main__':
    main()
