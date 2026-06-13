# 📚 ClassMate

> Your university class management companion — a calendar-first PWA that keeps your
> classes, notes, quizzes, homework and teachers organized, and reminds you before
> things happen (even when the app is closed).

ClassMate is a **Progressive Web App** built with a **Next.js** frontend and a
**NestJS** backend, using a **direct SQLite (`.db`) database** via **Prisma**.

---

## ✨ Features

| # | Feature | Status |
|---|---------|--------|
| 1 | **Calendar home** — week view of all classes, today highlighted, next class surfaced | 🚧 |
| 2 | **Onboarding** — set semester name, start date and end date | 🚧 |
| 3 | **Settings** — enable notifications + send a test notification | 🚧 |
| 4 | **Notes** — add & manage notes per class of each course | 🚧 |
| 5 | **Quizzes** — date + topics/syllabus per quiz | 🚧 |
| 6 | **Teachers** — email & phone per class/course | 🚧 |
| 7 | **Reminders** — pre-class push (class no. + course), weekend + day-before quiz study reminders | 🚧 |
| 8 | **Homework / assignments** — with submission-date reminders | 🚧 |
| 9 | **Auth** — full name / institute / student ID signup + login, **email OTP** via Resend | 🚧 |

**Extras we add:** attendance tracking, grade/CGPA tracker, a "today" focus card,
exportable timetable, and per-category email-notification toggles so you only spend
your email quota where it matters.

---

## 🏗️ Architecture

```
ClassMate/
├── frontend/            # Next.js (App Router) PWA — UI, service worker, web-push client
├── backend/            # NestJS REST API
│   └── database/        # SQLite .db file lives here (gitignored)
├── docs/                # Detailed design & spec documents
├── AGENTS.md            # Guide for AI agents / contributors working in this repo
└── README.md
```

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, PWA (service worker + Web Push) |
| Backend | NestJS 11, TypeScript, Prisma ORM |
| Database | SQLite (single `.db` file in `backend/database/`) |
| Auth | JWT (access + refresh), email OTP |
| Email | [Resend](https://resend.com) |
| Push | Web Push (VAPID) + `@nestjs/schedule` cron scheduler |

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)
for details.

---

## 🚀 Getting started

> Prerequisites: Node 20+ and pnpm.

```bash
# Backend
cd backend
cp .env.example .env          # then fill in secrets (see below)
pnpm install
pnpm prisma migrate dev       # creates database/classmate.db
pnpm start:dev                # API on http://localhost:4000

# Frontend (in a second terminal)
cd frontend
cp .env.example .env.local
pnpm install
pnpm dev                      # web on http://localhost:3000
```

### Required environment variables (backend)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | `file:./database/classmate.db` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | token signing |
| `RESEND_API_KEY` | email + OTP delivery |
| `MAIL_FROM` | verified sender address |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | web push (generate with `pnpm web-push generate-vapid-keys`) |

See [`docs/SETUP.md`](docs/SETUP.md) for the full walkthrough.

---

## 🎨 Design

Light, **playful & neutral** — soft rounded cards, friendly accent color, generous
spacing, mobile-first. No dark theme by default. Rationale and tokens live in
[`docs/UI_UX.md`](docs/UI_UX.md).

---

## 🤝 Contributing

Read [`AGENTS.md`](AGENTS.md) before making changes — it documents conventions,
commands and the data model so both humans and AI agents stay consistent.

---

## 📄 License

MIT (see [`LICENSE`](LICENSE)).
