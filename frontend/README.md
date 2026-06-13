# ClassMate — Frontend (Next.js PWA)

The ClassMate web client: a calendar-first **Progressive Web App** built with
**Next.js 16 (App Router)**, **React 19**, **TypeScript** and **Tailwind CSS v4**.

## Run

```bash
pnpm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL + NEXT_PUBLIC_VAPID_PUBLIC_KEY
pnpm dev                     # http://localhost:3000
```

Requires the [backend](../backend) running (default `http://localhost:4000`).

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL of the NestJS API |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public VAPID key (matches backend) for web push |

## Structure

```
src/
├── app/                     # routes (App Router, client components)
│   ├── (auth)/              # login, signup, verify, forgot-password
│   ├── onboarding/          # semester setup
│   ├── page.tsx             # home — calendar week + next class + agenda
│   ├── courses/             # list + [id] detail (schedule, teachers, notes)
│   ├── quizzes/ homework/ notes/   # feature screens
│   └── settings/            # notifications, email prefs, profile
├── components/
│   ├── ui/                  # Button, Card, Input, Sheet, Toast, icons …
│   └── layout/              # AppShell, BottomNav, AuthGuard
└── lib/                     # api client, auth context, push, types, utils
public/                      # manifest.webmanifest, sw.js, icons
```

## PWA

- `public/manifest.webmanifest` + generated icons (`scripts/generate-icons.mjs`).
- `public/sw.js` handles web-push `push` events and notification clicks.
- Settings → "Enable notifications" subscribes via the service worker and posts
  the subscription to the backend; "Send test notification" verifies delivery.

## Design

Light, playful & neutral. Tokens live in `src/app/globals.css` (`@theme`).
See [`../docs/UI_UX.md`](../docs/UI_UX.md).

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | dev server |
| `pnpm build` / `pnpm start` | production build / serve |
| `pnpm lint` | eslint |
| `node scripts/generate-icons.mjs` | regenerate PWA PNG icons |
