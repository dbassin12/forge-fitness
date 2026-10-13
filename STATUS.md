# System Status
*Last updated: 2026-10-13 (UTC)*
*Session summary: Three Forge improvements David asked for. You can now skip exercises you don't like. The coach explains each new exercise before it starts. The voice is a natural, pre-recorded one instead of the phone's robotic text-to-speech. These went out in PR #5 (merged, live). PR #6 (merged, live) made updating from the phone easy and added a second natural voice, Michael (male). Now on `claude/sharp-ramanujan-y020x1`: switching reminders from calendar events to phone notifications, with a list of the calendar events to delete.*

## What Changed This Session

### 1. Skip exercises you don't like
- **Data.** `Profile.excludedExercises` → `PlanInputs.excluded` → `PlanContext.excluded`. `blockReason()` returns `'skipped'` for these exercises (`src/engines/plan/equipment.ts`), so everything that checks `isAllowed` leaves them out: sessions, warm-ups, cool-downs, snacks, swaps, Play games and the progression ladder climb.
- **Fallback.** `resolveSlot()` (`src/engines/plan/resolve.ts`) uses the ladder's next allowed rung. If every rung is skipped, it picks the closest move of the same pattern, which then progresses like a swapped-in exercise.
- **Where you skip one:**
  - Settings → **Exercises I skip** (`src/features/train/SkipListPage.tsx`, route `/train/skipped`), with search and Push/Pull/Legs… filters. It warns when nothing is left for a movement.
  - "Not for me" on every exercise page.
  - "Never include …" in the swap sheet.
  - A thumbs-down on warm-up and cool-down rows in the workout preview.
  - Mid-workout, for today or for good.
  - On the summary right after a workout ("Not a fan of any of these?"), while the moves are fresh.
- The library marks skipped moves. Helpers are `setExerciseSkipped` and `useSkipped` in `src/state/store.ts`.

### 2. A how-to before each exercise
- **The how-to screen.** Before an exercise's first set (`RestStep.first` in `src/features/player/steps.ts`), the player shows `HowToScreen` (`src/features/player/RunView.tsx`): the demo at 0.75× speed, then numbered setup and movement steps, each highlighted while it's read out, then a breathing tip.
- **Timing.** The countdown holds at 4 s until the coach finishes, then goes 3-2-1. "Start now" skips ahead.
- **How much is explained.** It's chosen per exercise: `depthFor()` in `src/features/player/howto.ts`.
  - The first two full explanations of a move are counted in `howto.explained` (kv, `src/state/howto.ts`).
  - After that the coach says the name, the target and one cue.
  - The setting is `VoiceSettings.explain`: New moves / Every time / Just go, shown on the workout intro screen.
  - Warm-up and cool-down moves get only their first ~45 words read out. The screen always lists every step.
- **What's said.** `restLines()` in `src/features/player/announce.ts`.
- **Mid-set "How to".** Pauses the set and opens the steps, "Read it to me", the full tutorial, and "Not for me: skip this exercise".
- **Before starting.** Every move named on the workout intro screen links to its guide.
- **Skipping mid-workout.** `withoutSkipped()` drops the exercise's remaining sets and keeps the ones already done. Back-to-back rests merge, keeping the first. The cursor moves to the transition into the next exercise. The run state keeps `skips`.

### 3. A natural voice
- **The recordings.** Every sentence Forge says is listed by `src/voice/catalog.ts` (2,747 sentences). Each was recorded with **Kokoro-82M** (Apache-2.0) as a 32 kbps MP3 in `public/voice/<pack>/<id>.mp3`.
  - The id is `clipId()`, a hash of the normalized sentence (`src/voice/voiceKey.ts`).
  - Each folder has a `manifest.json` that maps id → length in ms.
