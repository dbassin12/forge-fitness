# System Status
*Last updated: 2026-10-07 17:55 UTC*
*Session summary: Built **Bloom**, a gentle yoga app for Michal, as a second app inside the Forge repo (it lives at `/bloom/`). All work is pushed to `claude/stoic-gauss-qogxju` and open as draft PR #4. The PR is green and only needs to be merged.*

## What Changed This Session

Three commits on `claude/stoic-gauss-qogxju`, branched from `main` at `a7bc192`. Together they change 133 files (+7114 / −644).

| Commit | Time (UTC) | What |
|---|---|---|
| `a57147f` | 2026-10-07 16:35 | App-flavor system, Bloom's entry page and icons, the yoga poses and their animations, and the practice generator |
| `5e9a5e0` | 2026-10-07 17:02 | Bloom versions of the screens, Breathe tab, quests/badges/levels, local `/bloom` redirect, README |
| `e3b9483` | 2026-10-07 17:23 | Bloom check-in, Progress, weekly recap, guide, Ask Claude, reminders, and the tests |

### Where things live
- **Which app is running.** `src/app/brand.ts` exports `APP`, `isBloom`, `W` (everyday words, such as "practice" in Bloom vs "workout" in Forge), `storageKey` and `asset`. `src/app/appId.ts` maps a path to an app.
  - `bloom/index.html` stamps `data-app="bloom"`, and everything reads the flavor from there.
  - `public/bloom/` holds Bloom's manifest, icons and splash screens.
  - `vite.config.ts` builds the second page and redirects `/bloom` to `/bloom/` in `npm run dev` and `npm run preview`.
  - `vercel.json` has the `/bloom` rewrites.
- **Look.** `src/styles.css` overrides the color tokens under `[data-app="bloom"]` (dusk plum in dark mode, warm paper in light). `src/app/theme.ts` has Bloom's accent colors. Bloom's mascot, Lila, is in `src/ui/Mascot.tsx`.
- **Poses.** Definitions are in `src/data/exercises/yoga.ts`, the spoken copy in `src/data/exercises/copy/yoga.ts`, and the animations in `src/anim/families/yoga.ts`.
- **Practice generator.** `src/engines/plan/yoga.ts` has the themes, fits a practice to the chosen minutes (45 max) and builds the mini flows. Related pieces:
  - `src/engines/plan/templates.ts`: `yogaRotation`, `rotationFor`, `programName`.
  - `src/engines/plan/ladders.ts`: the `y_*` ladders and `laddersFor(program)`.
- **Breathe tab.** `src/engines/breath.ts` (the logic), `src/features/breathe/` (the screens) and `src/state/breathe.ts` (saved as workouts with a `breathe:` key).
- **Bloom-only content:**
  - tips: `src/data/tips/bloom.ts`
  - quests: `src/engines/quests.ts` (`questDef`, plus a yoga branch in `pickQuests`)
  - badges and level titles: `src/engines/gamification/achievements.ts` (`BLOOM_ACHIEVEMENTS`) and `xp.ts`
  - reminders: `shared/reminder-rules.ts` (`bloomText`, `reminderLabel`, and `presetRules(…, { app })`)
  - Ask Claude prompt and summary: `src/features/claude/handoff.ts` (`BLOOM_GUIDE`) and `src/features/coach/context.ts`
  - 4-week check-in: `src/features/onboarding/BloomCheckIn.tsx`
  - onboarding choice lists: `src/features/onboarding/choices.ts`
- **Tests:**
  - `tests/unit/yoga.test.ts`, `breath.test.ts` and `bloom.test.ts`
  - `tests/unit/bloom-mode.test.ts`, which mocks `@/app/brand` so modules run as Bloom
  - `tests/e2e/bloom.spec.ts`
- **Docs.** The README now has a "Bloom" section and steps for running it locally.

### Verified at 2026-10-07 17:23 UTC
- `npm run check` passes: typecheck, lint, and 1313 unit tests.
- `npm run e2e` passes all 20 phone-size tests, 3 of them Bloom.
- `npm run build` emits `dist/index.html` and `dist/bloom/index.html`.
- I walked through every Bloom screen in a phone-size browser, in dark and light mode, with no console errors.

