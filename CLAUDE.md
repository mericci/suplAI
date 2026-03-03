# SII invoice payment management

Platform with backend and frontend. It manages the lifecycle of invoices received in the SII for companies in Chile. It also assists with supplier management.

---

### 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 3. Verification Before Done

- NEVER mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests and typeschecks, check logs, demonstrate correctness
- YOU MUST run `npm run build` before closing ANY task. If the build fails, the Vercel deploy WILL fail. Fix it before committing.
- After pushing, verify the deploy status with `vercel` or `vercel --prod`. If it fails, fix it immediately — a broken deploy is a blocker, not a "next task".

### 4. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 5. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
- **Verify Everything**: Never trust that code works — prove it with tests, types, linting.
- **Context Hygiene**: Use `/clear` between unrelated tasks. Use subagents for exploration. Don't let context rot.

---

## Repository Structure

```
suplAI/
├── apps/
│   ├── backend/    — Node.js + TypeScript API (Supabase, custom router, ESM)
│   └── frontend/   — Next.js 16 + React 19 + Tailwind
├── packages/
│   └── shared/     — Shared API contract types (@supl/shared)
├── turbo.json
└── package.json    — Root npm workspace
```

Both `apps/backend` and `apps/frontend` are **fully writable**. All new features, bug fixes, and refactors may span either app.

## Dev Workflow

```bash
# From repo root
npm install           # install all workspaces
npm run dev           # start backend (:8000) + frontend (:3000) in parallel via Turbo
npm run build         # build all apps
npm run type-check    # tsc --noEmit in all workspaces
npm run lint          # eslint in all workspaces
npm run test          # run all tests
```

## Git Workflow

- Branches: `feat/`, `fix/`, `chore/`
- Commits: conventional (`feat:`, `fix:`, `chore:`, `docs:`)
- PR required for main, 1 review minimum
- Vercel and supabase preview deploys on every PR (for frontend and backend)
- **Before creating a new branch from main**: always run `git pull origin main` first to ensure you branch from an up-to-date base
- **Before opening a PR to main**: `git checkout main && git pull origin main`, switch back to your branch, run `git merge origin/main`, review and resolve any conflicts before pushing

## Backend (`apps/backend`)

Node.js + TypeScript. No Express/Fastify — custom router in `src/lib/router.ts`.

### Commands

```bash
cd apps/backend
npm run dev          # tsx watch src/main.ts
npm run build        # tsup → dist/
npm test             # ts-mocha (all tests)
npx ts-mocha tests/path/to/test.ts  # run a single test file
npm run type-check   # tsc --noEmit
npm run validate     # fmt:check → lint → type-check → test
```

### Request Flow

```
Request → routes.ts → http/ handler → handlers/index.ts → actions/ → src/db/ → Response
          (register)   (parse/validate)  (entry point)    (business)  (queries)
```

### Service Module Layout

```
services/[name]/
├── actions/     # Business logic (one file per operation)
├── handlers/
│   └── index.ts # MUST export ALL handlers — always import from here
├── http/
│   └── index.ts # Re-exports all HTTP handlers
├── helpers/     # Service-private helpers
├── types/
│   └── index.ts
└── routes.ts    # Entry point — exports registerXxxRoutes(router)
```

**Critical rules:**

- No `index.ts` at the service root — entry is always `routes.ts`
- HTTP layer calls `handlers/`, never `actions/` directly
- `db/` layer is data access only — no business logic
- Types used in one service → `services/[name]/types/`; used in multiple → `src/types/`

### Commons Layer (`src/commons/`)

Cross-cutting utilities and integrations used across services:

```
src/commons/
├── api-requests/       — Axios wrappers (get, post, put, delete) with retry logic
├── encryption/         — AES-256-GCM encrypt/decrypt (for tax authority credentials)
├── errors/             — Typed error factories (client/ and server/)
├── integrations/
│   └── sii/            — Chilean tax authority (SII) HTTP/SOAP integrations
│       ├── get-session-tokens.ts         — Auth: obtains SII session token
│       ├── get-emitted-dte-by-period.ts  — Fetch issued invoices from SII
│       ├── get-received-dte-by-period.ts — Fetch received invoices from SII
│       └── register-dte-event.ts         — SOAP: register ACD/RCD event
└── time/               — Delay utility
```

### Key Conventions

- All imports use `.js` extensions (ESM + TypeScript bundler resolution)
- All filenames use kebab-case
- API response format: `{ success, data?, error?, message? }`
- Auth: `requireAuth(handler)` / `optionalAuth(handler)` from `src/auth/middleware.ts`
- Soft deletes: all tables have `deleted_at`; all queries filter `WHERE deleted_at IS NULL`
- Every table has a Zod schema in `src/db/schemas/[table].schema.ts` — actions validate with these before DB operations

### Domain Model

```
Organization (1) ──── (N) Users
Organization (1) ──── (N) Invoices
Supplier     (1) ──── (N) Invoices   ← global, shared across orgs
```

