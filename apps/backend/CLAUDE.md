# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (tsx watch)
npm run build        # Build with tsup (ESM output to dist/)
npm start            # Run production build
npm test             # Run tests once (ts-mocha)
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run fmt          # Prettier format
npm run type-check   # TypeScript type checking (no emit)
npm run validate     # fmt:check → lint → type-check → test (run before committing)
```

**Run a single test file:**
```bash
npx ts-mocha tests/path/to/test.ts
```

**Supabase type generation:**
```bash
supabase gen types typescript --local > src/types/supabase.ts
```

**Generate an encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Architecture

Node.js + TypeScript backend using Supabase (PostgreSQL, Auth, Storage). No Express/Fastify — uses a custom router in `src/lib/router.ts`.

### Request flow

```
Request → routes.ts → http/ handler → handlers/index.ts → actions/ → src/db/ → Response
          (register)   (parse/validate)  (entry point)    (business)  (queries)
```

### Service module structure

Each service lives in `src/services/[plural-name]/` with this layout:

```
services/organizations/
├── actions/          # Business logic (one file per operation)
├── handlers/         # Thin wrappers exposing actions
│   └── index.ts     # MUST export ALL handlers — callers always import from here
├── http/             # HTTP handlers (Request → Response); thin layer
│   └── index.ts     # Re-exports all HTTP handlers
├── helpers/          # Functions used ONLY within this service
├── types/            # Types used ONLY in this service
│   └── index.ts
├── config.ts         # Service-specific constants
└── routes.ts         # Exports registerXxxRoutes(router); this is the service entry point
```

**Critical rules:**
- No `index.ts` at the service root — entry is always `routes.ts`
- All handler imports must go through `handlers/index.ts`, never from individual handler files
- `main.ts` imports only from `./services/<name>/routes`
- HTTP layer calls `handlers/`, never `actions/` directly
- `db/` layer is data access only — no business logic

### Type placement rule

```
Used in ONE service   → services/[name]/types/
Used in MULTIPLE      → src/types/
```

### Database validation

Every table has a Zod schema in `src/db/schemas/[table].schema.ts`. Actions validate data with these schemas before any DB operation.

### API response format

All endpoints return:
```typescript
{ success: boolean; data?: T; error?: string; message?: string }
```

Use helpers from `src/utils/response.ts`: `successResponse()`, `validationError()`, `serverError()`, etc.

### Authentication

`requireAuth(handler)` and `optionalAuth(handler)` from `src/auth/middleware.ts` wrap route handlers. JWT via `Authorization: Bearer <token>`, validated through Supabase Auth.

### Import conventions

Always use `.js` extensions in imports (even for `.ts` source files), per ESM + TypeScript bundler resolution:
```typescript
import { logger } from '../utils/logger.js';
import type { ApiResponse } from '../types/api.js';
```

### File naming

All filenames use kebab-case: `get-user.ts`, `create-user.ts`, `validate-user.ts`.

---

## Domain Model & Architectural Decisions

### Entity Relationships

```
Organization (1) ──── (N) Users
Organization (1) ──── (N) Invoices
Supplier     (1) ──── (N) Invoices   ← global, shared across orgs
User         (1) ──── (N) Invoices   ← via approved_by_user_id
```

**Organizations** own Users and Invoices. A User belongs to exactly one Organization.
**Suppliers** are global — deduplicated by `tax_identifier`, shared across all Organizations.

### Multi-Tenant Isolation Strategy

Application-level filtering: all Invoice and User queries include `WHERE organization_id = ?`. This is the primary isolation mechanism. Supabase RLS (Row Level Security) is recommended as an additional defense-in-depth layer.

**API route structure reflects tenancy:**
- `/api/organizations/:orgId/users` — users scoped to org
- `/api/organizations/:orgId/invoices` — invoices scoped to org
- `/api/suppliers` — global (no org scoping, suppliers are shared)
- `/api/organizations` — tenant management

### Soft Delete Strategy

All tables have a `deleted_at TIMESTAMPTZ` column. Records are never physically deleted:
- Soft delete sets `deleted_at = NOW()`
- All queries filter `WHERE deleted_at IS NULL`
- Foreign key constraints use `ON DELETE RESTRICT` (organizations, suppliers) to prevent orphaned data, and `ON DELETE SET NULL` for `invoices.approved_by_user_id` (user deletion nulls out the approver field)

### Credential Encryption

Tax authority passwords are encrypted at the **application layer** using AES-256-GCM:
- Utility: `src/commons/encryption/index.ts`
- Format stored in DB: `<iv_b64>:<auth_tag_b64>:<ciphertext_b64>` (single column)
- Key: `ENCRYPTION_MASTER_KEY` env var — 64-character hex string (32 bytes / 256 bits)
- The column `tax_authority_password_enc` is **never** included in API responses
- API responses return `hasCredentials: boolean` instead
- AES-256-GCM provides authenticated encryption: confidentiality + tamper detection
- Each encryption uses a unique random IV (prevents ciphertext reuse attacks)

Generate key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Invoice External Unique Key

The `external_unique_key` on invoices is a SHA-256 hex hash (64 chars) of a composite:
```
receiver_tax_identifier:issuer_tax_identifier:document_type:document_number
```
All components are lowercased and trimmed before hashing.

- **Why SHA-256?** Fixed-length, no collisions in practice, safe for any character set input
- **Why include `document_type`?** Prevents collisions between invoice #100 and credit_note #100 from the same issuer to the same receiver
- Computed in `src/services/invoices/helpers/external-key.ts`
- Used for idempotent upserts when syncing from the tax authority system

### Supplier Deduplication (Global Scope)

Suppliers are **global**: one row per unique `tax_identifier`, shared across all organizations. When a new invoice references a supplier not yet in the DB, the upsert pattern applies:
1. Try to find existing supplier by `tax_identifier`
2. If found: update `legal_name` (in case it changed)
3. If not: create a new row

This is implemented in `src/services/suppliers/actions/upsert-supplier.ts`. The same application-level upsert pattern is used for invoices (via `external_unique_key`). Rationale: partial unique indexes (`WHERE deleted_at IS NULL`) are not supported as PostgreSQL `ON CONFLICT` targets.

### Invoice Status Lifecycle

```
pending → approved  (via PATCH /invoices/:id/approve)
pending → rejected  (via PATCH /invoices/:id/reject)
```

Status can only transition from `pending`. Approved/rejected invoices cannot be re-processed. The approver's user ID and timestamp are recorded on status change.

### Document Types

Generic enum (not country-specific): `invoice | credit_note | debit_note | receipt`
Defined as a PostgreSQL `ENUM` type and mirrored in `src/db/schemas/invoice.schema.ts`.

### Executive Title Date

`executive_title_date` is a **PostgreSQL generated column**: `issue_date + INTERVAL '8 days'`. It is computed automatically on insert/update and is read-only. Never set it manually in insert payloads (the Supabase type marks it as excluded from `Insert`).

### Database Index Strategy

- `organization_id` on `users` and `invoices`: partial index (`WHERE deleted_at IS NULL`) for query performance
- `tax_identifier` on `organizations` and `suppliers`: full index for lookup performance
- `external_unique_key` on `invoices`: both a full index and a partial unique index (active only)
- `status` on `invoices`: partial index for filtering by status in active records
- `issue_date` on `invoices`: for date-range filtering

### New Environment Variables Required

```
ENCRYPTION_MASTER_KEY=<64-char hex string>   # AES-256-GCM master key (required for org credentials)
```

Existing variables:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
API_PORT=8000
API_HOST=localhost
```

