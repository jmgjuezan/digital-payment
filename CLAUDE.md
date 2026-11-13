# CLAUDE.md: Digital Payment

This file provides project instructions, architecture context, business rules, and code style standards for AI assistants (specifically Claude) working on the **Digital Payment** codebase.

---

## 1. Quick Reference: Core Commands

```bash
# Development
npm run dev               # Start Next.js local development server (http://localhost:3000)

# Quality Checks & Linting
npm run lint              # Run ESLint
npm run lint -- --fix     # Run ESLint and apply safe auto-fixes
npm run typecheck         # Typecheck without emitting files (tsc --noEmit)

# Testing
npm test                  # Run unit tests via Vitest (single pass)
npm run test:watch        # Start Vitest in interactive watch mode
npm run test:coverage     # Generate coverage report (enforces 80% minimum)
npx vitest run <file>     # Run a specific test file

# Production Build
npm run build             # Build optimized Next.js production bundle
npm run start             # Run the local production server
```

---

## 2. Tech Stack

- **Framework**: Next.js 15 (App Router, React Server Components, Server Actions)
- **UI & Styling**: React 19, Tailwind CSS 4, shadcn/ui, Lucide Icons
- **Language**: TypeScript 5 (Strict Mode enforced)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Supabase Auth UI, `@supabase/ssr`)
- **Hosting & Deployment**: Vercel (Serverless Node.js Runtime)
- **Testing**: Vitest, React Testing Library (`@testing-library/react`), Playwright

---

## 3. Project Overview & Business Domain Rules

**Digital Payment** is an operational ledger and record-keeping application for payments, loads, and wallet balance transfers across digital wallets (GCash, Maya) and Philippine banks. It does **not** execute real-time money transfers.

### 3.1 Devices & Payment Type Availability
Transactions and balances are linked to physical devices:
- **`ME`**: Master device with access to **all payment types** (GCash, Maya, Maribank, and all partner banks).
- **`CP2`**: Limited to **GCash & Maya** options (`GCash Cash-in`, `GCash Cash-out`, `GCash Load`, `Maya Cash-in`, `Maya Cash-out`, `Maya Load`).
- **`CP4`**: Limited to **GCash & Maribank** options (`GCash Cash-in`, `GCash Cash-out`, `GCash Load`, `Maribank Cash-in`, `MariBank Cash-out`, `Maribank Load`).
- **`CP1`, `CP3`, `CP5`, `CP6`, `CP7`, `CP8`**: Limited to **GCash** options (`GCash Cash-in`, `GCash Cash-out`, `GCash Load`).

> **UI Constraint on `/transactions/new`**: The Payment Type field is **disabled** until a device is selected. When the device changes, any previously selected payment type that is incompatible with the new device auto-clears.

### 3.2 Fee / Charge Calculation Rules
- **₱500 Slab**: ₱5 fee for every ₱500 slab (`Math.ceil(amount / 500) * 5`)
  - Types: `GCash Cash-in`, `GCash Cash-out`, `Maya Cash-in`, `Maya Cash-out`
- **₱1,000 Slab**: ₱5 fee for every ₱1,000 slab (`Math.ceil(amount / 1000) * 5`)
  - Types: All Bank Cash-in / Cash-out types (`BPI`, `BDO`, `Maribank`, `UnionBank`, etc.)
- **Load Types**: `GCash Load`, `Maya Load`, `Maribank Load` have **₱0 auto-calculated charge**.
- User can manually adjust the auto-calculated charge.

### 3.3 Transaction ID Rules
- **Non-Load Types**: Transaction ID is **required** and capped at **4 characters**.
- **Load Types** (`*Load`): Transaction ID is **optional**.

### 3.4 Temporal & Timezone Constraints
- **Timezone**: All operations strictly use `Asia/Manila`.
- **Clock Authority**: The database server time (via RPC `get_server_time()`) is the single source of truth; do not rely on local browser time.
- **Allowed Payment Dates**: Only **yesterday** or **today** (in `Asia/Manila`). Future dates are rejected.
- **Allowed Payment Times**: When date is **today**, time cannot be later than current Manila server time.

### 3.5 Balance Prerequisite Gate
- Before a transaction can be created on `/transactions/new`, **at least one balance record must exist for today** (`balances` table row with `date = today`).
- If no balance exists, `BalanceRequiredDialog` redirects the user to set a balance first.

### 3.6 Financial Formulas
- **Consolidated Dashboard Total**:
  $$\text{Consolidated Total} = (\text{Cash-in Amount} + \text{Load Amount}) + \text{Total Charges} - \text{Cash-out Amount}$$
- **Computed Ending Balance**:
  $$\text{Computed Balance} = \text{Recorded Balance} - \text{Subsequent Cash-in/Load} + \text{Subsequent Cash-out}$$