- **Suppliers** are global, deduplicated by `tax_identifier` across all organizations
- All Invoice/User queries include `WHERE organization_id = ?` for multi-tenant isolation
- Invoice status lifecycle: `pending → approved` or `pending → rejected` (one-way, non-reversible)
- `executive_title_date` is a PostgreSQL generated column (`issue_date + 8 days`) — never set manually

### Credential Encryption

Tax authority passwords stored as `<iv_b64>:<auth_tag_b64>:<ciphertext_b64>` using AES-256-GCM. API responses return `hasCredentials: boolean` — never the raw credential.

### Environment Variables

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
API_PORT=8000
API_HOST=localhost
ENCRYPTION_MASTER_KEY=   # 64-char hex — generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Frontend (`apps/frontend`)

Next.js 16 + React 19 + Tailwind CSS 4 + shadcn/ui.

### Commands

```bash
cd apps/frontend
npm run dev          # next dev
npm run build        # next build
npm run type-check   # tsc --noEmit
```

### Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript (strict mode)
- **UI**: Tailwind CSS 4 + shadcn/ui (Radix UI) + Lucide React
- **Auth**: Supabase (`@supabase/supabase-js` + `@supabase/ssr`)
- **Deploy**: Vercel

### Code Style

- ES modules only (import/export), never CommonJS
- Destructure imports: `import { useState } from 'react'`
- `const` over `let`, never `var`
- Named exports (except page.tsx/layout.tsx)
- File naming: kebab-case files, PascalCase components
- Colocate tests: `__tests__/component-name.test.tsx` next to source
- IMPORTANT: All displayed numbers must be properly formatted (commas, decimals, $)
- IMPORTANT: All API calls must have error handling with user-visible fallback UI
- IMPORTANT: Never commit API keys. Use `.env.local`, reference via `process.env`
- YOU MUST run `npm run type-check` before committing. TypeScript errors break the build.
- YOU MUST run `npm run lint` before committing.

### Structure

```
src/
├── app/             — Next.js App Router pages
├── components/
│   ├── ui/          — shadcn/ui primitives
│   ├── forms/       — Form components
│   └── shared/      — Shared layout components
├── features/        — Feature modules (auth, invoices, organizations, suppliers)
├── integrations/
│   └── backend/     — Backend API client + domain integration modules
├── services/        — Business logic / data-fetching hooks
├── hooks/
├── context/
└── middleware.ts
```

### Path Aliases

- `@/*` → `src/*`
- `@supl/shared` → `packages/shared/src/index.ts`

## Shared Package (`packages/shared`)

Source-only TypeScript package. No build step — both apps compile it directly.

Key types: `ApiResponse<T>`, `PaginatedResponse<T>`, `Invoice`, `Organization`, `User`, `UserProfile`, `Supplier`.

```typescript
import type { ApiResponse, Invoice } from '@supl/shared';
```

## API Endpoints


| Method | Path                                             | Description                        |
| ------ | ------------------------------------------------ | ---------------------------------- |
| GET    | `/api/organizations`                             | List organizations                 |
| GET    | `/api/organizations/:id`                         | Get organization                   |
| POST   | `/api/organizations`                             | Create organization (auth)         |
| PUT    | `/api/organizations/:id`                         | Update organization (auth)         |
| DELETE | `/api/organizations/:id`                         | Soft-delete organization (auth)    |
| POST   | `/api/organizations/register`                    | Register org + admin user          |
| GET    | `/api/organizations/:orgId/users`                | List users (auth)                  |
| POST   | `/api/organizations/:orgId/users`                | Create user (auth)                 |
| GET    | `/api/organizations/:orgId/users/:id`            | Get user (auth)                    |
| PUT    | `/api/organizations/:orgId/users/:id`            | Update user (auth)                 |
| DELETE | `/api/organizations/:orgId/users/:id`            | Soft-delete user (auth)            |
| GET    | `/api/suppliers`                                 | List suppliers                     |
| GET    | `/api/suppliers/:id`                             | Get supplier                       |
| POST   | `/api/suppliers/upsert`                          | Upsert supplier (auth)             |
| PUT    | `/api/suppliers/:id`                             | Update supplier (auth)             |
| DELETE | `/api/suppliers/:id`                             | Soft-delete supplier (auth)        |
| GET    | `/api/organizations/:orgId/invoices`             | List invoices (auth)               |
| GET    | `/api/organizations/:orgId/invoices/:id`         | Get invoice (auth)                 |
| POST   | `/api/organizations/:orgId/invoices/upsert`      | Upsert invoice (auth)              |
| POST   | `/api/organizations/:orgId/invoices/sync`        | Sync from SII (auth)               |
| POST   | `/api/organizations/:orgId/invoices/import`      | Import from SII with params (auth) |
| PUT    | `/api/organizations/:orgId/invoices/:id`         | Update invoice (auth)              |
| PATCH  | `/api/organizations/:orgId/invoices/:id/approve` | Approve + notify SII ACD (auth)    |
| PATCH  | `/api/organizations/:orgId/invoices/:id/reject`  | Reject + notify SII RCD (auth)     |
| DELETE | `/api/organizations/:orgId/invoices/:id`         | Soft-delete invoice (auth)         |


