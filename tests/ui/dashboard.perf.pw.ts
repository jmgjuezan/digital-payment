import { expect, test, type Page, type TestInfo } from '@playwright/test'

declare global {
  interface Window {
    __performanceMetrics?: {
      lcp: number | null
      cls: number
    }
  }
}

const budgets = {
  ttfb: Number(process.env.PERF_BUDGET_TTFB_MS ?? 2000),
  lcp: Number(process.env.PERF_BUDGET_LCP_MS ?? 5000),
  cls: Number(process.env.PERF_BUDGET_CLS ?? 0.1),
}

async function collectPageMetrics(page: Page) {
  await page.addInitScript(() => {
    const metrics = { lcp: null as number | null, cls: 0 }
    window.__performanceMetrics = metrics

    if ('PerformanceObserver' in window) {
      try {
        const largestContentObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          if (lastEntry) metrics.lcp = lastEntry.startTime
        })
        largestContentObserver.observe({ type: 'largest-contentful-paint', buffered: true })

        const layoutShiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
            if (!shift.hadRecentInput) metrics.cls += shift.value ?? 0
          }
        })
        layoutShiftObserver.observe({ type: 'layout-shift', buffered: true })
      } catch {
        // Unsupported entry types are reported as unavailable in the result.
      }
    }
  })
}

async function measureAuthenticatedDashboard(
  page: Page,
  route: '/dashboard' | '/balances',
  heading: string,
  testInfo: TestInfo,
) {
  await collectPageMetrics(page)
  const navigationStartedAt = Date.now()
  const response = await page.goto(route, { waitUntil: 'load' })
  await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))

  const result = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    return {
      ttfbMs: navigation ? Math.round(navigation.responseStart - navigation.requestStart) : null,
      domContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
      loadMs: navigation ? Math.round(navigation.loadEventEnd) : null,
      lcpMs: window.__performanceMetrics?.lcp === null || window.__performanceMetrics?.lcp === undefined
        ? null
        : Math.round(window.__performanceMetrics.lcp),
      cls: Number((window.__performanceMetrics?.cls ?? 0).toFixed(4)),
      transferredBytes: resources.reduce((total, resource) => total + resource.transferSize, 0),
      resourceCount: resources.length,
    }
  })

  const report = {
    route,
    viewport: page.viewportSize(),
    httpStatus: response?.status() ?? null,
    wallTimeMs: Date.now() - navigationStartedAt,
    ...result,
    budgets,
  }
  console.log(`PERFORMANCE_RESULT ${JSON.stringify(report)}`)
  await testInfo.attach(`${route.slice(1)}-performance.json`, {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  })

  expect(report.httpStatus, `${route} should return a successful response`).toBe(200)
  expect(report.ttfbMs, `${route} TTFB should be within budget`).not.toBeNull()
  expect(report.ttfbMs ?? Number.POSITIVE_INFINITY, `${route} TTFB should be within budget`).toBeLessThanOrEqual(budgets.ttfb)
  expect(report.lcpMs, `${route} should produce a Largest Contentful Paint entry`).not.toBeNull()
  expect(report.lcpMs ?? Number.POSITIVE_INFINITY, `${route} LCP should be within budget`).toBeLessThanOrEqual(budgets.lcp)
  expect(report.cls, `${route} CLS should be within budget`).toBeLessThanOrEqual(budgets.cls)
}

test('transaction dashboard meets local production performance budgets', async ({ page }, testInfo) => {
  await measureAuthenticatedDashboard(page, '/dashboard', 'Transactions', testInfo)
})

test('balances dashboard meets local production performance budgets', async ({ page }, testInfo) => {
  await measureAuthenticatedDashboard(page, '/balances', 'Balances', testInfo)
})
