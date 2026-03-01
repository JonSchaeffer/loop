# Loop — CLAUDE.md

Project instructions for Claude Code. Update this file as the project evolves.

## Project Overview

Loop is a web app for an executive assistant to track email follow-ups and tasks.
It replaces a manual OneNote workflow. See `plan.md` for full feature spec and architecture.

## App Name

**Loop**

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Auth**: Auth.js (NextAuth v5) — email + password
- **ORM**: Prisma
- **Database**: PostgreSQL (self-hosted in k8s; Docker Compose for local dev)
- **UI**: shadcn/ui + Tailwind CSS (light mode only)
- **Drag-to-reorder**: dnd-kit
- **Tests**: Vitest + React Testing Library (unit/integration), Playwright (E2E)
- **Linting**: ESLint + Prettier, Husky + lint-staged pre-commit hook
- **Package manager**: npm

## Key Commands

```bash
# Local dev (Docker Compose)
docker compose up           # start app + postgres
docker compose down         # stop
docker compose down -v      # stop + wipe DB volumes

# Next.js (inside container or with local Node)
npm run dev                 # dev server with hot reload
npm run build               # production build
npm run start               # start production build

# Database
npx prisma migrate dev      # apply migrations in dev
npx prisma migrate deploy   # apply migrations in prod
npx prisma studio           # browse DB in browser
npx prisma db seed          # seed initial data (categories, user)

# Testing
npm test                    # Vitest unit/integration tests (watch mode)
npm run test:run            # Vitest single run (CI)
npm run test:e2e            # Playwright E2E tests
npm run test:e2e:ui         # Playwright with UI mode

# Linting / formatting
npm run lint                # ESLint
npm run format              # Prettier write
npm run typecheck           # tsc --noEmit
```

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── (auth)/             # login route group (no nav)
│   ├── (app)/              # authenticated route group
│   │   ├── today/          # Today view (primary screen)
│   │   ├── dashboard/      # Reporting dashboard
│   │   └── layout.tsx      # App shell with nav
│   ├── api/auth/           # Auth.js route handler
│   └── layout.tsx          # Root layout
├── components/             # Shared UI components
│   ├── ui/                 # shadcn/ui primitives (do not edit manually)
│   └── ...                 # app-specific components
├── lib/                    # Shared utilities
│   ├── db.ts               # Prisma client singleton
│   ├── auth.ts             # Auth.js config
│   └── ...
├── actions/                # Next.js Server Actions (mutations)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/                  # Vitest unit/integration tests
├── e2e/                    # Playwright E2E tests
├── docker-compose.yml      # Local dev stack
├── Dockerfile
└── k8s/                    # Kubernetes manifests
```

## Environment Variables

Copy `.env.example` to `.env.local` for local dev.

```bash
# .env.example
DATABASE_URL="postgresql://loop:loop@localhost:5432/loop"
AUTH_SECRET=""              # generate with: npx auth secret
AUTH_URL="http://localhost:3000"
```

In k8s, these are provided via a `Secret` manifest (not committed to git).

## Conventions

### General

- TypeScript strict mode — no `any`, no `@ts-ignore` without a comment explaining why
- Server Components by default; add `"use client"` only when needed (event handlers, hooks, dnd)
- Mutations go in `actions/` as Server Actions — no separate REST API endpoints
- Prisma client imported from `lib/db.ts` (singleton pattern to avoid connection exhaustion in dev)

### Naming

- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Server Actions: verb-first, e.g. `createTask`, `updateTaskStatus`, `deleteCategory`
- Database IDs: cuid (already set in schema)

### UI

- Light mode only — do not add dark mode variants
- Use shadcn/ui components before reaching for custom implementations
- Tailwind only — no CSS modules or styled-components
- Color-coded task statuses: waiting (blue), follow-up due (amber), overdue (red), done (green)

### Testing

- Test business logic and Server Actions; skip pure presentational components
- E2E tests cover the happy path for each major feature
- No hard coverage % target — test where bugs would be painful

### Git

- Commit message format: `type: short description`
  - Types: `feat`, `fix`, `chore`, `test`, `docs`, `refactor`
- Commit early and often; push after each meaningful chunk of work
- Pre-commit hook runs lint + typecheck — do not bypass with `--no-verify`

## Data Model Summary

See `plan.md` for the full Prisma schema. Key models:

- `User` — auth
- `Category` — user-managed, has name + hex color
- `Task` — core entity; has status, priority, categoryId, followUpDate, sortOrder
- `FollowUp` — one row per actual follow-up attempt made (a task can have many)
- `StatusEvent` — audit log of every status change (used for dashboard time-to-complete metrics)

## Status Flow

```
WAITING → FOLLOW_UP_DUE → DONE
                        ↘ OVERDUE (auto: followUpDate < now && status != DONE)
```

## Known TODOs / Stubs to Fill In

- [ ] Add k8s image registry once decided
- [ ] Fill in real category names after confirming with user (currently seeded as placeholders)
- [ ] Confirm Tailscale Funnel hostname once configured
