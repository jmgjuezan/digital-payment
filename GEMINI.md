# Project Context & Architecture: Digital Payment

This document serves as the master context and technical reference for the **Digital Payment** application. It captures all business domain rules, system architecture, data models, workflows, security boundaries, and engineering standards.

---

## 1. Project Overview

**Digital Payment** is a full-stack, mobile-first web application designed to record, audit, and reconcile payments and wallet balance transfers made across digital wallets (GCash, Maya) and banking institutions in the Philippines.

### Key Characteristics
- **Record-Keeping Focus**: The application is an operational log and financial ledger; it does *not* execute fund transfers or interface with banking gateways.
- **Physical Device-Bound Workflows**: Financial transactions occur on physical devices designated for specific wallets. The app captures which device completed each operation.
- **Strict Timezone Handling**: All date boundaries, cutoffs, and default timestamps strictly follow `Asia/Manila` time.
- **Server Clock Authority**: The database server time (via RPC `get_server_time()`) is the single source of truth for temporal operations.

---

## 2. Tech Stack & Infrastructure

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React Server Components, Server Actions)
- **UI Library & React**: React 19, [Tailwind CSS 4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), Lucide Icons
- **Language**: TypeScript 5 (Strict Mode enforced)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Supabase Auth, `@supabase/ssr`, `@supabase/auth-ui-react`)
- **Hosting & Deployment**: [Vercel](https://vercel.com/) (Serverless Node.js Runtime)
- **Testing**: [Vitest](https://vitest.dev/), React Testing Library (`@testing-library/react`), [Playwright](https://playwright.dev/)

---

## 3. Business Domain & Operational Rules

### 3.1 Devices & Device Options

Transactions and balances are tied to device identifiers:
- **`CP1` through `CP8`**: Designated mobile devices / phones.
- **`ME`**: Master/personal device with unrestricted wallet and bank access.

### 3.2 Device-to-Payment Type Availability Matrix

When adding a transaction (`/transactions/new`), the **Payment Type field is locked/disabled** until a device is selected. Once a device is chosen, only the permitted options appear:

| Device | Available Payment Types |
|---|---|
| **`ME`** | **All Payment Types** (GCash, Maya, Maribank, AllBank, BDO, BPI, CIMB, EastWest, Gotyme, Metrobank, PNB, PSBank, RCBC, SecurityBank, UnionBank, UnoBank) |
| **`CP2`** | **GCash & Maya only**: `GCash Cash-in`, `GCash Cash-out`, `GCash Load`, `Maya Cash-in`, `Maya Cash-out`, `Maya Load` |
| **`CP4`** | **GCash & Maribank only**: `GCash Cash-in`, `GCash Cash-out`, `GCash Load`, `Maribank Cash-in`, `MariBank Cash-out`, `Maribank Load` |
| **`CP1`, `CP3`, `CP5`, `CP6`, `CP7`, `CP8`** | **GCash only**: `GCash Cash-in`, `GCash Cash-out`, `GCash Load` |

*Note: If the user changes device after selecting a payment type, and the selected payment type is incompatible with the newly selected device, the payment type and charge auto-clear.*

### 3.3 Charge (Fee) Calculation Rules

Charges are auto-computed from the payment type and amount:
- **₱500 Slab**: ₱5 fee for every ₱500 slab (Math: `Math.ceil(amount / 500) * 5`)
  - Applicable to: `GCash Cash-in`, `GCash Cash-out`, `Maya Cash-in`, `Maya Cash-out`
- **₱1,000 Slab**: ₱5 fee for every ₱1,000 slab (Math: `Math.ceil(amount / 1000) * 5`)
  - Applicable to: All Bank Cash-in / Cash-out types (`BPI`, `BDO`, `Maribank`, `UnionBank`, etc.)
- **Load Types**: `GCash Load`, `Maya Load`, `Maribank Load` have **₱0 auto-calculated charge**.
- **User Adjustment**: The calculated charge can be manually modified by the user if needed.

### 3.4 Transaction ID Rules
- **Non-Load Types**: Transaction ID is **mandatory** and capped at **4 characters**.
- **Load Types** (`*Load`): Transaction ID is **optional**.

### 3.5 Date & Time Constraints
- **Allowed Payment Dates**: Only **yesterday** or **today** (based on `Asia/Manila` server time). Future dates are forbidden.
- **Allowed Payment Times**: When the date is **today**, the payment time cannot be in the future relative to server time.
- **Time Defaults**: Defaults to the start of the current hour (e.g., `14:00`).

### 3.6 Daily Balance Prerequisite Gate
- **Balance Prerequisite**: A transaction cannot be created unless **at least one balance has been recorded for today** (`balances` table row with `date = today`).
- If no balance exists, navigating to `/transactions/new` displays a `BalanceRequiredDialog` directing the user to set a balance first.

### 3.7 Financial Formulas & Calculations

#### A. Consolidated Dashboard Total
Used in the transaction summary modal (`DashboardTransactions.tsx`):
$$\text{Consolidated Total} = (\text{Cash-in Amount} + \text{Load Amount}) + \text{Total Charges} - \text{Cash-out Amount}$$

#### B. Computed Ending Balance
Used in the balances records (`BalanceRecords.tsx`):
$$\text{Computed Balance} = \text{Recorded Balance} - \text{Subsequent Cash-in/Load Amounts} + \text{Subsequent Cash-out Amounts}$$
*(Matched by wallet type from the balance date up through today).*

---

## 4. User Roles & Access Control (RBAC)

The system defines three roles via the `user_roles` table:

| Role | Balances Access (`/balances`, `/balances/new`) | Transaction Creation (`/transactions/new`) | Transaction Editing (`/dashboard/transactions/[id]/edit`) | View Activity |
|---|---|---|---|---|
| **`admin`** | Full access (View & Create) | Full access | Can edit **any** transaction | All |
| **`moderator`** | Full access (View & Create) | Denied | Can only edit **their own** transactions | All |
| **`user`** | Denied | Allowed | Can only edit **their own** transactions | All |

- **Security Enforcement**: Authorization is enforced both in React Server Actions (application layer) and Postgres Row Level Security policies (database layer).

---

## 5. Database Schema & Data Models

Managed via Supabase PostgreSQL migrations in `supabase/migrations/`.

### 5.1 `payments`
Stores individual transaction records.
- `id` (`int8`, Primary Identity)
- `created_at` (`timestamptz`, default `now()`)
- `type` (`text`, required, e.g., `'GCash Cash-in'`)
- `tran_id` (`text`, nullable, max 4 chars)
- `date` (`date`, required)
- `time` (`time`, required)
- `amount` (`float8`, required, > 0)
- `charge` (`float8`, required, >= 0)
- `device` (`text`, required, e.g., `'CP1'`, `'ME'`)
- `note` (`text`, nullable, max 500 chars)
- `created_by` (`text`, user's email, populated automatically via database trigger from `user_roles.email`)

### 5.2 `balances`
Stores initial/starting cash balances per wallet per device.
- `id` (`int8`, Primary Identity)
- `created_at` (`timestamptz`, default `now()`)
- `type` (`text`, `'GCash'` or `'Maya'`)
- `device` (`text`, `'CP1'` through `'CP8'`)
- `date` (`date`, fixed to today)
- `amount` (`float8`, required, >= 0)

### 5.3 `user_roles`
Maps Supabase Auth users to roles and display emails.
- `id` (`int8`, Primary Identity)
- `user_id` (`uuid`, references `auth.users`)
- `role` (`app_role`: `'admin'` | `'moderator'` | `'user'`)
- `email` (`text`, required)

### 5.4 Database Triggers & RPCs
- **`get_server_time()`**: Returns the current database timestamp (`now()`) to ensure consistent Manila timezone validation.
- **`generate_payment_creator`**: Trigger that automatically populates `payments.created_by` with the authenticated user's email before insert.

---

## 6. Directory Structure & Key Files

```text
c:\git\digital-payment\
├── docs/specs/                     # Feature specifications & business flow diagrams
├── supabase/
│   └── migrations/                 # PostgreSQL migrations (tables, RLS, triggers)
├── src/
│   ├── app/
│   │   ├── actions/server-time.ts  # Cached server time RPC action
│   │   ├── auth/                   # Auth routes (signout, callback, update-password)
│   │   ├── balances/               # Balances dashboard & /balances/new form
│   │   ├── dashboard/              # Transactions dashboard & [id]/edit
│   │   ├── login/                  # Supabase Auth UI login page
│   │   ├── privacy/ & terms/       # Public legal pages
│   │   ├── transactions/new/       # Add transaction page & server action
│   │   ├── layout.tsx              # Root HTML shell & viewport configuration
│   │   └── page.tsx                # Redirects root '/' to '/login' or '/dashboard'
│   ├── components/
│   │   ├── auth/                   # AuthForm & UpdatePasswordForm
│   │   ├── balances/               # SetBalanceForm, BalanceRecords, Skeletons
│   │   ├── dashboard/              # DashboardTransactions, EditTransactionForm
│   │   ├── layout/                 # AppActionFooter (bottom navigation & balance gate)
│   │   └── transactions/           # NewTransactionForm, BalanceRequiredDialog
│   ├── lib/
│   │   ├── balance-access.ts       # RBAC role verification helpers
│   │   ├── payment-charge.ts       # Fee slab calculations (500 vs 1000)
│   │   ├── payment-options.ts      # Device-specific payment type mappings
│   │   ├── server-time.ts          # Asia/Manila date/time formatting helpers
│   │   └── utils.ts                # General UI utility functions (cn)
│   └── middleware.ts               # Session verification & route protection
├── CLEAN_CODE.md                   # Clean code conventions & engineering standards
├── CODE_COVERAGE.md                # 80% coverage requirements & Vitest thresholds
├── CODE_QUALITY.md                 # Linting & typechecking instructions
├── SECURITY.md                     # Security guardrails & access control standards
├── TESTING.md                      # Unit testing standards & blueprints
└── package.json
```

---

## 7. Application Routes & Navigation

| Route | Purpose | Access Level |
|---|---|---|
| `/` | Redirects to `/login` | Public |
| `/login` | Email/password sign-in & password recovery | Public (Redirects to `/dashboard` if authenticated) |
| `/auth/update-password` | Complete password reset | Public / Authenticated with recovery token |
| `/terms` & `/privacy` | Legal policies | Public |
| `/dashboard` | Daily transactions, filters, sorting, summary dialog | Authenticated (`admin`, `moderator`, `user`) |
| `/dashboard/transactions/[id]/edit` | Edit payment record | Authenticated (`admin`, or creator) |
| `/balances` | Balances dashboard & computed balances | Authenticated (`admin`, `moderator`) |
| `/balances/new` | Record new daily balance | Authenticated (`admin`, `moderator`) |
| `/transactions/new` | Add payment transaction | Authenticated (`admin`, `user`) |

---

## 8. UI/UX Principles & Mobile-First Standards

1. **Mobile-First (320px–430px)**: The application is used primarily on smartphones that hold the financial wallets. Every screen must be designed for single-column mobile viewports first, scaling up to desktop via `md:`/`lg:`.
2. **Touch Targets**: Minimum **44px** touch target size for buttons, inputs, and toggles.
3. **Skeleton Loaders Only**:
   - Asynchronous data fetching must show **skeleton loaders**.
   - **Never show blank screens, layout shifts, or spinning wheels** during data retrieval.
4. **No Horizontal Overflow**: Tables and grids must gracefully scroll internally or wrap into mobile cards (`viewMode === 'cards'`).
5. **Form Error Handling**: Validation errors highlight inline with `role='alert'` and auto-scroll smoothly into view on submission.

---

## 9. Engineering & Clean Code Standards

See [`CLEAN_CODE.md`](CLEAN_CODE.md) for full guidelines:
- **Style**: Single quotes (`'`), **no semicolons**, 2-space indentation.
- **TypeScript**: Strict mode enabled; **zero `any`**; explicit type annotations; prefer `type` over `interface`.
- **Functional Patterns**: Immutable transforms (`map`, `filter`, `reduce`); pure helper functions; early guard returns.
- **React Standards**: Single component per file; props destructured inline; accessible ARIA attributes (`aria-expanded`, `aria-controls`, `role='combobox'`).
- **Imports**: Grouped logically with `@/` absolute alias.
- **Safety**: Do not install new third-party npm packages without explicit prior confirmation.

---

## 10. Testing & Quality Assurance

The codebase enforces strict test-driven quality gates:

### Core Commands
- **Run all unit tests**: `npm test`
- **Interactive watch mode**: `npx vitest`
- **Coverage report**: `npm run test:coverage` (Enforces 80% coverage minimum across lines, functions, branches, statements)
- **Lint**: `npm run lint`
- **Typecheck**: `npm run typecheck`
- **Build**: `npm run build`

### Testing Conventions
- Unit tests live under `__tests__/` alongside the source code.
- Mocks simulate `@supabase/ssr`, server actions, and server time.
- All device comboboxes and payment flow variations must be covered under unit tests.

---

## 11. Security & Environment Configuration

### Environment Variables
Store in `.env.local` (never committed):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

### Security Rules
- **Never expose service-role or secret keys**: Only use the publishable key in client/server actions.
- **Server-Side Validation**: Validate all inputs on the server using regex, range checks, and allowlists even if client-side validation is present.
- **Row Level Security (RLS)**: Enforced on all Supabase tables.
- **Never commit generated state**: Keep `.env*.local`, `supabase/.temp/`, and `supabase/.branches/` strictly git-ignored.
