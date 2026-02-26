# CLAUDE.md — suplAI Monorepo

This file provides guidance to Claude Code when working in this repository.

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

## Backend (`apps/backend`)

Node.js + TypeScript. No Express/Fastify — custom router in `src/lib/router.ts`.

### Commands
```bash
cd apps/backend
npm run dev          # tsx watch src/main.ts
npm run build        # tsup → dist/
npm test             # ts-mocha
npm run type-check   # tsc --noEmit
npm run validate     # fmt:check → lint → type-check → test
```

### Request Flow
```
Request → routes.ts → http/ handler → handlers/index.ts → actions/ → src/db/ → Response
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

### Key Conventions
- All imports use `.js` extensions (ESM + TypeScript bundler resolution)
- All filenames use kebab-case
- API response format: `{ success, data?, error?, message? }`
- Auth: `requireAuth(handler)` / `optionalAuth(handler)` from `src/auth/middleware.ts`
- Soft deletes: all tables have `deleted_at`; all queries filter `WHERE deleted_at IS NULL`

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
├── lib/
│   ├── utils.ts
│   └── constants.ts
├── types/
└── middleware.ts
```

### Path Aliases
- `@/*` → `src/*`
- `@supl/shared` → `packages/shared/src/index.ts`

## Shared Package (`packages/shared`)

Source-only TypeScript package. No build step — both apps compile it directly.

### Types exported
- `ApiResponse<T>`, `PaginatedResponse<T>` — standard backend response envelopes
- `Invoice`, `Organization`, `User`, `UserProfile`, `Supplier` — domain types
- `RegisterOrganizationPayload`, `RegisterOrganizationData`
- `CreateUserPayload`, `UpdateUserPayload`

### Usage
```typescript
import type { ApiResponse, Invoice } from '@supl/shared';
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/organizations` | List organizations |
| GET | `/api/organizations/:id` | Get organization |
| POST | `/api/organizations` | Create organization (auth) |
| PUT | `/api/organizations/:id` | Update organization (auth) |
| DELETE | `/api/organizations/:id` | Soft-delete organization (auth) |
| POST | `/api/organizations/register` | Register org + admin user |
| GET | `/api/organizations/:orgId/users` | List users (auth) |
| POST | `/api/organizations/:orgId/users` | Create user (auth) |
| GET | `/api/organizations/:orgId/users/:id` | Get user (auth) |
| PUT | `/api/organizations/:orgId/users/:id` | Update user (auth) |
| DELETE | `/api/organizations/:orgId/users/:id` | Soft-delete user (auth) |
| GET | `/api/suppliers` | List suppliers |
| GET | `/api/suppliers/:id` | Get supplier |
| POST | `/api/suppliers/upsert` | Upsert supplier (auth) |
| PUT | `/api/suppliers/:id` | Update supplier (auth) |
| DELETE | `/api/suppliers/:id` | Soft-delete supplier (auth) |
| GET | `/api/organizations/:orgId/invoices` | List invoices (auth) |
| GET | `/api/organizations/:orgId/invoices/:id` | Get invoice (auth) |
| POST | `/api/organizations/:orgId/invoices/upsert` | Upsert invoice (auth) |
| POST | `/api/organizations/:orgId/invoices/sync` | Sync from SII (auth) |
| POST | `/api/organizations/:orgId/invoices/import` | Import from SII with params (auth) |
| PUT | `/api/organizations/:orgId/invoices/:id` | Update invoice (auth) |
| PATCH | `/api/organizations/:orgId/invoices/:id/approve` | Approve invoice (auth) |
| PATCH | `/api/organizations/:orgId/invoices/:id/reject` | Reject invoice (auth) |
| DELETE | `/api/organizations/:orgId/invoices/:id` | Soft-delete invoice (auth) |
