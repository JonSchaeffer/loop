# Loop — Project Plan

## Overview

A web app for an executive assistant to track email follow-ups and tasks. Replaces a manual OneNote workflow. Priorities: fast manual entry, zero missed follow-ups, and a dashboard that demonstrates workload to leadership.

---

## Goals

- Replace manual OneNote highlight/copy workflow with structured status tracking
- Eliminate manual task rollover (undone tasks auto-carry to the next day)
- Replace manual cut/paste prioritization with drag-to-reorder or priority flags
- Provide a filterable dashboard showing volume of work over time
- Surface time-to-complete per task in reporting — highlights which categories of work are most involved

---

## Tech Stack

| Layer                  | Choice                                  | Rationale                                                                            |
| ---------------------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| Framework              | Next.js 16 (App Router)                 | Full-stack React, server components + server actions, no separate API service needed |
| Auth                   | Auth.js (NextAuth v5)                   | Runs inside Next.js, email+password, no external auth service                        |
| ORM                    | Prisma 7 (`@prisma/adapter-pg`)         | Type-safe DB access, good migration tooling, driver adapter for serverless           |
| Database               | Neon (hosted PostgreSQL)                | Serverless-friendly, Vercel integration, free tier sufficient for single user        |
| UI Components          | shadcn/ui + Tailwind CSS                | Polished components, fast to build with                                              |
| Drag-to-reorder        | dnd-kit                                 | Lightweight, accessible drag-and-drop                                                |
| Hosting                | Vercel                                  | Zero-config Next.js deploy, free hobby tier, automatic preview deploys               |
| Local dev              | Docker Compose                          | Next.js + Postgres, hot reload via volume mount                                      |
| Unit/integration tests | Vitest + React Testing Library          | Fast, native ESM                                                                     |
| E2E tests              | Playwright                              | Browser automation for critical user flows                                           |
| Linting                | ESLint + Prettier + Husky + lint-staged | Runs lint + type-check before every commit                                           |

---

## Data Model (current)

```prisma
model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String
  createdAt    DateTime   @default(now())
  tasks        Task[]
  categories   Category[]
}

model Category {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  color     String
  createdAt DateTime @default(now())
  tasks     Task[]
  @@unique([userId, name])
}

model Task {
  id           String    @id @default(cuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  categoryId   String?
  category     Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  title        String
  recipient    String?
  priority     Priority  @default(MEDIUM)
  status       Status    @default(WAITING)

  sentDate     DateTime?  // when email was sent
  followUpDate DateTime?  // "remind me on" — drives status machine
  dueDate      DateTime?  // hard deadline
  completedAt  DateTime?

  notes        String?
  sortOrder    Int       @default(0)

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  subTasks      SubTask[]
  followUps     FollowUp[]
  statusHistory StatusEvent[]
  responseLogs  ResponseLog[]
}

model SubTask {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  title     String
  done      Boolean  @default(false)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
}

model ResponseLog {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  content   String
  createdAt DateTime @default(now())
}

model FollowUp {
  id           String   @id @default(cuid())
  taskId       String
  task         Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  followedUpAt DateTime @default(now())
  notes        String?
}

model StatusEvent {
  id         String   @id @default(cuid())
  taskId     String
  task       Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  fromStatus Status?
  toStatus   Status
  changedAt  DateTime @default(now())
}

enum Status { WAITING, FOLLOW_UP_DUE, OVERDUE, DONE }
enum Priority { HIGH, MEDIUM, LOW }
```

---

## Status Flow

```
WAITING → FOLLOW_UP_DUE → DONE
                        ↘ OVERDUE (auto: followUpDate < today && status != DONE)
```

Snooze buttons on OVERDUE / FOLLOW_UP_DUE push `followUpDate` forward 24h or 1wk and reset to WAITING.

---

## Build Phases

### Phase 1 — Foundation ✅

- [x] Scaffold Next.js (TypeScript, App Router, Tailwind)
- [x] ESLint, Prettier, Husky + lint-staged, TypeScript strict mode
- [x] Vitest + React Testing Library
- [x] Playwright E2E
- [x] Prisma + PostgreSQL schema
- [x] Auth.js email+password login (JWT sessions, edge-safe middleware split)
- [x] Docker Compose stack (next-app + postgres, hot reload)

### Phase 2 — Core Task UI ✅

