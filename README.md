# suplAI

Accounts-payable platform for Chilean companies, built around the **SII** (Servicio de Impuestos Internos, Chile's tax authority).

suplAI pulls the electronic invoices (DTEs) a company receives in the SII, and manages each one through review, approval or rejection, cost allocation and payment. It also keeps a supplier registry with contracts and payment details, and uses AI to check invoices and payment receipts against what was agreed.

> **Status:** experimental / test project. It is not in production use.

## Features

### Invoices
- **SII sync and import:** fetches received DTEs for a period directly from the SII using the organization's tax credentials.
- **Approval lifecycle:** `pending → approved` or `pending → rejected`. Each decision is registered back in the SII as a commercial acceptance (ACD) or claim (RCD) event.
- **SII status tracking:** checks pending invoices against SII lifecycle events and updates their status automatically.
- **AI contract validation:** compares the invoice amount against the supplier's cost contract using Claude. With organization rules (tolerance %, max amount), an invoice can be auto-approved.
- **Cost allocation:** splits invoices across cost centers and accounting accounts.
- **Collaboration:** comments, attached documents, an event timeline and access to the original DTE XML.

### Suppliers
- Global supplier registry, deduplicated by RUT across organizations, with per-organization settings.
- Contracts and supporting documents. Supplier data can be **extracted from a PDF, Word file or image** with AI.
- Services, default cost centers, default accounting accounts and bank payment details.

### Payments
- **Payment batches (nóminas):** group approved invoices into a batch and pay it.
- **Voucher verification:** the uploaded bank transfer receipt is read with AI, and its amount is checked against the batch total before invoices are marked as paid.

### Expense reports (rendiciones)
- Employees submit expenses with receipts. Admins approve or reject them.

### Budget and organization
- Budget items per cost center with spend metrics.
- Multi-tenant organizations with user management, roles and configurable approval rules.
- Onboarding that looks up the company in the SII by RUT.

## Architecture

```
┌──────────────────────┐      ┌───────────────────────────────┐      ┌──────────────┐
│ Frontend (Next.js)   │─────▶│ Backend API                   │─────▶│ SII (HTTP /  │
│ Vercel               │ JWT  │ Supabase Edge Function (Deno) │      │ SOAP)        │
└──────────────────────┘      │                               │─────▶│ Anthropic    │
                              │                               │─────▶│ Resend       │
                              └──────────────┬────────────────┘      └──────────────┘
                                             │
                              ┌──────────────▼────────────────┐
                              │ Supabase: Postgres (RLS),     │
                              │ Auth, Storage                 │
                              └───────────────────────────────┘
```

| Path | Description |
| --- | --- |
| `apps/frontend` | Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui |
| `apps/backend/src` | Node.js + TypeScript API, used for local development. Custom router, no framework |
| `apps/backend/supabase/functions` | Deployed backend: the same API ported to a Supabase Edge Function |
| `apps/backend/supabase/migrations` | Postgres schema. Every table has Row Level Security enabled |
| `packages/shared` | API contract types shared by both apps (`@supl/shared`) |

The backend follows a layered layout per service: `routes → http → handlers → actions → db`.

### Security notes
- SII passwords are stored encrypted with **AES-256-GCM**. The master key lives only in the environment, and API responses only expose `hasCredentials: boolean`.
- All organization data is scoped by `organization_id`, and every table has Row Level Security enabled.
- Records are soft-deleted with `deleted_at`.

## Getting started

### Prerequisites
- Node.js 20+ and npm
- A Supabase project, plus the [Supabase CLI](https://supabase.com/docs/guides/cli) for migrations and deploys
- Optional: an Anthropic API key for the AI features and a Resend API key for email

### Setup

```bash
npm install
```

Create `apps/backend/.env` (see `apps/backend/.env.example`):

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ENCRYPTION_MASTER_KEY=   # 64-char hex: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ANTHROPIC_API_KEY=
RESEND_API_KEY=
API_PORT=8000
API_HOST=localhost
```

Create `apps/frontend/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Apply the database schema:

```bash
cd apps/backend
supabase link --project-ref <your-project-ref>
supabase db push
```

### Run

```bash
npm run dev          # backend on :8000, frontend on :3000
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start backend and frontend in parallel (Turborepo) |
| `npm run build` | Build all apps |
| `npm run test` | Run all tests |
| `npm run lint` | Lint all workspaces |
| `npm run type-check` | Type-check all workspaces |

## Deployment

On every push to `main`, GitHub Actions deploys both apps:

- **Backend:** `supabase functions deploy api`. Requires the `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` repository secrets.
- **Frontend:** `vercel --prod`. Requires the `VERCEL_TOKEN` repository secret.

Runtime secrets for the Edge Function (`ENCRYPTION_MASTER_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`) are set with `supabase secrets set`. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected by Supabase.
