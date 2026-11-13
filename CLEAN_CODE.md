# Clean Code Standards

This document defines the clean code standards for the Digital Payment application. All contributors — human and AI — must follow these rules when writing or reviewing code.

> [!IMPORTANT]
> These standards are derived directly from the patterns established in the existing codebase. When in doubt, read a nearby file and match its style exactly.

---

## Table of Contents

1. [Formatting](#1-formatting)
2. [Naming](#2-naming)
3. [TypeScript](#3-typescript)
4. [Functions](#4-functions)
5. [Components](#5-components)
6. [State & Side Effects](#6-state--side-effects)
7. [Server Actions](#7-server-actions)
8. [Error Handling](#8-error-handling)
9. [Data & Domain Logic](#9-data--domain-logic)
10. [Imports & Module Structure](#10-imports--module-structure)
11. [Comments & Documentation](#11-comments--documentation)
12. [What to Avoid](#12-what-to-avoid)
13. [Definition of Done Checklist](#13-definition-of-done-checklist)

---

## 1. Formatting

### Quotes and Semicolons

Always use **single quotes**. Never use semicolons at the end of statements.

```typescript
// ✅ Good
const label = 'GCash Cash-in'
import { useState } from 'react'

// ❌ Bad
const label = "GCash Cash-in";
import { useState } from "react";
```

### Indentation

Use **2 spaces** for indentation. Never use tabs.

### Line Length

Keep lines reasonably short. When a function call or JSX attribute list grows long, place each argument or prop on its own line and indent by 2 spaces.

```typescript
// ✅ Good — props broken onto separate lines
export default function EditTransactionForm({
  payment,
  returnDate,
  today = payment.date,
}: {
  payment: Payment
  returnDate?: string
  today?: string
}) {
```

### Trailing Newline

Do **not** add a trailing newline to files unless the project formatter enforces one (there is currently no formatter configured). Follow the convention of the file being edited.

---

## 2. Naming

### Variables and Functions

Use **camelCase** for all variables, function parameters, and local function names.

```typescript
// ✅ Good
const paymentTypeQuery = ''
function selectPaymentType(nextType: string) { ... }
const filteredDevices = deviceOptions.filter(...)

// ❌ Bad
const PaymentTypeQuery = ''
function SelectPaymentType(next_type: string) { ... }
```

### Constants and Module-Level Values

Use **camelCase** for exported constants that are arrays or objects. Use `SCREAMING_SNAKE_CASE` only when the value represents a true compile-time constant that never changes and is not a data structure (rare).

```typescript
// ✅ Good — arrays and sets use camelCase
export const paymentTypeOptions = [...] as const
const fiveHundredSlabTypes = new Set([...])
const balanceDevices = Array.from({ length: 8 }, ...)
```

### React Components

Use **PascalCase** for component names and their files.

```
NewTransactionForm.tsx      ✅
DashboardTransactions.tsx   ✅
newTransactionForm.tsx      ❌
```

### TypeScript Types and Interfaces

Use **PascalCase** for `type` and `interface` names.

```typescript
export type UserRole = 'admin' | 'moderator' | 'user'
export type CreatePaymentState = { error?: string }
type SortField = keyof Payment
type ViewMode = 'table' | 'cards'
```

### Event Handlers

Prefix event handler functions with `handle` or `select` depending on the action:

```typescript
function handleSubmit(event: React.FormEvent<HTMLFormElement>) { ... }
function handleDeviceKeyDown(event: React.KeyboardEvent<HTMLInputElement>) { ... }
function selectPaymentType(nextType: string) { ... }
function selectDevice(nextDevice: string) { ... }
```

### Boolean State Variables

Prefix booleans with a verb that expresses their meaning:

```typescript
const [deviceMenuOpen, setDeviceMenuOpen] = useState(false)
const [paymentTypeSelectionError, setPaymentTypeSelectionError] = useState(false)
const [isDateLoading, setIsDateLoading] = useState(false)
const [showChargeHelp, setShowChargeHelp] = useState(false)
```

---

## 3. TypeScript

### Strict Mode

The project runs with `"strict": true` in `tsconfig.json`. Never disable or weaken strict checks.

### No `any`

Never use `any` as a type. Use `unknown`, proper generics, or type narrowing instead.

```typescript
// ✅ Good
function getUserRole(supabase: SupabaseClient, userId: string): Promise<UserRole | null>

// ❌ Bad
function getUserRole(supabase: any, userId: any): Promise<any>
```

### Prefer Type Aliases over Interfaces

Use `type` for all object shapes and unions. Reserve `interface` only when declaration merging is required (rare in this codebase).

```typescript
// ✅ Good
export type Payment = {
  id: number
  created_at: string
  type: string
  tran_id: string | null
}

// ❌ Avoid unless merging
interface Payment { ... }
```

### `as const` for Readonly Tuples and Arrays

Mark literal arrays that must not change with `as const`:

```typescript
export const paymentTypeOptions = [
  'GCash Cash-in',
  'GCash Cash-out',
  ...
] as const
```

### Discriminated Unions and Narrowing

Use type guards and narrowing instead of casting:

```typescript
// ✅ Good — narrows with a type predicate
.filter((creator): creator is string => Boolean(creator))

// ❌ Bad
.filter((creator) => Boolean(creator)) as string[]
```

### Avoid Non-Null Assertions

Use optional chaining (`?.`) and nullish coalescing (`??`) instead of `!`:

```typescript
// ✅ Good
const role = userRole?.role ?? null
const email = data.email?.trim() ?? null

// ❌ Avoid
const role = userRole!.role
```

---

## 4. Functions

### Small and Single-Purpose

Each function should do one thing. If a function name requires the word "and", split it.

### Functional Style Over Imperative

Prefer `map`, `filter`, `reduce`, and `Array.from` over `for` loops with mutation.

```typescript
// ✅ Good
const creatorIds = [...new Set(
  payments
    .map((payment) => payment.created_by)
    .filter((creator): creator is string => Boolean(creator))
)]

// ❌ Avoid
const creatorIds: string[] = []
for (const payment of payments) {
  if (payment.created_by && !creatorIds.includes(payment.created_by)) {
    creatorIds.push(payment.created_by)
  }
}
```

### Early Returns

Return early from functions when a guard condition fails. Avoid deeply nested `if/else` trees.

```typescript
// ✅ Good
if (!validPaymentDate) return { error: 'Enter a valid payment date.' }
if (!paymentTime) return { error: 'Enter the payment time.' }
if (!Number.isFinite(amount) || amount <= 0) return { error: 'Amount must be greater than zero.' }
// ... happy path continues

// ❌ Avoid
if (validPaymentDate) {
  if (paymentTime) {
    if (Number.isFinite(amount) && amount > 0) {
      // ... buried happy path
    }
  }
}
```

### Avoid Unnecessary Default Exports for Utilities

Utility functions are named exports. Only React components use `export default`.

```typescript
// ✅ Good — utility
export function calculatePaymentCharge(type: string, amount: number) { ... }

// ✅ Good — component
export default function NewTransactionForm(...) { ... }
```

---

## 5. Components

### One Component per File

Each file exports one default React component. Helper sub-components that only exist to serve the main component may be defined in the same file but not exported.

```typescript
// ✅ Good — private helper, same file
function TransactionsLoadingSkeleton({ viewMode }: { viewMode: ViewMode }) { ... }

export default function DashboardTransactions(...) { ... }
```

### Props via Destructured Object

Always destructure props inline in the function signature:

```typescript
// ✅ Good
export default function EditTransactionForm({
  payment,
  returnDate,
  today = payment.date,
}: {
  payment: Payment
  returnDate?: string
  today?: string
}) {
```

### No Prop Drilling Beyond Two Levels

If a value needs to pass through more than two component layers, lift state or use a server-side prop at the page level.

### Skeleton Loaders Only During Async Fetches

When data is loading, render skeleton placeholder elements. Never show a spinner, blank screen, or layout shift.

```tsx
// ✅ Good
{isDateLoading ? (
  <TransactionsLoadingSkeleton viewMode={viewMode} />
) : hasError ? (
  <div role='alert'>...</div>
) : (
  <div>...data...</div>
)}
```

### Accessibility Attributes

- Every interactive element must have an accessible name via `aria-label`, `aria-labelledby`, or visible label text.
- Use `aria-required`, `aria-expanded`, `aria-controls`, and `aria-activedescendant` on combobox inputs.
- Use `role='alert'` for inline error messages so screen readers announce them immediately.
- Use `role='status'` for non-urgent live region updates.

```tsx
<input
  role='combobox'
  aria-autocomplete='list'
  aria-required='true'
  aria-expanded={deviceMenuOpen}
  aria-controls='device-options'
  aria-activedescendant={activeDeviceIndex >= 0 ? `device-option-${activeDeviceIndex}` : undefined}
/>
<span role='alert' id='device-selection-error'>Select a device from the list.</span>
```

---

## 6. State & Side Effects

### Co-locate State with Usage

Declare `useState` hooks at the top of the component, grouped logically (e.g., device state together, payment type state together, UI/server state at the end).

### Ref Usage

Use `useRef` for:
- DOM element references needed for imperative operations (focus, scrollIntoView, dialog open/close).
- Mutable values that must not trigger re-renders (request IDs, previous values).

```typescript
const deviceInputRef = useRef<HTMLInputElement>(null)
const dateRequestId = useRef(0) // tracks latest async request; mutation is intentional
```

### `useEffect` Cleanup

Always return a cleanup function from `useEffect` when registering event listeners or timers:

```typescript
useEffect(() => {
  const intervalId = window.setInterval(() => { ... }, 30_000)
  return () => window.clearInterval(intervalId)
}, [])

useEffect(() => {
  document.addEventListener('pointerdown', handler)
  return () => document.removeEventListener('pointerdown', handler)
}, [dependency])
```

### `useMemo` for Expensive Derivations

Use `useMemo` to memoize derived values that depend on large arrays or complex sorts, and to avoid recomputing on every render:

```typescript
const filteredTransactions = useMemo(
  () => transactions.filter((payment) =>
    (!typeFilter || payment.type === typeFilter) &&
    (!deviceFilter || payment.device === deviceFilter)
  ),
  [transactions, typeFilter, deviceFilter],
)
```

### `useCallback` for Stable Function References

Use `useCallback` when passing a function as a dependency to `useEffect` or as a prop to a memoized child:

```typescript
const submitForm = useCallback(() => formRef.current?.requestSubmit(), [])
```

---

## 7. Server Actions

### `'use server'` Directive

Every server action file must start with `'use server'` as its very first line.

### Validate All Input Server-Side

Never trust client input. Even when the client validates, repeat all validation on the server:

1. **Presence** — verify the value is not empty.
2. **Format** — test with a regex (`/^\d{4}-\d{2}-\d{2}$/`).
3. **Range** — ensure numeric values are in bounds (`amount > 0`).
4. **Allowlist** — check against a known-good list for categorical fields.

```typescript
// ✅ Pattern used throughout the codebase
const validPaymentDate =
  /^\d{4}-\d{2}-\d{2}$/.test(paymentDate) &&
  !Number.isNaN(parsedPaymentDate.getTime()) &&
  parsedPaymentDate.toISOString().slice(0, 10) === paymentDate

if (!paymentTypeOptions.includes(type as (typeof paymentTypeOptions)[number])) {
  return { error: 'Enter a payment type, device, and valid non-negative amount and charge.' }
}
```

### Authentication Before Any Logic

The very first real operation in a server action (after extracting form data) must be authenticating the user:

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

### Return `{ error: string }` Shape

Server actions return a consistent `{ error?: string }` state object. Never throw errors to the client. Use `redirect()` on success.

### Environment Variable Guard

Check for required environment variables before creating a Supabase client:

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if (!supabaseUrl || !supabasePublishableKey) return { error: 'Supabase is not configured.' }
```

---

## 8. Error Handling

### Generic User-Facing Messages

Never expose internal error codes, stack traces, or database messages to the user. Log the technical detail server-side and return a generic message:

```typescript
// ✅ Good
if (error) {
  console.error('Failed to create payment', { code: error.code, message: error.message })
  return { error: 'Could not save the transaction. Check your access and try again.' }
}

// ❌ Bad
if (error) return { error: error.message }
```

### Known Error Codes Get Specific Messages

When a database or API error code is well-understood, return a specific, actionable message:

```typescript
if (error.code === '23505') return { error: 'Duplicate transaction.' }
if (error.code === '42501') return { error: 'You do not have permission to save this transaction.' }
```

### Async Race Conditions

Track async request IDs to discard stale responses when the user interacts before a previous fetch completes:

```typescript
const requestId = ++dateRequestId.current

const result = await getTransactionsForDate(date)
if (requestId !== dateRequestId.current) return // stale — discard

setTransactions(result.transactions as Payment[])
```

### `try / catch / finally`

Use `try/catch` around any operation that may throw. Use `finally` to always clean up loading state:

```typescript
try {
  const result = await getTransactionsForDate(date)
  if (requestId !== dateRequestId.current) return
  setTransactions(result.transactions as Payment[])
  setHasError(result.hasError)
} catch {
  if (requestId === dateRequestId.current) setHasError(true)
} finally {
  if (requestId === dateRequestId.current) setIsDateLoading(false)
}
```

---

## 9. Data & Domain Logic

### Keep Domain Logic in `src/lib/`

Pure calculation and data-access helper functions belong in `src/lib/`, not in components or server actions:

| File | Responsibility |
|---|---|
| `src/lib/payment-charge.ts` | Charge calculation per payment type |
| `src/lib/payment-options.ts` | Available payment types per device |
| `src/lib/balance-access.ts` | Role checks and user-role queries |
| `src/lib/server-time.ts` | Server-time helpers (timezone, today, yesterday) |

### `as const` Allowlists

Domain allowlists (payment types, roles) must be `as const` arrays so the TypeScript compiler can narrow their member types:

```typescript
export const paymentTypeOptions = [
  'GCash Cash-in',
  ...
] as const
// typeof paymentTypeOptions[number] === 'GCash Cash-in' | ...
```

### Use `Set` for O(1) Membership Checks

When checking whether a value belongs to a known group inside a hot path, use a `Set`:

```typescript
const fiveHundredSlabTypes = new Set([
  'GCash Cash-in',
  'GCash Cash-out',
  'Maya Cash-in',
  'Maya Cash-out',
])

const slabSize = fiveHundredSlabTypes.has(type) ? 500 : 1000
```

### Number Safety

Always validate numeric input with `Number.isFinite()`. Never trust `NaN` comparisons:

```typescript
// ✅ Good
if (!Number.isFinite(amount) || amount <= 0) return 0

// ❌ Bad — NaN <= 0 is false, so this passes for NaN
if (amount <= 0) return 0
```

---

## 10. Imports & Module Structure

### Import Order

Group imports in this order, separated by a blank line:

1. React and framework (`react`, `next/*`)
2. Third-party libraries (`lucide-react`, `@supabase/*`)
3. Internal aliases (`@/lib/*`, `@/components/*`, `@/app/*`)

```typescript
// ✅ Good
import { useActionState, useEffect, useRef, useState } from 'react'
import { CircleHelp } from 'lucide-react'
import { createPayment, type CreatePaymentState } from '@/app/transactions/new/actions'
import { calculatePaymentCharge } from '@/lib/payment-charge'
import { paymentTypeOptions, getPaymentTypesForDevice } from '@/lib/payment-options'
```

### Path Alias

Always use the `@/` alias for imports from `src/`. Never use relative paths that traverse upward more than one level.

```typescript
// ✅ Good
import { calculatePaymentCharge } from '@/lib/payment-charge'

// ❌ Bad
import { calculatePaymentCharge } from '../../../../lib/payment-charge'
```

### Type-Only Imports

Use `import type` when importing only types to keep the runtime bundle clean:

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Payment } from '@/components/dashboard/DashboardTransactions'
```

---

## 11. Comments & Documentation

### Comment Intent, Not Mechanics

Write comments to explain **why** a decision was made, not **what** the code does (the code explains itself):

```typescript
// ✅ Good — explains the why
// Middleware refreshes cookies when server components cannot write them.
} catch { }

// Auto-select payment type if there's only one option
if (availableTypes.length === 1) {
  selectPaymentType(availableTypes[0])
}

// ❌ Bad — restates the code
// Set device menu open to false
setDeviceMenuOpen(false)
```

### No Placeholder Comments

Do not leave `TODO`, `FIXME`, or `HACK` comments in committed code unless they reference a tracked issue.

### Inline `// eslint-disable` Comments

Avoid ESLint disable comments. If a rule must be suppressed, leave a comment explaining the exceptional case.

---

## 12. What to Avoid

| ❌ Avoid | ✅ Use Instead |
|---|---|
| `any` type | `unknown`, generics, or proper narrowing |
| Semicolons | Omit them |
| Double quotes in source | Single quotes |
| `var` declarations | `const` or `let` |
| `for...of` loops for transformations | `map`, `filter`, `reduce` |
| `innerHTML` / `dangerouslySetInnerHTML` | React JSX rendering |
| Nested `if/else` chains | Early returns |
| Unnamed magic numbers | Named `const` or `Set` |
| `console.log` in production paths | `console.error` for genuine errors only |
| Spinners or blank screens during loading | Skeleton loaders only |
| Relative imports crossing multiple dirs | `@/` path alias |
| Non-null assertions (`!`) | Optional chaining (`?.`) |
| Committing `.env.local` | Keep in `.gitignore` |
| New third-party packages without approval | Ask first; see `AGENTS.md` |

---

## 13. Definition of Done Checklist

Before committing or submitting a pull request, verify every item:

- [ ] **Formatting**: Single quotes, no semicolons, 2-space indentation.
- [ ] **TypeScript**: No `any`, no `@ts-ignore`, no non-null assertions; `npm run typecheck` passes.
- [ ] **Lint**: `npm run lint` exits with no errors.
- [ ] **Tests**: All existing tests pass (`npm test`). New behaviour has unit tests written alongside the code.
- [ ] **Coverage**: `npm run test:coverage` meets the 80% thresholds defined in [`CODE_COVERAGE.md`](CODE_COVERAGE.md).
- [ ] **Early returns**: Guards at the top; no deeply nested branches.
- [ ] **No magic values**: Domain constants live in `src/lib/`; device/payment lists are `as const`.
- [ ] **Accessibility**: All interactive elements have accessible names; errors use `role='alert'`.
- [ ] **Mobile-first**: UI changes verified at 320 px width before desktop; touch targets ≥ 44 px.
- [ ] **Skeleton loaders**: Loading states use skeleton elements, not spinners or blank screens.
- [ ] **Server-side validation**: Every field validated in the server action regardless of client checks.
- [ ] **Authentication**: Server actions authenticate the user before processing any input.
- [ ] **No secrets**: No credentials, keys, or generated Supabase state files are staged or committed.
- [ ] **Scope**: The diff is tightly scoped to the requested change; no unrelated refactoring.

---

> [!TIP]
> Use `npm run lint` and `npm run typecheck` together as a quick gate before every commit. See [`CODE_QUALITY.md`](CODE_QUALITY.md) for the full suggested command order.
