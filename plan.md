# EA Task Tracker — Project Plan

## Overview

A web app for an executive assistant to track email follow-ups and tasks. Replaces a manual OneNote workflow. Priorities: fast manual entry, zero missed follow-ups, and a dashboard that demonstrates workload to leadership.

---

## Goals

- Replace manual OneNote highlight/copy workflow with structured status tracking
- Eliminate manual task rollover (undone tasks auto-carry to the next day)
- Replace manual cut/paste prioritization with drag-to-reorder or priority flags
- Provide a filterable dashboard showing volume of work over time
- Surface time-to-complete per task in reporting — highlights which categories of work are most involved and identifies workflow streamlining opportunities

---

## Feature Set

### Today View (primary screen)

- Lists all active/in-progress tasks for the current day
- Tasks not marked `Done` by end of day automatically appear again the next day
- Color-coded by status and priority
- Drag-to-reorder for manual priority adjustment
- One-click status transitions

### Task Entry (quick add)

- Modal/slide-over form to minimize context switching
- Fields: recipient, subject/description, category, sent date, follow-up due date, priority, notes
- Keyboard shortcut to open (`N` for new task)

### Categories (user-managed)

- Categories are created and managed by the user from within the app (not hardcoded)
- Each category has a name and a color (color picker)
- Used for filtering, dashboard breakdowns, and visual grouping in the Today view
- A "+" button next to the category dropdown in the task creation slide-over exposes an inline panel to add/edit/delete categories — no context switch to a separate settings screen

### Follow-up Logging

- A task can have multiple follow-up attempts (2–3 is common)
- Each follow-up is logged with a timestamp and optional notes
- Follow-up history is visible on the task detail view
- The initial `followUpDate` on the task is the _scheduled_ due date; each `FollowUp` record is an _actual_ follow-up that happened

### Task Statuses

```
Waiting → Follow-up Due → Done
                       ↘ Overdue (auto, when follow-up date passes without resolution)
```

### Dashboard / Reporting

- Filterable by day / week / month
- Metrics:
  - Tasks created vs. completed
  - Tasks by status
  - Tasks by category
  - **Time to complete** — average time from `createdAt` to `completedAt`, viewable by category (surfaces which work types are most demanding)
  - Follow-up count distribution (how many tasks needed 1, 2, 3+ follow-ups)
- Useful for showing leadership workload over time

### Auth

- Simple email + password login via Auth.js
- Single user to start (can expand later)

---

## Tech Stack

| Layer                  | Choice                         | Rationale                                                                            |
| ---------------------- | ------------------------------ | ------------------------------------------------------------------------------------ |
| Framework              | Next.js 14 (App Router)        | Full-stack React, server components + server actions, no separate API service needed |
| Auth                   | Auth.js (NextAuth v5)          | Runs inside Next.js, email+password, no external auth service                        |
| ORM                    | Prisma                         | Type-safe DB access, good migration tooling                                          |
| Database               | PostgreSQL                     | Reliable, self-hosted in k8s                                                         |
| UI Components          | shadcn/ui + Tailwind CSS       | Polished components (tables, modals, drag handles), fast to build with               |
| Drag-to-reorder        | dnd-kit                        | Lightweight, accessible drag-and-drop                                                |
| Hosting                | Homelab k8s + Tailscale Funnel | Public HTTPS URL, no install required on company machine                             |
| Local dev              | Docker Compose                 | Next.js + Postgres, hot reload via volume mount — no k8s deploy needed for iteration |
| Unit/integration tests | Vitest + React Testing Library | Fast, native ESM, works well with Next.js App Router                                 |
| E2E tests              | Playwright                     | Browser automation for critical user flows                                           |
| Linting                | ESLint + Prettier              | Comes with Next.js scaffold; Prettier for consistent formatting                      |
| Pre-commit             | Husky + lint-staged            | Runs lint + type-check before every commit, keeps the repo clean                     |

---

## Architecture

```
[Browser - Company Computer]
        |
        | HTTPS (Tailscale Funnel public URL)
        ↓
[Tailscale Funnel]
        |
        | routes to homelab
        ↓
[k8s Ingress / Tailscale Operator]
        |
        ↓
[Next.js Pod]  ←——→  [PostgreSQL Pod]
  - App Router              - PersistentVolumeClaim
  - Server Components         for data durability
  - Server Actions
  - Auth.js sessions
```

### Request flow

1. User navigates to the Tailscale Funnel URL in their work browser
2. Tailscale routes the request into the homelab cluster
3. k8s ingress (or Tailscale operator) forwards to the Next.js pod
4. Next.js checks auth session (JWT stored in cookie)
5. Server Components fetch data directly from Postgres via Prisma (no REST layer)
6. Mutations (create task, update status, reorder) go through Server Actions — no separate API endpoints needed
7. Postgres data lives on a PVC in the cluster — VPS migration path: `pg_dump` / `pg_restore` or a CSV export/import, then point `DATABASE_URL` at the new host

### k8s Resources

- `Deployment`: next-app (1 replica to start)
- `StatefulSet` or `Deployment` + PVC: postgres
- `PersistentVolumeClaim`: postgres-data
- `Service` (ClusterIP): next-app, postgres
- Tailscale operator or Funnel config for external ingress

### Why Server Actions over a REST API

For a single-user CRUD app, Server Actions remove the need for a separate API layer. Mutations are co-located with the UI, fully type-safe end-to-end via Prisma, and reduce boilerplate significantly. If the app ever needs a public API (e.g., for a mobile client or integrations), REST routes can be added later.

