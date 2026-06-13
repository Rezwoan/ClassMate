# Roadmap

Build order (each phase ships on a feature branch and merges to `main`).

## Phase 0 — Foundation ✅
- Repo, `.gitignore`, README, AGENTS.md, docs, GitHub remote.

## Phase 1 — Backend scaffold + data model ✅
- NestJS app, Prisma + SQLite, full `schema.prisma`, first migration, env wiring,
  global validation + exception filter, health check.

## Phase 2 — Auth + email OTP ✅
- Signup (full name, institute, student ID, email, password), login, JWT
  access/refresh, email verification via 6-digit OTP (Resend), guards + current-user.

## Phase 3 — Core domain ✅
- Semesters (onboarding), Courses, ClassSessions, Teachers, Notes, Quizzes,
  Homework — CRUD, ownership-scoped, DTO validation.
- Derived endpoints: week agenda, "next class", upcoming quizzes/homework.

## Phase 4 — Notifications engine ✅
- Web Push subscribe/unsubscribe, VAPID send, `@nestjs/schedule` cron for class /
  quiz (weekend + day-before) / homework reminders, NotificationLog dedupe,
  per-category email via Resend, test-notification endpoint.

## Phase 5 — Frontend foundation + core screens ✅
- Next.js PWA (manifest, service worker, icons), design system, API client + auth
  flow, onboarding, calendar **home**, settings (notifications + test + email prefs).

## Phase 6 — Feature screens + polish ✅
- Courses/classes management, notes, quizzes, teachers, homework screens; push
  subscribe UI; microinteractions; empty states; install prompt; final docs pass.

## Nice-to-haves (post-MVP)
- Attendance tracking per class.
- Grade / CGPA tracker.
- Recurring exceptions (cancelled/rescheduled classes, holidays).
- Calendar export (.ics) & Google Calendar sync.
- Offline-first caching of agenda.
- Multi-semester history & analytics.
