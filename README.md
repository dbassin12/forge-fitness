# Forge — calisthenics & nutrition coach

Forge is a personal phone app for short, personalized home workouts (bodyweight plus a pair of
dumbbells), animated and voiced exercise guides, calorie and protein tracking, and reminders
that nudge you to train, eat well and drink water. It installs from the browser like a native
app, works offline, and keeps your data on your phone.

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
- **Play.** Games that sneak in a workout: **Spin the wheel** (a random move, with combo XP for
  spins in a row), **Deck of cards** (the suit picks the move, the number is the reps; quick,
  half or full deck, best times) and **record challenges** (plank, push-up blitz, squat sprint,
  wall sit, jack attack) with tap-to-count and personal bests. Every move matches your level,
  equipment and aches.
- **Daily quests and rewards.** Three small goals a day (one to move, one to eat well, a bonus)
  with XP and a perfect-day bonus. XP and levels unlock accent colors and gear for **Ember**,
  Forge's flame mascot, who gives the daily tip and reacts to your day. 40 achievements on a
  trophy shelf with progress bars, a weekly-goal streak with freezes, celebrations with confetti,
  sound effects and vibration, and a weekly recap you can tap through like a story.
- **Progress.** Weight trend, workouts per week, calories and protein charts, measurements,
  progress photos, a skill path for every movement and a fitness retest every 4 weeks.
- **Make it yours.** Auto, dark or light theme; six accent colors; a coach personality (Hype,
  Calm, Drill sergeant or Zen) that changes what the voice coach and reminders say; and
  switches for sounds, vibration, confetti and animations.
- **Reminders.** Real push notifications (even with the app closed) for workouts, a streak
  saver, meals, water, movement snacks, an evening check-in, weigh-ins and the weekly review —
  plus an "Add to calendar" backup.
- **Instructions built in.** A "Get started" checklist for your first days, a **How Forge
  works** guide with an FAQ, voiced tutorials and a "Try a set" button on every exercise.
- **Ask Claude, on your Claude subscription.** Coach questions open the Claude app with a
  summary of your plan, food and workouts attached. Meal estimates work the same way: snap
  the photo in Claude, paste its answer back into Forge, then review and log. No API key.

## Install it on your phone

1. Open the app's address (`https://forge-fitness-liard.vercel.app`) on your phone.
2. **iPhone (iOS 16.4 or newer):** in **Safari**, tap **Share** → **Add to Home Screen** →
   **Add**. Then open Forge from the new icon. (Notifications only work from the Home Screen
   icon, not from a Safari tab.)
3. **Android:** in **Chrome**, tap **Install app** when it's offered, or **⋮** →
   **Add to Home screen** / **Install app**.
4. Open Forge, finish the short setup, and you're on today's plan.
5. Turn on reminders: **Settings (gear on Today) → Reminders**, enter your access code (the `APP_PASSCODE` below),
   tap **Turn on**, allow notifications, then **Send test**.

Your data lives on the phone. Use **Settings → Backup & data → Export backup** now and then
(especially before switching phones), and **Protect** storage so the browser won't clear it.

## Put it online (Vercel, about 10 minutes)

You need a free [Vercel](https://vercel.com) account connected to GitHub.

1. **Create the project.** Vercel → **Add New… → Project** → import `dbassin12/forge-fitness`
   and keep the project name `forge-fitness` (the Vite preset and build settings come from
   `vercel.json`). Deploy.
2. **Add storage for reminders.** In the project → **Storage** → **Create** → **Blob**, choose
   **Private** access, and connect it to the project (all environments). This adds
   `BLOB_READ_WRITE_TOKEN` automatically.
3. **Set environment variables** (project → **Settings → Environment Variables**):

   | Variable | Needed for | Notes |
   |---|---|---|
   | `APP_PASSCODE` | reminders | Any long phrase. Your phone sends it with every request. |
   | `CRON_SECRET` | recommended | Any long random string. Turns on the daily safety-net check and lets an outside scheduler call the reminder tick (see below). |
   | `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | optional | Web-push keys. If unset, a pair is generated once and stored privately. |

   Then **Deployments → ⋯ → Redeploy** so the new settings take effect.
4. **Start the reminder clock.** Merge this work into `main`. The GitHub Actions workflow
   `.github/workflows/fitness-reminders.yml` then runs every 15 minutes and asks the app to send
   any due reminders. It signs in with a short-lived GitHub token, so there's no secret to copy.
   If your app isn't at `https://forge-fitness-liard.vercel.app`, add a repository **variable**
   `FORGE_TICK_URL` (GitHub → Settings → Secrets and variables → Actions → Variables) set to
   `https://<your-domain>/api/tick`.
5. **Check it.** On the phone: **Settings (gear on Today) → Reminders** shows when the scheduler last ran and warns
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
- **Zero-setup backup:** **Settings → Reminders → Add workouts to my calendar** downloads an
  `.ics` file with alarms that your phone's calendar will always deliver.

### Ask Claude: how it works

Forge never calls an AI service itself, and there's no API key to set. **Ask Claude** copies
your question with a short text summary of your profile, plan and recent logs, then opens
claude.ai, which opens the Claude app if it's installed, so it runs on your own Claude
subscription. You can see exactly what's shared under "What Claude will see". For meal
estimates, Forge copies a request that asks Claude to answer in a format Forge can read. You
add your photo in Claude, then paste the reply back into Forge to check portions before
anything is logged.

## How it's built

```
Phone (PWA, offline-first)                     Vercel project
┌─────────────────────────────────────┐        ┌───────────────────────────────────────────┐
│ React UI · plan/progression/        │  HTTPS │ Static app (CDN)                          │
│ nutrition/meal/XP engines           ├───────►│ /api/push/*  config · sync · ack · test   │──► push services
│ Animation + voice engines           │        │ /api/tick    send due reminders           │
│ IndexedDB (Dexie): all your data    │        │ /api/food/search  Open Food Facts proxy   │
│ Service worker: offline + push      │◄───────│                                           │
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
| `shared` | Code used by both the app and the server (reminder rules and scheduling) |
| `server`, `api` | Vercel functions and their helpers |

## Develop

```sh
npm install
npm run dev        # http://localhost:5173 (API routes need `vercel dev`)
npm run check      # typecheck + lint + unit/API tests
npm run build      # production build (dist/)
npm run e2e        # Playwright end-to-end tests at phone size (builds and serves dist/)
npm run anim:sheet # render animation contact sheets to anim-sheets/
```

The Animation Lab at `/#/lab` shows every exercise animation with a scrubber.