- **Voices** (`src/voice/packs.ts`): **Heart** (`af_heart`, female), the default, and **Michael** (`am_michael`, male, added in PR #6), plus the phone's own voices. Each voice adds about 30 MB to the repo; a phone only downloads the one it uses. To add another, list it in `VOICE_PACKS`, run `npm run voice` (one to two hours), then commit its `public/voice/<id>/` folder.
- **Playback.** `src/voice/clipPlayer.ts` plays each line's sentences back to back through Web Audio. "12 push-ups" is said as a count followed by a phrase. `speech.ts` tries the clips first and falls back to the phone voice for any line that isn't recorded or can't play.
- **Downloads and offline.** The workout intro screen prefetches what that workout needs. The service worker keeps clips with CacheFirst (`voice` cache) and refreshes manifests NetworkFirst. `voice/**` is not in the precache.
- **Bloom is unchanged.** Its lines aren't recorded, so `VOICE_PACKS` is empty there and it keeps the phone's voices.
- **Re-recording.** `npm run voice` exports the catalog (`voice:lines`), then runs `scripts/voice/record.py`, which only records missing sentences. It needs Python 3.10–3.12, `kokoro>=0.9.4`, `soundfile`, spaCy `en_core_web_sm` and ffmpeg. `--verify` re-records unreadable files.
  - The recorder trims gently and fades each clip's ends, so a breath that runs past the cut doesn't click. Heart was recorded before this; its endings were already clean.
  - `TAKES` in `record.py` gives a voice an alternate take of a line it says unclearly: different wording, a different speed, or one word cut from a carrier phrase. To re-record one clip, delete its MP3 and run `npm run voice` again.
- **Quality check.** All 2,747 Heart clips decode in Chromium's Web Audio, and their lengths match the manifest to within 2 ms. A Whisper `base.en` transcription of 250 random clips came back with a 1.1% word error rate. Rechecked with `small.en`, the flagged lines were natural connected speech (e.g. "wall sit" run together), not garbled audio.
  - **Michael** went through the same checks, on all 2,747 clips. Every clip decodes in Chromium within 2 ms of the manifest. Whisper `base.en` gave a 1.5% word error rate.
  - Flagged clips were rechecked with `small.en` beside Heart. Michael's final consonants are softer ("squat" can sound like "squad", "sides" like "side"). That's the voice: other speeds and endings didn't change it.
  - His bare "50", "60" and "70" sounded like "15", "16" and "17". They're now cut from "Fifty times." etc. (`TAKES`). All 69 clips with a teen or a round ten now come through.
  - He was re-recorded once with the fixed recorder, before shipping. His first take was cut mid-breath in ~40% of clips.
- **Other speech changes.**
  - Spoken per-side targets now say "each side".
  - Play lines are built from recorded sentences (`spokenMove()`).
  - A line that fails instantly keeps its caption up for its estimated length.
  - Interrupted lines now settle their promises.

### 4. Updating from the phone (PR #6)
- **Checks on return.** `src/app/pwa.ts` looks for a new version at launch, hourly, and whenever the app comes back to the foreground (at most every 5 minutes). A phone usually resumes a Home Screen app instead of relaunching it, so before this the "new version" bar could wait until the app was force-closed.
- **Settings › Check for updates** (`UpdateRow` in `src/features/more/MorePage.tsx`). It shows the version you're on (`__APP_BUILD__`: build date and commit, set in `vite.config.ts`). If there's a newer version, it downloads it and reloads into it; otherwise it says you're up to date or offline.
- **Never stuck on "Updating".** After telling the new version to take over, the app reloads anyway after 3 seconds. The takeover event never fires on a page the old version didn't control (e.g. the first visit after installing).

### 5. Onboarding lands on Today once
- `finish()` in `src/features/onboarding/OnboardingPage.tsx` saves the plan, then the profile. Saving the profile is what takes you to Today (`OnlyNewUsers` in `src/App.tsx`).
- It used to navigate a second time after both saves. That navigation could land after you'd already moved on, and it made the "deck of cards" e2e test fail now and then.

### 6. Phone notifications instead of calendar events (2026-10-13)
David found the calendar reminders too much: the Coach style puts 15 repeating events in the calendar. Smart notifications (push) were already built and the production server is set up (`/api/push/config`: Blob, passcode and cron secret configured; the GitHub clock runs). So this makes switching easy, without changing how either mode works.
- **The choices say what they do.** Settings → Reminders checks the server on open, for both choices. "Phone reminders" now says it adds events to your calendar. "Smart notifications" shows **Ready** and "Nothing in your calendar" when the server is set up.
- **Cleanup list.** After switching to notifications, a card lists the calendar events Forge added (`calendarSeries()` in `src/state/calendar.ts`), with how to delete a repeating event in iPhone Calendar and Google Calendar.
  - "Done, they're gone" forgets the export (`forgetCalendarExport()`).
  - Exports now store their config (`CalendarExport.cfg`), so the list is exact even after the reminder settings change. Older exports fall back to the current settings when they still match.
- **Access code hint.** The form says where to find `APP_PASSCODE` in Vercel.
- The in-app guide (Forge and Bloom) and the README say the same.

### Tests
- **Results.** `npm run check` passes: typecheck, lint and 1,349 unit tests. `npm run e2e` passes all 26 phone-size tests.
- **New unit tests:**
  - `tests/unit/exclusions.test.ts`
  - `tests/unit/howto.test.ts`
  - `tests/unit/voice-clips.test.ts`
  - `tests/voice/catalog.test.ts`: the catalog covers everything the player, games and tests say, and every pack has every sentence recorded.
- **New e2e tests:** `tests/e2e/skip-howto.spec.ts` and `tests/e2e/voice.spec.ts`.
- **Updated:** the player loops in `app.spec.ts` and `bloom.spec.ts` now press the how-to's Start button.

## Current State of Services
| Service | Status | Address | Notes |
|---|---|---|---|
| Forge production (Vercel, `main`) | Live | https://forge-fitness-liard.vercel.app | Has PRs #5 and #6. Smart-notification server set up (`/api/push/config` reports Blob, passcode and cron secret) |
| Bloom production | Live (PR #4 merged) | https://forge-fitness-liard.vercel.app/bloom/ | Unaffected by this work except shared fixes |
| Vercel preview of the branch | Built by Vercel on each push | see the PR's Vercel check | Behind Vercel login |
| Local dev / preview | Not running | `npm run dev` → http://localhost:5173 · `npm run build && npm run preview` → http://localhost:4173 | |
| Reminder clock (GitHub Actions) | Runs every 15 min from `main` | POSTs `/api/tick` | Unchanged |

## Active Projects
- **dbassin12/forge-fitness:** PRs https://github.com/dbassin12/forge-fitness/pull/5 and https://github.com/dbassin12/forge-fitness/pull/6 are merged and live. Branch `claude/sharp-ramanujan-y020x1` (restarted from `main` after each merge) carries the reminders change as a draft PR.
- **dbassin12/mitzvah-calendar:** not touched this session.

## Known Issues / Gotchas
- **iPhone silent switch.** With "Play over my music" on, sounds and the natural voice use the "ambient" audio session, which follows the silent switch. Turning that setting off makes the coach speak through silent mode, but it pauses your music.
- **Repo size.** Each voice is 2,747 small MP3s: 29 MB for Heart and 33 MB for Michael, who speaks a little slower. A different take of an existing voice needs a new pack id, because clip file names stay the same and the service worker would keep serving the old audio.
- **Rare numbers.** These fall back to the phone voice unless they can be built from a count plus a phrase: "N seconds" above 120 that isn't a multiple of 5, and counts above 100.

## Next Steps
- [ ] Try it on the iPhone (PR #5 is live):
  - [ ] A workout: the how-to before each new move, "How to" mid-set, and skipping a move.
  - [ ] Settings → Exercises I skip.
- [ ] On the iPhone (PR #6 is live): Settings → Voice & sounds, compare Heart, Michael and the phone's voice.
- [ ] Switch reminders to notifications on the iPhone:
  - [ ] Settings → Reminders → Smart notifications → enter the access code (`APP_PASSCODE`) → Turn on → Allow → Send test.
  - [ ] Delete the calendar events the card lists, then tap "Done, they're gone".
  - [ ] Too many? Pick Gentle (about 2 a day) instead of Coach (about 8).
- [ ] Optional: record a Bloom voice. Make the catalog app-aware (run it with the brand mocked as Bloom, as `tests/unit/bloom-mode.test.ts` does), add a calm pack, and enable `VOICE_PACKS` for Bloom.

## Don't Touch
- **`src/app/brand.ts`:** the `dbName` / `storagePrefix` / `base` values (`forge`/`bloom`, `/`/`/bloom/`). Changing them orphans data already on phones and breaks the install scope.
- **`public/bloom/manifest.webmanifest`:** `id`, `scope` and `start_url` (`/bloom/`). A new `id` makes phones treat Bloom as a different app.
- **Service-worker registration in `src/app/pwa.ts`** (scope = `APP.base`) **and the per-app shells in `src/sw.ts`.** Forge must stay at `/` and Bloom at `/bloom/`.
- **`vercel.json` rewrites and the manifest header.** They're ordered so `icons/`, `splash/`, `voice/` and the manifests are served as files.
- **`.github/workflows/fitness-reminders.yml`:** the shared reminder clock for both apps.
- **Clip ids (`src/voice/voiceKey.ts`).** Changing how sentences are normalized or hashed renames every recording. Re-run `npm run voice` if you do.
- **Bloom's behavior.** Every Forge-only difference goes through `isBloom` / `APP` / `program === 'yoga'`.
