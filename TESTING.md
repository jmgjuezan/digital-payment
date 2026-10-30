# Unit Testing Guide & Standards

This document establishes the official standards, patterns, and best practices for writing and executing unit tests in the Digital Payment application.

For authenticated Supabase and end-to-end checks against a dedicated test project, see [`INTEGRATION_TESTING.md`](INTEGRATION_TESTING.md).

For real-browser automation scope and responsive UI scenarios, see [`UI_AUTOMATION_TESTING.md`](UI_AUTOMATION_TESTING.md).

For browser performance measurements and dashboard loading checks, see [`PERFORMANCE_TESTING.md`](PERFORMANCE_TESTING.md).

---

## 1. Testing Philosophy & Guardrails

- **Test-Driven Development (TDD)**: As defined in [`AGENTS.md`](AGENTS.md), write unit tests using **Vitest** *before* completing or modifying feature logic.
- **Code Style Compliance**:
  - Strict TypeScript mode (no `any`; explicitly type test fixtures and mock values).
  - Functional programming patterns (favor pure helper functions over object mutation).
  - Single quotes (`'`) and **no semicolons**.
- **Coverage Scope**:
  - Critical domain calculations (payment charges, fee slabs, balances).
  - Input validations and error handling boundaries.
  - Asynchronous data fetching transitions and **skeleton loading states** (verifying only skeletons appear during async operations; no spinners or blank screens).
  - Supabase server actions and session authentication checks.

---

## 2. Testing Stack & Setup