## Current State of Services
| Service | Status | Address | Notes |
|---|---|---|---|
| Forge production (Vercel, `main`) | Live | https://forge-fitness-liard.vercel.app | Unchanged until PR #4 is merged |
| Bloom production | **Not live yet** | https://forge-fitness-liard.vercel.app/bloom/ | Goes live automatically when PR #4 merges. Same Vercel project, no extra setup |
| Vercel preview of the branch | Ready (deploy of `e3b9483`) | https://forge-fitness-git-claude-stoic-gauss-qogxju-dbassin12s-projects.vercel.app/bloom/ | Behind Vercel login: opens for David, not for Michal |
| Local dev server | Not running | `npm run dev` → http://localhost:5173/bloom/ | Forge is at http://localhost:5173 |
| Local production preview | Not running | `npm run build && npm run preview` → http://localhost:4173/bloom/ | Playwright e2e builds and serves this itself |
| Reminder clock (GitHub Actions `.github/workflows/fitness-reminders.yml`) | Runs every 15 min from `main` | POSTs `https://forge-fitness-liard.vercel.app/api/tick` | Serves both apps; Bloom phones register with `app: 'bloom'` |
| Smart-notification server (`api/push/*`, `api/tick`) | Whatever is already set up for Forge (not checked this session) | Vercel env: `APP_PASSCODE`, `CRON_SECRET`, `VAPID_*`, `BLOB_READ_WRITE_TOKEN` | Bloom uses the same server and passcode. Calendar ("phone") reminders need none of this |

## Active Projects
- **dbassin12/forge-fitness**
  - Branch `claude/stoic-gauss-qogxju` is at `e3b9483`, pushed, with a clean tree.
  - Draft PR: https://github.com/dbassin12/forge-fitness/pull/4. The Vercel deploy is green, there are no review comments, and there's no merge conflict (the branch contains `main` at `a7bc192`).
  - It is waiting only on David to mark it ready and merge.
- **dbassin12/mitzvah-calendar**: not touched this session.

## Known Issues / Gotchas
- **Preview links need a Vercel login.** Michal can only use Bloom from the production address once the PR is merged.
- **Plain `http` on a phone runs the app, but not everything works.** `npm run dev -- --host` and opening the Network address plus `bloom/` works, but Add to Home Screen, offline mode and notifications need `https` (the Vercel address).
- **Data stays on each phone, per app.** Bloom stores everything in an IndexedDB database named `bloom`, and Forge in one named `forge`; nothing syncs between devices. Use Settings → Backup & data to move to a new phone.
- **Playwright locally.** `playwright.config.ts` uses `/opt/pw-browsers/chromium` only when that path exists (the cloud container). On your own machine, run `npx playwright install chromium` once before `npm run e2e`.
- **A cloud check-in is still scheduled.** The routine "Check Bloom PR #4" (`trig_01U7AbVg2RnEuJoTGXpHeJ7g`) fires at 2026-10-07 18:14 UTC into the cloud session. It only re-reads the PR's state. Delete it from your Routines list if you're continuing locally.
- **Nothing is half-done.** Every item from this session is finished and pushed.

## Next Steps
- [ ] Get the code on your computer:
  ```sh
  git clone https://github.com/dbassin12/forge-fitness   # or cd into your copy
  cd forge-fitness
  git fetch origin && git checkout claude/stoic-gauss-qogxju && git pull
  npm install
  npm run dev        # open http://localhost:5173/bloom/  (needs Node 22, or 20.19+)
  ```
- [ ] Try Bloom: run onboarding, then a 3-minute mini flow, the Breathe tab and the check-in on the Progress tab.
- [ ] Merge PR #4: mark it **Ready for review** (it's a draft), then **Merge**. Vercel deploys `main` within a couple of minutes.
- [ ] On Michal's iPhone:
  - [ ] In Safari, open https://forge-fitness-liard.vercel.app/bloom/, then tap **Share → Add to Home Screen**, and open Bloom from the new icon.
  - [ ] Go through setup. Tick **I'm pregnant** if it applies; it skips belly-down poses, deep twists and core work on the back.
  - [ ] Turn on reminders: **Settings → Reminders → Add to my calendar**.