### API Endpoints Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/organizations` | List organizations |
| GET | `/api/organizations/:id` | Get organization |
| POST | `/api/organizations` | Create organization (auth) |
| PUT | `/api/organizations/:id` | Update organization (auth) |
| DELETE | `/api/organizations/:id` | Soft-delete organization (auth) |
| GET | `/api/organizations/:orgId/users` | List users in org (auth) |
| GET | `/api/organizations/:orgId/users/:id` | Get user (auth) |
| POST | `/api/organizations/:orgId/users` | Create user (auth) |
| PUT | `/api/organizations/:orgId/users/:id` | Update user (auth) |
| DELETE | `/api/organizations/:orgId/users/:id` | Soft-delete user (auth) |
| GET | `/api/suppliers` | List suppliers |
| GET | `/api/suppliers/:id` | Get supplier |
| POST | `/api/suppliers/upsert` | Upsert supplier by taxIdentifier (auth) |
| PUT | `/api/suppliers/:id` | Update supplier (auth) |
| DELETE | `/api/suppliers/:id` | Soft-delete supplier (auth) |
| GET | `/api/organizations/:orgId/invoices` | List invoices (auth) |
| GET | `/api/organizations/:orgId/invoices/:id` | Get invoice (auth) |
| POST | `/api/organizations/:orgId/invoices/upsert` | Upsert invoice (auth) |
| PUT | `/api/organizations/:orgId/invoices/:id` | Update invoice (auth) |
| PATCH | `/api/organizations/:orgId/invoices/:id/approve` | Approve invoice (auth) |
| PATCH | `/api/organizations/:orgId/invoices/:id/reject` | Reject invoice (auth) |
| DELETE | `/api/organizations/:orgId/invoices/:id` | Soft-delete invoice (auth) |