- [x] Today view — tasks grouped by status (Overdue → Follow-up Due → Waiting)
- [x] Completed tasks shown at bottom, dimmed, separated by divider
- [x] Quick-add task slide-over (`N` shortcut, `sentDate` auto-fills to today)
- [x] Status transition buttons (one-click, `useTransition`)
- [x] Auto-rollover (non-DONE tasks always surface in Today view)
- [x] Auto-overdue detection (on-load `updateMany` for tasks past `followUpDate`)
- [x] Category badge + full card color tint
- [x] Priority dot indicator

### Phase 3 — Task Management ✅

- [x] Edit existing tasks (slide-over, pre-filled)
- [x] Subtasks — checklist per task; task cannot be marked Done until all complete
- [x] Category management screen (edit name/color, delete)
- [x] Drag-to-reorder within status groups (dnd-kit)
- [x] Search bar (filters by title, recipient, notes)
- [x] Filter bar (by category, priority, status)
- [x] Response log — inline timestamped notes per task ("Dean replied, confirmed for March 15")
- [x] Snooze — push follow-up date forward 24h or 1wk, resets to WAITING
- [x] Due date — hard deadline field separate from "remind me on" date
- [x] Quick-add NLP — parses "by friday", "follow up on wednesday", "remind me thursday" from free-text entry

### Phase 4 — History & Dashboard ✅

- [x] Left sidebar with date history — click past date to view that day's snapshot
- [x] Dashboard — day/week/month filter
- [x] Task volume chart (created vs completed)
- [x] Status breakdown
- [x] Breakdown by category
- [x] Time-to-complete metric by category
- [x] Follow-up count distribution

### Phase 5 — Polish ✅

- [x] Keyboard shortcuts: `N` new task, `C` new category, `Q` quick-add, `/` search
- [x] Keyboard shortcuts reference modal (`?`)
- [x] Toast notifications (sonner)
- [x] Confirm-on-close for unsaved changes in edit form

### Phase 6 — Deploy to k3s Homelab 🚧

- [x] Settings page — change password UI
- [x] Settings link in nav
- [x] `scripts/create-user.ts` — CLI script to add accounts without a UI
- [x] `Dockerfile` migrator stage — lightweight image for `prisma migrate deploy`
- [x] `.github/workflows/build.yml` — builds + pushes `loop` and `loop-migrate` to GHCR on push to `main`
- [x] k8s manifests in `k3s-homelab/apps/homelab/loop/`
  - HelmRelease (app-template): Next.js app + postgres sidecar + init container for migrations
  - PVC: 5Gi Longhorn volume for postgres data
  - ExternalSecret: pulls `POSTGRES_PASSWORD` + `AUTH_SECRET` from 1Password item `loop`
  - Tailscale ingress: `loop.porgy-monitor.ts.net`
- [ ] **1Password setup** — create `loop` item with fields: `POSTGRES_PASSWORD`, `AUTH_SECRET`
  - Generate `AUTH_SECRET`: `npx auth secret`
- [ ] **Push to GitHub** — triggers build workflow, pushes images to GHCR
- [ ] **Commit homelab manifests** — Flux picks up and deploys
- [ ] **Create first user** — `npx tsx scripts/create-user.ts <email> <password>`
- [ ] **Verify** — login at `https://loop.porgy-monitor.ts.net`, change default password

---

## Multi-User Notes

The data model is **fully multi-user** — every row is scoped to `userId` and all server actions verify ownership. What's missing is account creation UI:

- No public sign-up (intentional — private tool)
- Accounts created via `scripts/create-user.ts`
- If a second user is ever needed, run the script with their email/password

---

## Security Posture

- bcrypt (cost 12) for password hashing ✅
- Auth.js JWT sessions ✅
- `userId` ownership verified on every server action ✅
- No public sign-up ✅
- CSRF protection via Next.js Server Actions ✅
- SQL injection protection via Prisma ORM ✅
- Rate limiting on login — **not implemented** (low risk for private tool, add Upstash Redis if needed)

---

## Open Questions / Future Ideas

- NLP date parsing already in quick-add — could extend to the full task form
- "Sent X days ago, no reply" badge on task cards (based on `sentDate` + response log age)
- Email reminders / push notifications for overdue tasks
- Rate limiting on login endpoint (Upstash Redis if traffic warrants it)
- Mobile-responsive layout (deprioritized — desktop-first tool)