- [ ] Optional polish, not started:
  - Count mountain breath in "breaths" rather than "rounds".
  - Keep the pregnancy safety tip off Lila's first-day tip slot unless pregnancy is ticked.
  - Add a Hebrew version if Michal would prefer it.
- [ ] To keep working with Claude on your computer, open the clone in the Claude Desktop app or run `claude remote-control` inside it, and point it at this file.

## Don't Touch
- **`src/app/brand.ts`:** the `dbName` / `storagePrefix` / `base` values (`forge`/`bloom`, `/`/`/bloom/`). Changing them orphans data already on phones and breaks the install scope.
- **`public/bloom/manifest.webmanifest`:** `id`, `scope` and `start_url` (`/bloom/`). A new `id` makes phones treat Bloom as a different app.
- **Service-worker registration in `src/app/pwa.ts`** (scope = `APP.base`) **and the per-app shells in `src/sw.ts`.** Forge must stay at `/` and Bloom at `/bloom/`.
- **`vercel.json` Bloom rewrites and the manifest header.** They're ordered so `icons/`, `splash/` and the manifest are served as files.
- **`.github/workflows/fitness-reminders.yml`:** the shared reminder clock for both apps.
- **Forge's behavior.** Every Bloom difference goes through `isBloom` / `APP` / `program === 'yoga'`. Keep Forge's wording and tests unchanged when editing shared screens.

## Where the files are on your computer
If you downloaded `forge-fitness-bloom.zip` from the Claude app, it's in your Downloads folder. Double-click it to unzip, which gives you:
- **Mac:** `~/Downloads/forge-fitness/` (that is, `/Users/<you>/Downloads/forge-fitness/`)
- **Windows:** `C:\Users\<you>\Downloads\forge-fitness\`

The zip is a full git checkout of `claude/stoic-gauss-qogxju`, with history and the GitHub remote. It leaves out `node_modules`, so run `npm install` once. You can also get the same folder with `git clone https://github.com/dbassin12/forge-fitness` and `git checkout claude/stoic-gauss-qogxju`.

Inside `forge-fitness/`:
- `STATUS.md`: this handoff
- `README.md`: the "Bloom" section and how to run it
- `bloom/index.html`: Bloom's page; the app opens at `/bloom/`
- `src/app/brand.ts`: the Forge/Bloom switch (`isBloom`, `APP`, `W`)
- `src/`: everything else, laid out as in "Where things live" above
- `tests/unit/bloom*.test.ts` and `tests/e2e/bloom.spec.ts`: Bloom's tests

## Prompt for a local Claude session
Open `~/Downloads/forge-fitness` in the Claude Desktop app, or run `claude` (or `claude remote-control`) inside that folder, and paste:

> You're picking up work on my repo dbassin12/forge-fitness, unzipped at ~/Downloads/forge-fitness (this folder). Read STATUS.md here first; it's the handoff from the previous session.
>
> Context: I asked for a gentle yoga app for my wife Michal, who wants yoga rather than intense workouts. It's built as "Bloom", a second app in this repo at /bloom/ that shares the engine of Forge, my calisthenics app at /. Forge must keep working exactly as before. All the work is on branch `claude/stoic-gauss-qogxju` (already checked out here), open as draft PR #4.
>
> 1. Run `git pull` to pick up anything newer, then `npm install` and `npm run check`, and tell me if anything fails.
> 2. Start `npm run dev` and give me the Bloom address (http://localhost:5173/bloom/) so I can try it.
> 3. Then wait for what I want to change. Route every Bloom difference through `isBloom` / `APP` from `src/app/brand.ts`, keep Forge's behavior and tests unchanged, and follow the "Don't Touch" list in STATUS.md. Before you push, run `npm run check`, plus `npm run e2e` for UI changes (run `npx playwright install chromium` once first).
