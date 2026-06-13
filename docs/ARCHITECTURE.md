# Architecture

## Overview

ClassMate is split into two deployable apps that share a typed contract:

```
┌─────────────────────────┐         HTTPS / JSON        ┌──────────────────────────┐
│        frontend         │  ───────────────────────▶  │         backend          │
│  Next.js App Router PWA │                              │       NestJS API         │
│  - UI / calendar        │  ◀───────────────────────  │  - REST controllers      │
│  - service worker       │      Web Push (VAPID)       │  - services (business)   │
│  - push subscription    │  ◀───────────────────────  │  - Prisma data layer     │
└─────────────────────────┘                              │  - @nestjs/schedule cron │
                                                         └────────────┬─────────────┘
                                                                      │ Prisma
                                                              ┌───────▼────────┐
                                                              │  SQLite (.db)   │
                                                              │ backend/database│
                                                              └────────────────┘
                                          Resend ◀── email (OTP + opt-in reminders)
```

## Backend (NestJS)

- **Modules** (`src/modules/*`): `auth`, `users`, `semesters`, `courses`,
  `class-sessions`, `teachers`, `notes`, `quizzes`, `homework`, `notifications`.
- **PrismaModule / PrismaService**: a single shared Prisma client; injected into
  services. All DB access goes through Prisma.
- **Common** (`src/common/*`): `JwtAuthGuard`, `@CurrentUser()` decorator, global
  `ValidationPipe`, global exception filter, response shaping.
- **Auth**: email + password signup with **email OTP** verification (Resend). JWT
  access token (15 min) + refresh token (7 days, hashed in DB, rotated).
- **Scheduling**: `@nestjs/schedule` runs cron jobs (every few minutes) that scan
  upcoming classes / quizzes / homework and dispatch web-push + (opt-in) email
  reminders. A `NotificationLog` row prevents duplicate sends.

### Request lifecycle
`Controller (DTO validation) → Guard (JWT) → Service (ownership-scoped Prisma) →
Prisma → SQLite`. Responses are plain JSON; errors pass through the global filter.

## Frontend (Next.js)

- **App Router** under `src/app`. Auth pages (`/login`, `/signup`, `/verify`),
  onboarding (`/onboarding`), the calendar **home** (`/`), and feature areas
  (`/courses`, `/quizzes`, `/homework`, `/notes`, `/settings`).
- **Typed API client** (`src/lib/api`) wraps `fetch`, attaches the access token,
  and transparently refreshes on 401.
- **PWA**: `public/manifest.webmanifest` + a service worker registered on load.
  The service worker handles `push` events → `showNotification`, and notification
  clicks → focus/open the relevant route.
- **Web Push subscribe**: Settings asks permission, subscribes with the public
  VAPID key, and POSTs the subscription to the backend.

## Why these choices

- **SQLite + Prisma**: "direct .db access" with zero server ops, plus migrations
  and type safety. Perfect for a single-user-per-device class manager.
- **NestJS**: structured modules, DI, guards and a first-class scheduler — ideal
  for the reminder engine.
- **Web Push over polling**: reminders fire with the app closed (Android/desktop;
  iOS 16.4+ requires the PWA installed to the home screen).