---

## 4. User Roles & RBAC Matrix

Roles are defined in the `user_roles` table:

| Role | Balances Access (`/balances`, `/balances/new`) | Create Transaction (`/transactions/new`) | Edit Transaction (`.../[id]/edit`) | View Activity |
|---|---|---|---|---|
| **`admin`** | Full access | Full access | Can edit **any** transaction | All |
| **`moderator`** | Full access | Denied | Can only edit **their own** transactions | All |
| **`user`** | Denied | Allowed | Can only edit **their own** transactions | All |

---

## 5. Directory Structure & Key Files

```text
src/
├── app/
│   ├── actions/server-time.ts       # Cached server time RPC action
│   ├── auth/                        # Auth routes (callback, signout, update-password)
│   ├── balances/                    # Balances dashboard & /balances/new
│   ├── dashboard/                   # Transactions dashboard & [id]/edit
│   ├── login/                       # Supabase Auth UI login
│   ├── privacy/ & terms/            # Legal pages
│   ├── transactions/new/            # Add transaction page & server action
│   ├── layout.tsx                   # Root layout & viewport metadata
│   └── page.tsx                     # Root redirect (to /login or /dashboard)
├── components/
│   ├── auth/                        # AuthForm, UpdatePasswordForm
│   ├── balances/                    # SetBalanceForm, BalanceRecords, Skeletons
│   ├── dashboard/                   # DashboardTransactions, EditTransactionForm
│   ├── layout/                      # AppActionFooter (bottom navigation & balance gate)
│   └── transactions/                # NewTransactionForm, BalanceRequiredDialog
├── lib/
│   ├── balance-access.ts            # RBAC role verification helpers
│   ├── payment-charge.ts            # Slab fee calculations
│   ├── payment-options.ts           # Allowed payment types per device
│   ├── server-time.ts               # Asia/Manila date/time helpers
│   └── utils.ts                     # UI utility functions (cn)
└── middleware.ts                    # Session verification & protected routes
```

---

## 6. Code Style & Engineering Guidelines

See [`CLEAN_CODE.md`](CLEAN_CODE.md) for detailed conventions:

### Formatting & Syntax
- **Quotes**: Single quotes (`'`) only.
- **Semicolons**: **No semicolons**.
- **Indentation**: 2 spaces.
- **TypeScript**: Strict mode enabled. **Zero `any`**. Prefer `type` over `interface`. Use `as const` for fixed lists.
- **Functional Patterns**: Prefer immutable methods (`map`, `filter`, `reduce`); pure helpers; early guard returns.
- **Imports**: Group into 1) React/Next, 2) Third-party, 3) Internal (`@/*`). Always use the `@/` alias.

### UI & Mobile-First Standards
- **Viewport**: Design mobile-first (320px–430px) single-column, then scale with `md:` / `lg:`.
- **Touch Targets**: Minimum **44px** for buttons, inputs, and toggles.
- **Skeleton Loaders Only**: When fetching data asynchronously, **only show skeleton loaders**. Never show blank screens, layout shifts, or spinning wheels.
- **Accessibility**: Use appropriate ARIA attributes (`aria-expanded`, `aria-controls`, `role='combobox'`, `role='alert'`).

### Server Actions & Error Handling
- Mark server action files with `'use server'` at the top.
- Always authenticate users before processing (`supabase.auth.getUser()`).
- Always validate all inputs on the server (format regex, numeric range, allowlists) even if validated on client.
- Return generic, user-safe error messages in an object `{ error?: string }`; log detailed errors server-side with `console.error`.

---

## 7. Testing Standards & Quality Gates

- **Unit Testing**: Vitest with React Testing Library (`@testing-library/react`).
- **TDD Workflow**: Write or update tests alongside feature logic.
- **Coverage**: Maintain **80% minimum coverage** across lines, functions, branches, and statements (`npm run test:coverage`).
- **Mocking**: Mock `@supabase/ssr`, server actions, and server time helpers cleanly without leaking state between tests.
- **E2E / Integration**: Playwright and Supabase test projects (see [`INTEGRATION_TESTING.md`](INTEGRATION_TESTING.md) and [`UI_AUTOMATION_TESTING.md`](UI_AUTOMATION_TESTING.md)).

---

## 8. Security & Environment Guardrails

- **Environment File**: Never commit `.env.local` or files with real secrets. Use `.env.example` as reference.
- **Keys**: Never expose `service_role` or secret keys. Use only `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in client/server actions.
- **Database RLS**: Every Supabase table (`payments`, `balances`, `user_roles`) enforces Row Level Security.
- **Generated State**: Keep `supabase/.temp/`, `supabase/.branches/`, and `.next/` git-ignored.
- **Packages**: Do not install new third-party packages or edit `package.json` without asking first.
