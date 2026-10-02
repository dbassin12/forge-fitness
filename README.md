# Forge — calisthenics & nutrition coach

Forge is a personal phone app for short, personalized home workouts (bodyweight plus a pair of
dumbbells), animated and voiced exercise guides, calorie and protein tracking, and reminders
that nudge you to train, eat well and drink water. It installs from the browser like a native
app, works offline, and keeps your data on your phone.

> This folder is self-contained and deploys to its own Vercel project (root directory
> `fitness-app/`). The Mitzvah Calendar site at the repo root is unrelated and unaffected.

## What's inside

- **A plan built around your time.** A 2-minute setup (goal, body stats, days per week,
  minutes per session, equipment, aches, diet) builds a weekly program: full-body A/B/C for 2–3
  days, upper/lower splits for 4+. Every session is fitted to your minutes (±1 min), with a
  "Short on time?" 5/10/15-minute version and 2–5 minute exercise snacks.
- **Smart progression with fixed dumbbells.** Each movement has a ladder (e.g. wall push-up →
  incline → knee → full → diamond → decline). Hit the top of your rep range and you level up;
  at the top of a ladder Forge adds tempo, pauses, 1½ reps or a set. "Too hard" feedback and
  missed reps step you back. Every 4th week is a lighter deload week. Missed a day? The plan
  simply rolls forward.
- **Animated, voiced coaching.** 104 exercises drawn by a 2-D mannequin engine, with narrated
  tutorials (setup, movement, breathing, common mistakes with the wrong form shown, easier and
  harder versions). During workouts the voice counts reps in tempo, calls rest and "next up",
  and the screen stays awake.
- **Food and calories.** Personal calorie, protein, carb, fat, fiber and water targets;
  400 built-in foods, barcode scanning (Open Food Facts), online search, recents, favorites,
  quick add, custom foods, a weekly meal plan from 55 quick recipes with a grocery list, and a Lite
  mode that only tracks protein, veggies and water. Kosher-style, vegetarian, vegan and
  pescatarian filters (kosher-style never mixes meat and dairy in a meal).
- **Motivation and progress.** XP and levels, a weekly-goal streak with freezes, 33
  achievements, ~300 tips, a skill tree, a Sunday weekly review, weight/measurement/photo
  tracking and a fitness retest every 4 weeks.
- **Reminders.** Real push notifications (even with the app closed) for workouts, a streak
  saver, meals, water, movement snacks, an evening check-in, weigh-ins and the weekly review —
  plus an "Add to calendar" backup.
- **Optional AI coach.** With your own Anthropic API key: chat with a coach that knows your
  plan and logs, and log meals from a photo or a sentence ("2 eggs and toast"). You review
  every estimate before it's saved.

## Install it on your phone

1. Open the app's address (for example `https://forge-fitness.vercel.app`) on your phone.
2. **iPhone (iOS 16.4 or newer):** in **Safari**, tap **Share** → **Add to Home Screen** →
   **Add**. Then open Forge from the new icon. (Notifications only work from the Home Screen
   icon, not from a Safari tab.)
3. **Android:** in **Chrome**, tap **Install app** when it's offered, or **⋮** →
   **Add to Home screen** / **Install app**.
4. Open Forge, finish the short setup, and you're on today's plan.
5. Turn on reminders: **More → Reminders**, enter your access code (the `APP_PASSCODE` below),
   tap **Turn on**, allow notifications, then **Send test**.

Your data lives on the phone. Use **More → Backup & data → Export backup** now and then
(especially before switching phones), and **Protect** storage so the browser won't clear it.

## Put it online (Vercel, about 10 minutes)

