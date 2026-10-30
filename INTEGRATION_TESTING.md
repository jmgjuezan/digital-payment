# Integration Testing Guide

Integration tests check that the application works across its boundaries, including authenticated Supabase requests, database policies, server actions, and dashboard updates.

## Current test setup

The default Vitest suite uses mocked Supabase and Next.js navigation. A separate suite at `tests/integration/` connects to a local Supabase stack running in Docker and verifies authenticated access to the balances and payments queries under row-level security (RLS). The local schema is defined by `supabase/migrations/`. Integration tests create a temporary local auth user and read the tables; resetting the local database removes all test data. The suite is excluded from `npm test`.

The suite creates a temporary auth user and otherwise uses read-only table queries. It only accepts localhost Supabase URLs, so it cannot write test credentials to a hosted project.

## Environment and data safety

- Install Docker Desktop and start it. The script uses an installed Supabase CLI or downloads it through `npx` when needed.
- Run the project-local script from PowerShell. It starts Supabase in Docker, resets the local database, applies migrations, reads the local API key, and runs the integration suite.
- The script never targets a hosted project and does not use a service-role key.
- Supabase CLI runtime state can contain generated local credentials, including service-role keys and JWT secrets. The repository ignores `supabase/.temp/` and `supabase/.branches/`; do not force-add or commit these directories. Only add intentional project files such as `supabase/config.toml`, migrations, and reviewed seed data.
- Before committing Supabase changes, inspect `git status --short` and the staged diff. Confirm `.env*` files (except documented example templates) and generated Supabase state are not staged, and do not paste credential values into commit messages or issue reports.

## Run the application

1. Install dependencies with `npm install` if needed.
2. Start the local Supabase stack with `supabase start`.
3. Copy the API URL and anon key from `supabase status` into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Start the application with `npm run dev`.
5. Create a local account through the app's sign-up flow, then complete the manual checks below.

Run the Docker-backed Supabase integration suite from the repository root:

```bash
powershell -ExecutionPolicy Bypass -File scripts/test-integration.ps1
```

The script requires Docker Desktop and the Supabase CLI. It runs `supabase start`, `supabase db reset`, and the integration tests. Local email confirmations are disabled so the suite can create a temporary test user without sending email. The app's table reads run as that authenticated user through the local API and RLS policies.

## Integration checklist

### Authentication and access

- Sign in and confirm the authenticated pages load.
- Sign out and confirm protected pages return to the login screen.
- Confirm the test user can access only records allowed by the configured RLS policies.

### Balances and transactions

- Run the automated reads against the local migrated tables and verify authenticated access under RLS.
- Use the local app pointed at Supabase's local API to manually exercise balance and payment writes.
- Confirm Transaction ID is required for every payment type except loads.
- Confirm the searchable payment type and device fields submit only a selected option.
- Confirm the transaction date accepts yesterday and today, and rejects dates outside that range.

### Dashboards

- Change dates on both dashboards and confirm data updates without a full page navigation.
- Confirm skeletons appear while date data is loading and errors are shown if a request fails.
- Confirm future dates cannot be selected.
- Filter transactions by payment type and device in both table and card views; confirm the displayed count and totals match the filtered records.
- Confirm balance records and computed balances use the selected date and corresponding payment activity.

## After integration checks

- The script resets the local database before every integration run. Do not use it against data you need to preserve.
- Run `npm test` for the mocked unit and component suite.
- Run `npm run test:coverage` to check the configured coverage thresholds.

Never edit the local test script to point at production or a hosted Supabase project. It enforces localhost for integration tests.
