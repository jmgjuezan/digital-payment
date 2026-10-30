# UI Automation Testing Guide

UI automation tests exercise the running application in a real browser. Use them to verify navigation, responsive layouts, keyboard interaction, browser validation, and loading states that component tests in jsdom cannot fully reproduce.

## Current setup

Playwright runs the browser suite in `tests/ui/` using `playwright.config.ts`. Vitest uses jsdom for unit and component tests; those tests are not a substitute for real-browser UI automation. The Playwright suite runs in desktop Chromium and Pixel 7 mobile emulation.

## Test environment

- UI tests use the local Supabase stack defined in `supabase/config.toml` and run only against localhost.
- The runner resets the local database, applies migrations, and reads the local API URL and publishable key from the Supabase CLI.
- Playwright global setup creates a temporary authenticated user and deterministic balance/payment rows through the public API. It does not use a service-role key.
- The runner resets the local database after the browser suite, including when tests fail.

See [`INTEGRATION_TESTING.md`](INTEGRATION_TESTING.md) for Supabase environment and data-safety guidance.

For production-build browser performance checks, see [`PERFORMANCE_TESTING.md`](PERFORMANCE_TESTING.md).

## Setup and run

1. Install Docker Desktop and the Supabase CLI (or allow the runner to fetch it through `npx`), then start Docker Desktop.
2. Install the Chromium browser once:

   ```bash
   npx playwright install chromium
   ```

3. Run the Docker-backed browser suite from PowerShell:

   ```bash
   powershell -ExecutionPolicy Bypass -File scripts/test-ui.ps1
   ```

The runner starts and resets local Supabase, creates a temporary test account and seed data, starts Next.js on port 3100, and runs Playwright on desktop Chromium and Pixel 7 emulation. It resets the local database afterward. No `.env.e2e.local` or hosted test account is needed.

The automated suite currently covers sign-in, both dashboard date limits, transaction filtering, the consolidated payment summary and its displayed formula using seeded Supabase data, mobile page overflow, Add balance typeahead selection, and rejection of an unlisted balance type. The suite runs against local Docker Supabase and exercises the real authenticated app and database policies.

## Browser and viewport coverage

At minimum, cover:

- A narrow mobile viewport (320px or 375px wide).
- A common phone viewport (390px or 430px wide).
- A desktop viewport where the layout changes.
- Chromium as the baseline browser. Add other supported browsers when the automation runner is configured for them.

Check that there is no page-level horizontal overflow, sticky headers and footers do not cover controls, and touch targets remain usable on phones.

## Core UI flows

### Authentication

- Sign in with the dedicated test account and reach a protected dashboard.
- Sign out and confirm protected screens require authentication.

### Add balance

- Search and select GCash or Maya from the Balance type combobox.
- Search and select a device from the Device combobox.
- Verify arbitrary text that is not selected from the options cannot be submitted.
- Submit a valid balance and verify the saving overlay blocks interaction until the request completes.
- Verify a server error closes the overlay and leaves the form available for correction.

### Add transaction

- Search and select a payment type and device using keyboard and pointer input.
- Verify Transaction ID is required for all payment types except loads.
- Verify the date picker allows yesterday and today, but not future or older dates.
- Submit a valid transaction and verify the saving overlay blocks interaction while saving.
- Verify an action error closes the overlay and displays the error.

### Dashboards

- Change the date on both dashboards and confirm only the relevant data regions show skeletons while the rest of the page remains available.
- Verify selecting a future date is prevented.
- Filter transactions by type and device in table and card views, and confirm counts and totals match the visible results.
- Confirm the payment summary displays the consolidated total using `cash-in and load + charges − cash-out` and shows the component values used in the formula.
- Confirm balance and computed balance views update to the selected date.

## Locator and assertion guidance

- Prefer accessible locators based on labels, roles, and visible names (for example, a date input by its label or a button by its name).
- Use `data-testid` only when an element has no suitable user-facing accessible name.
- Wait for a meaningful result, such as a table row, confirmation, error, or skeleton state. Avoid fixed-duration sleeps.
- For loading tests, control response timing so the skeleton can be observed reliably, then assert that the resolved data replaces it.
- Test keyboard operation for comboboxes, dialogs, and form submission in addition to pointer interaction.

## Other test commands

The mocked unit and component test commands remain:

```bash
npm test
npm run test:coverage
```

These run Vitest tests; they do not launch a real browser. Playwright is run separately with `npx playwright test`.
