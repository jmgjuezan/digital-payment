# Performance Testing Guide

This guide describes the automated browser performance suite and optional manual profiling. The automated checks use the existing Playwright dependency and a local Docker Supabase environment; they do not add a performance-test package. See [`UI_AUTOMATION_TESTING.md`](UI_AUTOMATION_TESTING.md) for functional browser checks and [`CODE_COVERAGE.md`](CODE_COVERAGE.md) for code coverage.

## Run the automated performance suite

Start Docker Desktop, install Chromium once if needed, then run from PowerShell:

```powershell
npx playwright install chromium
powershell -ExecutionPolicy Bypass -File scripts/test-performance.ps1
```

The runner resets the local Supabase database, applies migrations, seeds a temporary authenticated user and sample records, builds the app in production mode, and launches the Playwright performance suite on desktop Chromium and Pixel 7 emulation. It resets the local database after the run. The app is served on `http://127.0.0.1:3200` during the test.

The suite measures authenticated `/dashboard` and `/balances` navigation. Each result includes TTFB, DOM content loaded, load time, LCP, CLS, transferred resource bytes, resource count, viewport, and response status. Playwright prints each `PERFORMANCE_RESULT` and attaches JSON reports under `test-results/performance/`.

Default local regression budgets are TTFB ≤ 2,000 ms, LCP ≤ 5,000 ms, and CLS ≤ 0.1. Override them for controlled environments with `PERF_BUDGET_TTFB_MS`, `PERF_BUDGET_LCP_MS`, and `PERF_BUDGET_CLS`. These are local regression thresholds, not production service-level objectives. CI or release comparisons should use a stable staging environment and a pinned browser/runtime.

## Goals

- Keep dashboard navigation and date changes responsive on mobile networks and devices.
- Measure initial rendering separately from Supabase data loading.
- Ensure loading skeletons appear while asynchronous dashboard requests are pending and are replaced by results when requests complete.
- Detect regressions in page weight, rendering, and browser responsiveness.

## Baseline environment

Record the following with every comparison so results are repeatable:

- Git commit and whether the app was built in production mode.
- Browser version, viewport, device emulation, and network/CPU throttling settings.
- Whether local Supabase was running and whether the database contained the same fixture data.
- Test date and the number of repeated runs.

Do not compare a development-server result with a production-build result. Development mode includes extra compilation and diagnostics overhead.

## Production build measurement

Build and run the production app locally:

```bash
npm run build
npm run start
```

Use the browser's Lighthouse panel or PageSpeed Insights against the running app. For authenticated dashboards, sign in with a dedicated local/test account first and run Lighthouse in Chrome DevTools so the authenticated session is retained. Do not submit production credentials or private transaction data to a public testing service.

Run at least three measurements for each target page and compare the median. Measure the login page, transaction dashboard, balances dashboard, Add transaction page, and Add balance page. Include a mobile profile (for example, 390px viewport with the Lighthouse mobile throttling profile) and desktop where relevant.

## Core measurements

Record these metrics when available:

- **LCP (Largest Contentful Paint):** target 2.5 seconds or less.
- **INP (Interaction to Next Paint):** target 200 milliseconds or less.
- **CLS (Cumulative Layout Shift):** target 0.1 or less.
- **TTFB (Time to First Byte):** record separately for local and deployed environments; interpret it in the context of hosting and network latency.
- JavaScript transfer size, total transferred page bytes, and failed/slow network requests.
- Time from changing a dashboard date to the matching data appearing.

Treat the Web Vitals targets as investigation thresholds, not guarantees across all devices or networks. Compare like-for-like runs and investigate sustained regressions rather than reacting to a single noisy sample.

## Dashboard async loading checks

Use Chrome DevTools Network throttling (for example, Fast 3G) and keep the Network panel open:

1. Sign in and open `/dashboard` and `/balances` in separate runs.
2. Record navigation-to-content timing and inspect the slowest requests.
3. Change the selected date to another valid date. Confirm the page does not navigate or reload.
4. Confirm the affected dashboard data area shows skeletons while its request is pending, then updates when the request completes.
5. Repeat with cache disabled, then with cache enabled. Note any material difference.
6. Repeat each scenario three times and compare the median.

The local Docker/Supabase environment is useful for repeatable functional checks, but its timings are not representative of production hosting. Use a controlled staging environment for release performance comparisons. See [`INTEGRATION_TESTING.md`](INTEGRATION_TESTING.md) and [`UI_AUTOMATION_TESTING.md`](UI_AUTOMATION_TESTING.md) for local test setup.

## Performance report template

```text
Date:
Commit:
Environment: local production build / staging
Browser and version:
Viewport and throttling:
Page:
Runs (median):
LCP:
INP:
CLS:
TTFB:
Date-change response:
Largest/slowest requests:
Notes or regressions:
```

## When a result regresses

1. Repeat the measurement with the same build mode, browser, viewport, and throttling.
2. Use the Performance and Network panels to identify whether time is spent in server response, JavaScript, rendering, or data fetching.
3. Check that dashboard requests are asynchronous and that unrelated page regions remain interactive while skeletons are shown.
4. Fix the measured bottleneck, then repeat the same measurements and record the before/after results.

The automated suite currently checks production dashboard navigation budgets. It does not collect INP, run Lighthouse, or represent production network latency. Use the manual workflow below for deeper profiling and staging comparisons.
