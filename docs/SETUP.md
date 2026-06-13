# Setup Guide

## Prerequisites
- **Node.js 20+** (tested on 24)
- **pnpm** (`npm i -g pnpm`)

## 1. Clone
```bash
git clone https://github.com/Rezwoan/ClassMate.git
cd ClassMate
```

## 2. Backend
```bash
cd backend
cp .env.example .env
pnpm install
```

Fill in `backend/.env`:

| Variable | How to get it |
|----------|---------------|
| `DATABASE_URL` | leave as `file:./database/classmate.db` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | any long random strings (`openssl rand -hex 32`) |
| `RESEND_API_KEY` | from the [Resend dashboard](https://resend.com) |
| `MAIL_FROM` | a verified sender, e.g. `ClassMate <noreply@yourdomain.com>` |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | run `pnpm dlx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | `mailto:you@example.com` |
| `FRONTEND_URL` | `http://localhost:3000` |

Then create the database and run:
```bash
pnpm prisma migrate dev      # creates backend/database/classmate.db
pnpm start:dev               # http://localhost:4000
```

## 3. Frontend
```bash
cd ../frontend
cp .env.example .env.local
pnpm install
pnpm dev                     # http://localhost:3000
```

Fill in `frontend/.env.local`:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | same public VAPID key as the backend |

## 4. Notifications (local testing)
- Web Push needs **HTTPS or `localhost`** — `localhost` is treated as secure, so it
  works in dev.
- Open Settings → enable notifications → "Send test notification".
- iOS only delivers web push to a PWA **installed** to the home screen (iOS 16.4+).

## 5. Email (Resend)
- In development you can send to your own verified address. To send to anyone,
  verify a domain in Resend and set `MAIL_FROM` to an address on that domain.

## Troubleshooting
- **Prisma client out of date** → `pnpm prisma generate`.
- **CORS errors** → ensure `FRONTEND_URL` matches the web origin.
- **No push received** → check the browser allowed notifications and the service
  worker is registered (DevTools → Application → Service Workers).
