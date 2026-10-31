# Digital Payment

Digital Payment is a web application for recording and reviewing payments and transfers made through GCash, Maya, and supported banks. Authenticated users can review daily transactions and balances, filter and sort records, and add transactions or balances.

This application was built from scratch entirely with AI.

## Features

- Email-and-password sign-in and password recovery through Supabase Auth (account creation is not offered in the app)
- Protected dashboard and transaction-entry routes
- Transaction and balance dashboards with date selection limited to today or earlier
- Asynchronous dashboard date changes with loading skeletons while records are fetched
- Transaction filters, sorting, and table/card views
- Payment summary by type with amount and charge totals, plus a consolidated total calculated as cash-in and load + charges − cash-out
- Transaction entry with validated payment type, device, payment date/time, amount, charge, and transaction ID (optional for loads)
- Balance entry with validated balance type, device, and amount
- Responsive, mobile-first layouts

## Tech Stack

- Next.js 15 App Router
- React 19 and TypeScript with strict type checking
- Tailwind CSS 4 and shadcn/ui
- Supabase Auth UI, `@supabase/ssr`, and Supabase Postgres
- npm

## Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project with the `payments` table and authentication configured

## Getting Started

1. Install the dependencies:

   ```sh
   npm install
   ```

2. Copy the environment template to your local environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   On macOS or Linux, use `cp .env.example .env.local`.

3. Replace the placeholders in `.env.local` with your Supabase project URL and publishable key:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

   A publishable key is intended for browser use when database access is protected by Supabase Row Level Security. Never use a `service_role` key or secret key in client code or any `NEXT_PUBLIC_` variable.

4. In Supabase Authentication settings, enable email-and-password authentication and configure the allowed redirect URLs for your local and deployed origins.

5. Ensure the Supabase `payments` table matches the documented schema in [supabase.md](supabase.md), and configure Row Level Security policies for authenticated users to read and insert records as appropriate for your application.

6. Start the development server:

   ```sh
   npm run dev
   ```

7. Visit [http://localhost:3000/login](http://localhost:3000/login) and sign in. The root path redirects to the login page.

## Routes

| Path | Purpose | Access |
| --- | --- | --- |
| `/` | Redirects to `/login` | Public |
| `/login` | Sign-in and password recovery | Public; signed-in users are redirected to the dashboard |
| `/terms` | Terms of use | Public |
| `/privacy` | Privacy policy | Public |
| `/dashboard` | Date-based transactions, filters, totals, sorting, and table/card views | Authenticated |
| `/balances` | Date-based balance records and computed balances | Authenticated |
| `/transactions/new` | Add and save a payment transaction | Authenticated |
| `/balances/new` | Add and save a balance record | Authenticated |

The dashboard and transaction form use the `payments` table fields documented in [supabase.md](supabase.md). New transaction inserts are validated on the server before being sent to Supabase.

## Development Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks with `tsc --noEmit` |
| `npm test` | Run unit tests with Vitest (see [TESTING.md](TESTING.md)) |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build locally |

## Deploying to Vercel

This project is configured for Vercel using the Next.js framework preset.

1. Install the Vercel CLI if it is not already available:

   ```sh
   npm install --global vercel
   ```

2. Authenticate with Vercel and link the repository directory to your Vercel project:

   ```sh
   vercel login
   vercel link
   ```

   The `.vercel` directory contains local project-link metadata. It is ignored by Git and should not be committed.

3. Configure these environment variables in the Vercel project settings for Development, Preview, and Production:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

   Use the values from the Supabase project. Do not configure a Supabase `service_role` or secret key as a `NEXT_PUBLIC_` variable. Vercel supplies its system environment variables automatically; do not copy `VERCEL_OIDC_TOKEN` from a local environment file.

4. Deploy a preview build:

   ```sh
   vercel
   ```

5. Deploy to production:

   ```sh
   vercel deploy --prod
   ```

6. Add the deployed application URL to the allowed redirect URLs in Supabase Authentication settings. Confirm Supabase Row Level Security policies allow authenticated users to read and insert the records required by the app.

Vercel Deployment Protection may require viewers to authenticate with Vercel before they can open a deployment. If the project is not connected to its Git provider, deployments must be initiated with the Vercel CLI; connect the Git repository in Vercel project settings to enable automatic deployments on pushes.

## Local Production Run

To test a production build locally, run `npm run build` followed by `npm run start`. Configure the Supabase environment variables in the deployment environment as described above.

## Repository Guide

```text
src/
  app/                 App Router pages, layouts, global styles, and route handlers
  components/
    auth/              Supabase authentication UI
    dashboard/         Dashboard transaction list and display controls
    transactions/      Transaction entry form
  lib/                 Shared utilities and payment option definitions
  middleware.ts        Supabase session refresh and protected-route checks
docs/specs/            Feature specifications
supabase.md            Supabase payments table schema notes
```

Key implementation files:

- `src/app/dashboard/page.tsx` — Authenticates the request and fetches today's payment rows.
- `src/components/dashboard/DashboardTransactions.tsx` — Sort, table/card toggle, and summary UI.
- `src/app/transactions/new/actions.ts` — Validates and inserts a transaction through Supabase.
- `src/components/transactions/NewTransactionForm.tsx` — Transaction form fields and submit state.
- `src/lib/payment-options.ts` — Allowed payment types used by the form and server validation.
- `src/middleware.ts` — Protects dashboard and transaction-entry routes.

## Contribution Notes

- Keep TypeScript strict and follow the existing single-quote, no-semicolon style.
- Prefer the App Router server-first model; keep client components limited to interactive UI.
- Validate untrusted form data on the server and preserve Supabase Row Level Security.
- Check feature requirements in `docs/specs/` and the active project requirements in `REQUIREMENTS.md` before changing behavior.
- Run `npm run lint`, `npm run typecheck`, and `npm run build` before considering a change complete.
