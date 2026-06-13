# AGENTS.md

Operating guide for AI agents (and humans) working in the **ClassMate** repository.
Read this before making changes. Keep it up to date when conventions change.

---

## 1. What this project is

ClassMate is a **PWA for university class management**. A student onboards with a
semester, adds courses → classes, attaches notes/quizzes/homework/teachers, and
receives reminders (web push + optional email) before classes, quizzes and
homework deadlines.

- **Frontend:** `frontend/` — Next.js (App Router) PWA.
- **Backend:** `backend/` — NestJS REST API.
- **Database:** SQLite file at `backend/database/classmate.db`, accessed via **Prisma**.

There is **no hosted database server** — the database is a single local `.db` file
("direct .db access").

---

## 2. Repository layout

```
ClassMate/
├── frontend/                 # Next.js PWA
│   ├── src/app/              # App Router routes
│   ├── src/components/       # Reusable UI
│   ├── src/lib/              # API client, auth, push, utils
│   └── public/               # manifest.webmanifest, icons, service worker
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── modules/          # feature modules (auth, courses, classes, ...)
│   │   ├── prisma/           # PrismaService + module
│   │   └── common/           # guards, decorators, filters, pipes
│   ├── prisma/schema.prisma  # data model + migrations
│   └── database/             # the .db file (gitignored)
├── docs/                     # specs & design docs (source of truth for behavior)
└── AGENTS.md / README.md
```

---

## 3. Commands

Run these from the relevant package directory.

### Backend (`backend/`)
| Command | Purpose |
|---------|---------|
| `pnpm install` | install deps |
| `pnpm start:dev` | run API in watch mode (port 4000) |
| `pnpm prisma migrate dev --name <name>` | create + apply a migration |
| `pnpm prisma generate` | regenerate Prisma client |
| `pnpm prisma studio` | inspect the DB |
| `pnpm lint` / `pnpm test` | lint / unit tests |

### Frontend (`frontend/`)
| Command | Purpose |
|---------|---------|
| `pnpm install` | install deps |
| `pnpm dev` | run Next dev server (port 3000) |
| `pnpm build` / `pnpm start` | production build / serve |
| `pnpm lint` | lint |

---

## 4. Conventions

- **Language:** TypeScript everywhere. `strict` mode on. No `any` unless justified.
- **Backend style:** standard NestJS — modules expose a controller + service; DTOs
  use `class-validator`; Prisma access is centralized in `PrismaService`.
- **Validation:** every request body/query is validated by a DTO (global
  `ValidationPipe`, `whitelist: true`).
- **Auth:** JWT access token (short-lived) + refresh token. Protected routes use
  `JwtAuthGuard`. Current user injected via a `@CurrentUser()` decorator.
- **Ownership:** every domain row is scoped to a `userId`. Services must filter by
  the authenticated user — never return another user's data.
- **Errors:** throw Nest `HttpException` subclasses; a global filter shapes the JSON.
- **Frontend style:** App Router server/client components; data fetching through the
  typed API client in `src/lib/api`. Tailwind for styling; design tokens in
  `globals.css` / `tailwind.config`. See `docs/UI_UX.md`.
- **Dates:** store UTC ISO strings; class times stored as day-of-week + local time.
  Treat the user's semester timezone consistently (default to the browser TZ).
- **Naming:** files `kebab-case.ts`; Nest classes `PascalCase`; React components
  `PascalCase`. REST routes are plural nouns (`/courses`, `/quizzes`).

---

## 5. Secrets & environment

- **Never commit secrets.** `.env` files are gitignored. Each package has a
  committed `.env.example` with placeholders.
- Secrets live in `backend/.env`: `RESEND_API_KEY`, `JWT_*_SECRET`, `VAPID_*`.
- The frontend only ever sees **public** values (e.g. `NEXT_PUBLIC_API_URL`,
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY`).
- If a secret is ever exposed, rotate it.

---

## 6. Notifications model

Two channels, both opt-in:
1. **Web Push** (primary) — VAPID + service worker. The backend stores push
   subscriptions and a `@nestjs/schedule` cron job dispatches:
   - a reminder before **each class** (class number + course name),
   - a **weekend** study reminder for upcoming quizzes,
   - a **day-before** quiz reminder,
   - **homework/assignment due** reminders.
2. **Email** (Resend) — the user chooses *per category* which reminders also go to
   email (to conserve email quota). Default: quizzes + assignments only.

Notification preferences live on the user/settings record. Always check prefs
before dispatching.

---

## 7. Data model (summary)

`User` → `Semester` → `Course` → `ClassSession` (recurring weekly slots).
`Course` also has `Teacher`(s), `Quiz`(zes), `Homework`. `Note`s attach to a
`Course` and optionally a specific `ClassSession`. `PushSubscription` and
`NotificationPreference` belong to `User`. `OtpToken` backs email verification.

The authoritative schema is `backend/prisma/schema.prisma`; the narrative version is
`docs/DATA_MODEL.md`. **When you change the schema, update `docs/DATA_MODEL.md` and
create a migration.**

---

## 8. Git workflow

- Work on **feature branches**: `feat/<area>`, `fix/<area>`, `docs/<area>`,
  `chore/<area>`.
- **Meaningful commits**: one logical change per commit, imperative subject
  (`feat(auth): add email OTP verification`). Conventional-commit prefixes.
- Open work merges back to `main`. Push branches to `origin`
  (`github.com/Rezwoan/ClassMate`).
- Do **not** commit `.db` files, `node_modules/`, build output, or `.env`.

---

## 9. When you finish a change

1. Run the relevant `lint` / `test` / `build`.
2. If you touched the schema → migration + `docs/DATA_MODEL.md`.
3. If you changed behavior/structure → update the relevant `docs/*.md` and this file.
4. Commit with a clear conventional-commit message on a feature branch.
