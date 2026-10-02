# Forge — calisthenics & nutrition coach

Forge is a personal, installable phone app (a Progressive Web App) for short,
personalized calisthenics + dumbbell workouts, animated and voiced exercise
guides, calorie tracking and smart reminders.

> This folder is self-contained and deploys to its own Vercel project
> (root directory `fitness-app/`). The Mitzvah Calendar site at the repo root
> is unrelated and unaffected.

## Develop

```sh
cd fitness-app
npm install
npm run dev        # http://localhost:5173
npm run check      # typecheck + lint + unit tests
npm run build      # production build (dist/)
npm run e2e        # Playwright phone-size end-to-end tests
```

More documentation (install-on-phone guide, reminders setup, AI setup,
architecture) is added as the app is built.