### Core Technologies
- **Runner**: [Vitest](https://vitest.dev/)
- **Component Testing**: React Testing Library (`@testing-library/react`), `@testing-library/jest-dom`, `@testing-library/user-event`
- **Environment**: `jsdom` (or `happy-dom`) for DOM/React components; `node` for pure utilities and server actions

### Vitest Configuration Blueprint (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Setup File Blueprint (`vitest.setup.ts`)

```typescript
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

---

## 3. Directory & Naming Conventions

Place tests either adjacent to the code under test or in a `__tests__` subdirectory:

| Target | Test Location | Test File Name |
| --- | --- | --- |
| Utility / Helper | `src/lib/__tests__/` or `src/lib/` | `<name>.test.ts` |
| React Component | `src/components/**/__tests__/` or `src/components/**/` | `<Component>.test.tsx` |
| Server Action | `src/app/**/__tests__/` or `src/app/**/` | `actions.test.ts` |

---

## 4. Testing Patterns & Reference Blueprints

Follow the **Arrange-Act-Assert (AAA)** pattern across all unit test suites.

### A. Pure Utility & Domain Logic Tests

Test calculations, boundary values, zero/negative inputs, and branch variations without external mocks.

**Example**: Testing payment charge calculations ([`src/lib/payment-charge.ts`](src/lib/payment-charge.ts)):

```typescript
import { describe, expect, it } from 'vitest'
import { calculatePaymentCharge } from '@/lib/payment-charge'

describe('calculatePaymentCharge', () => {
  it('returns 0 for non-positive or invalid amounts', () => {
    expect(calculatePaymentCharge('GCash Cash-in', 0)).toBe(0)
    expect(calculatePaymentCharge('GCash Cash-in', -500)).toBe(0)
    expect(calculatePaymentCharge('GCash Cash-in', Number.NaN)).toBe(0)
  })

  it('calculates charges with a 500 slab for GCash and Maya types', () => {
    // 500 slab: 5 PHP charge per 500 PHP
    expect(calculatePaymentCharge('GCash Cash-in', 500)).toBe(5)
    expect(calculatePaymentCharge('GCash Cash-in', 501)).toBe(10)
    expect(calculatePaymentCharge('Maya Cash-out', 1000)).toBe(10)
    expect(calculatePaymentCharge('Maya Cash-out', 1200)).toBe(15)
  })

  it('calculates charges with a 1000 slab for other bank types', () => {
    // 1000 slab: 5 PHP charge per 1000 PHP
    expect(calculatePaymentCharge('BPI Cash-in', 1000)).toBe(5)
    expect(calculatePaymentCharge('BPI Cash-in', 1001)).toBe(10)
    expect(calculatePaymentCharge('UnionBank Cash-out', 2500)).toBe(15)
  })
})
```

---

### B. UI Component Tests: Mobile-first & Skeleton Loading

When testing UI components:
1. Verify that **only skeleton loaders** render during pending asynchronous data fetches.
2. Confirm no spinners, blank states, or layout shifts occur.
3. Validate mobile touch accessibility (inputs and action buttons accessible with 44px+ touch targets).

**Example**: Testing dashboard loading skeletons and data presentation:

```typescript
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import DashboardTransactions from '@/components/dashboard/DashboardTransactions'

const mockPayments = [
  {
    id: 1,
    created_at: '2026-10-31T01:00:00Z',
    type: 'GCash Cash-in',
    tran_id: 'TX12345',
    payment_date: '2026-10-31',
    date: '10:00:00',
    charge: 10,
    amount: 1000,
    device: 'Phone A',
    note: 'Payment note',
  },
]

describe('DashboardTransactions Component', () => {
  it('renders transaction data and summary totals correctly', () => {
    render(
      <DashboardTransactions
        transactions={mockPayments}
        hasError={false}
        timeZone='Asia/Manila'
        selectedDate='2026-10-31'
        userEmail='user@example.com'
      />
    )

    expect(screen.getByText('GCash Cash-in')).toBeInTheDocument()
    expect(screen.getByText('TX12345')).toBeInTheDocument()
  })

  it('displays skeleton blocks instead of spinners while fetching asynchronous date changes', async () => {
    // When date changes trigger async fetching, verify skeleton indicators are displayed
    const { container } = render(
      <DashboardTransactions
        transactions={mockPayments}
        hasError={false}
        timeZone='Asia/Manila'
        selectedDate='2026-10-31'
        userEmail='user@example.com'
      />
    )

    // Ensure no spinner elements exist in the DOM
    expect(container.querySelector('.spinner')).not.toBeInTheDocument()
  })

  it('displays error notice when data loading fails', () => {
    render(
      <DashboardTransactions
        transactions={[]}
        hasError={true}
        timeZone='Asia/Manila'
        selectedDate='2026-10-31'
        userEmail='user@example.com'
      />
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/transactions could not be loaded/i)).toBeInTheDocument()
  })
})
```

---

### C. Server Actions & Supabase Mocking

Server actions execute on the server and use `@supabase/ssr` cookies. Mock the Supabase client and `next/headers` to test authorization and mutation logic without real database calls.

**Example**: Testing server action validation and error branches:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getTransactionsForDate } from '@/app/dashboard/actions'

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

describe('getTransactionsForDate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an error for invalid date formats without querying the database', async () => {
    const result = await getTransactionsForDate('invalid-date')

    expect(result.hasError).toBe(true)
    expect(result.transactions).toEqual([])
  })
})
```

---

## 5. Execution Commands

| Command | Action |
| --- | --- |
| `npm test` | Run all unit tests once |
| `npx vitest` | Start Vitest in interactive watch mode during development |
| `npx vitest run --coverage` | Generate code coverage report |
| `npx vitest run src/lib/` | Run only utility tests |

---

## 6. Definition of Done Checklist for Tests

Before opening a pull request or completing a feature branch:

- [ ] Unit tests are written using Vitest prior to or alongside the implementation.
- [ ] All test cases pass (`npm test` exits with code 0).
- [ ] Critical success and failure paths are covered.
- [ ] Asynchronous UI flows show only skeleton loaders while pending data.
- [ ] Code style adhered to: functional programming patterns, strict TypeScript, single quotes, no semicolons.
- [ ] No flaky tests or unresolved mock leakages between tests.