---

## Data Model

```prisma
model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String
  createdAt    DateTime   @default(now())
  tasks        Task[]
  categories   Category[]
}

// User-managed — created/edited/deleted from the app settings screen
model Category {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String
  color     String   // hex color, e.g. "#4f46e5"
  createdAt DateTime @default(now())
  tasks     Task[]
}

model Task {
  id           String    @id @default(cuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id])
  categoryId   String?
  category     Category? @relation(fields: [categoryId], references: [id])

  title        String    // email subject / task description
  recipient    String?   // who the email was sent to
  priority     Priority  @default(MEDIUM)
  status       Status    @default(WAITING)

  sentDate     DateTime? // when the original email was sent
  followUpDate DateTime? // scheduled date for first/next follow-up
  completedAt  DateTime? // when marked Done

  notes        String?
  sortOrder    Int       @default(0) // for drag-to-reorder

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  followUps     FollowUp[]
  statusHistory StatusEvent[]
}

// Each row = one actual follow-up attempt made by the assistant
model FollowUp {
  id           String   @id @default(cuid())
  taskId       String
  task         Task     @relation(fields: [taskId], references: [id])
  followedUpAt DateTime @default(now())
  notes        String?
}

model StatusEvent {
  id         String   @id @default(cuid())
  taskId     String
  task       Task     @relation(fields: [taskId], references: [id])
  fromStatus Status?
  toStatus   Status
  changedAt  DateTime @default(now())
}

enum Status {
  WAITING
  FOLLOW_UP_DUE
  OVERDUE
  DONE
}

enum Priority {
  HIGH
  MEDIUM
  LOW
}
```

> Note: `StatusEvent` is a lightweight audit log. Enables dashboard metrics like "how long did tasks sit before resolution" — useful for reporting without much overhead.

---

## Build Phases

### Phase 1 — Foundation ✅

- [x] Scaffold Next.js project (TypeScript, App Router, Tailwind) — Next.js 16 installed
- [x] Configure ESLint, Prettier, Husky + lint-staged, TypeScript strict mode
- [x] Set up Vitest + React Testing Library
- [x] Set up Playwright for E2E
- [x] Set up Prisma + PostgreSQL schema (using `prisma-client-js` generator — new Prisma 6 local generator dropped due to TypeScript module resolution issues)
- [x] Auth.js email+password login (JWT sessions, no DB adapter needed)
- [x] Docker Compose stack (next-app + postgres, hot reload via volume mount) for local dev
- [x] Basic k8s manifests (next-app deployment, postgres statefulset, PVC, services)
- [ ] Tailscale Funnel config (deferred — do when ready to deploy)

### Phase 2 — Core Task UI

- [ ] Today view (list of active tasks)
- [ ] Quick-add task modal
- [ ] Status transition buttons (one-click)
- [ ] Auto-rollover logic (tasks without `completedAt` surface in Today view regardless of date)

### Phase 3 — Task Management

- [ ] Drag-to-reorder (dnd-kit)
- [ ] Priority flag display + filter
- [ ] Task detail / edit view with follow-up log (add follow-up entry with timestamp + notes)
- [ ] Overdue auto-detection (cron or on-load check: `followUpDate < now && status != DONE`)
- [ ] Category management screen (CRUD categories with name + color picker)

### Phase 4 — Dashboard

- [ ] Dashboard page with day/week/month filter
- [ ] Task volume chart (created vs completed)
- [ ] Status breakdown
- [ ] Breakdown by category
- [ ] Time-to-complete metric, viewable by category
- [ ] Follow-up count distribution (tasks needing 1, 2, 3+ follow-ups)

### Phase 5 — Polish

- [ ] Keyboard shortcut (`N` = new task)
- [ ] Confirm-on-close if unsaved changes
- [ ] Empty states, loading skeletons
- [ ] Error handling / toast notifications

---

## Testing Standards

### What to test

| Layer          | Tool                   | What                                                                                |
| -------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| Business logic | Vitest                 | Utility functions, status transition rules, overdue detection logic, rollover logic |
| Server Actions | Vitest + mocked Prisma | Input validation, DB call shape, error paths                                        |
| UI Components  | React Testing Library  | Key interactions: task creation form, status buttons, drag handles                  |
| E2E            | Playwright             | Critical flows: login, create task, change status, mark done, dashboard filter      |

### What not to test

- Prisma internals / DB migrations (trust the ORM)
- shadcn/ui component internals
- Purely presentational components with no logic

### Coverage target

Aim for coverage on business logic and Server Actions. E2E tests cover the happy path for each major feature. No hard % target — write tests where bugs would be painful, not for vanity metrics.

---

## Git Workflow

- **Commit early and often** — prefer small, focused commits over large batches
- **Commit message format**: `type: short description` (e.g., `feat: add task status transitions`, `fix: overdue detection off-by-one`, `chore: add Playwright config`)
- **Push after every meaningful chunk of work** — don't let local commits pile up
- **Branch strategy**: `main` is deployable; feature work on short-lived branches (`feat/today-view`, `feat/dashboard`), merge via PR or direct push for solo work
- Husky pre-commit hook runs lint + type-check automatically — fix before committing, don't bypass with `--no-verify`

---

## Open Questions

- Overdue detection — on-load check (simple, no infra) vs. k8s CronJob (more accurate, runs overnight). On-load is probably fine to start.
- VPS migration path — Fly.io, Hetzner, or DigitalOcean? Docker Compose makes any of these straightforward.