You need a free [Vercel](https://vercel.com) account connected to GitHub.

1. **Create the project.** Vercel → **Add New… → Project** → import
   `dbassin12/mitzvah-calendar`. Set **Project Name** to `forge-fitness` and **Root Directory**
   to `fitness-app` (the Vite preset and build settings come from `vercel.json`). Deploy.
2. **Add storage for reminders.** In the project → **Storage** → **Create** → **Blob**, choose
   **Private** access, and connect it to the project (all environments). This adds
   `BLOB_READ_WRITE_TOKEN` automatically.
3. **Set environment variables** (project → **Settings → Environment Variables**):

   | Variable | Needed for | Notes |
   |---|---|---|
   | `APP_PASSCODE` | reminders, AI | Any long phrase. Your phone sends it with every request. |
   | `ANTHROPIC_API_KEY` | AI coach (optional) | From [console.anthropic.com](https://console.anthropic.com) → API keys. Set a monthly spend limit there too. |
   | `AI_MODEL` | optional | Pin a Claude model id. By default the newest Claude Opus model is used. |
   | `CRON_SECRET` | recommended | Any long random string. Turns on the daily safety-net check and lets an outside scheduler call the reminder tick (see below). |
   | `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | optional | Web-push keys. If unset, a pair is generated once and stored privately. |

   Then **Deployments → ⋯ → Redeploy** so the new settings take effect.
4. **Start the reminder clock.** Merge this work into `main`. The GitHub Actions workflow
   `.github/workflows/fitness-reminders.yml` then runs every 15 minutes and asks the app to send
   any due reminders. It signs in with a short-lived GitHub token, so there's no secret to copy.
   If your app isn't at `https://forge-fitness.vercel.app`, add a repository **variable**
   `FORGE_TICK_URL` (GitHub → Settings → Secrets and variables → Actions → Variables) set to
   `https://<your-domain>/api/tick`.
5. **Check it.** On the phone: **More → Reminders** shows when the scheduler last ran and warns
   if it's stale.

With `CRON_SECRET` set, a daily Vercel cron also calls the tick as a safety net: if the GitHub
clock stops, you'll get a notification saying so.

### Reminder timing and the backup options

- Reminders go out up to 5 minutes early and up to 60 minutes late (GitHub's scheduler can lag
  at busy times), and never twice. Finishing today's workout cancels that day's streak saver.
- GitHub pauses scheduled workflows after 60 days without repository activity. If reminders
  stop, open the repo's **Actions** tab and re-enable **Fitness reminders** (the health panel
  will tell you when this happens).
- **Minute-exact option:** create a free job at [cron-job.org](https://cron-job.org) that sends
  `POST https://<your-domain>/api/tick` every 5–10 minutes with the header
  `Authorization: Bearer <CRON_SECRET>`.
- **Zero-setup backup:** **More → Reminders → Add workouts to my calendar** downloads an
  `.ics` file with alarms that your phone's calendar will always deliver.

### AI costs and privacy

AI is optional and off until `ANTHROPIC_API_KEY` is set. A coach reply or a meal estimate
typically costs about 1–3¢. Your question (or meal photo, shrunk to ~1024 px) and a short text
summary of your profile, plan and recent logs are sent to Anthropic to answer; chat history
stays on your phone. Requests need your access code and are rate-limited per phone.

## How it's built

```
Phone (PWA, offline-first)                     Vercel project (root dir fitness-app/)
┌─────────────────────────────────────┐        ┌───────────────────────────────────────────┐
│ React UI · plan/progression/        │  HTTPS │ Static app (CDN)                          │
│ nutrition/meal/XP engines           ├───────►│ /api/push/*  config · sync · ack · test   │──► push services
│ Animation + voice engines           │        │ /api/tick    send due reminders           │
│ IndexedDB (Dexie): all your data    │        │ /api/food/search  Open Food Facts proxy   │
│ Service worker: offline + push      │◄───────│ /api/ai/*    coach (stream) · food        │──► Anthropic API
└─────────────────────────────────────┘  push  │ Private Blob: registry.json               │
                                               └───────────────▲───────────────────────────┘
                                   GitHub Actions every 15 min │ (OIDC-signed)
```

| Folder | What's there |
|---|---|
| `src/anim` | Mannequin rig (2-bone IK), motion sampling, SVG renderer |
| `src/data` | Exercises, foods, recipes, tips |
| `src/engines` | Pure, unit-tested logic: plan generator and fitter, progression, nutrition targets, meal planner, grocery list, XP/streaks/achievements, weekly review, tips, calendar export |
| `src/features` | Screens: onboarding, today, train, player, eat, progress, coach, more |
| `src/state` | Dexie-backed state hooks and actions |
| `src/sw.ts` | Service worker: precache, push, notification taps |
| `shared` | Code used by both the app and the server (reminder rules and scheduling, AI types) |
| `server`, `api` | Vercel functions and their helpers |

## Develop

```sh
cd fitness-app
npm install
npm run dev        # http://localhost:5173 (API routes need `vercel dev`)
npm run check      # typecheck + lint + unit/API tests
npm run build      # production build (dist/)
npm run e2e        # Playwright end-to-end tests at phone size (builds and serves dist/)
npm run anim:sheet # render animation contact sheets to anim-sheets/
```

The Animation Lab at `/#/lab` shows every exercise animation with a scrubber.
