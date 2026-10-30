import { beforeEach, describe, expect, it, vi } from 'vitest'
import NewTransactionPage from '@/app/transactions/new/page'

const { mockGetUser, mockEq } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockEq: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn(), set: vi.fn() }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((...args: unknown[]) => {
    const config = args[2] as { cookies: { getAll: () => unknown; setAll: (items: { name: string; value: string; options: Record<string, unknown> }[]) => void } }
    config.cookies.getAll()
    config.cookies.setAll([{ name: 'sb-test', value: 'test', options: {} }])
    return {
      auth: { getUser: mockGetUser },
      from: () => ({ select: () => ({ eq: mockEq }) }),
    }
  }),
}))

vi.mock('@/components/transactions/BalanceRequiredDialog', () => ({
  default: ({ hasError }: { hasError: boolean }) => <div data-testid='balance-required' data-error={String(hasError)} />,
}))
vi.mock('@/components/transactions/NewTransactionForm', () => ({
  default: () => <div data-testid='new-transaction-form' />,
}))

describe('NewTransactionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key'
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@example.com' } } })
  })

  it('redirects when Supabase is not configured', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    await expect(NewTransactionPage()).rejects.toThrow('NEXT_REDIRECT:/login')
  })

  it('redirects unauthenticated users', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(NewTransactionPage()).rejects.toThrow('NEXT_REDIRECT:/login')
  })

  it('requires a balance when no balance is recorded today', async () => {
    mockEq.mockResolvedValue({ count: 0, error: null })

    const { render, screen } = await import('@testing-library/react')
    render(await NewTransactionPage())

    expect(screen.getByTestId('balance-required')).toHaveAttribute('data-error', 'false')
  })

  it('requires a balance when the balance query errors', async () => {
    mockEq.mockResolvedValue({ count: 1, error: { message: 'database error' } })

    const { render, screen } = await import('@testing-library/react')
    render(await NewTransactionPage())

    expect(screen.getByTestId('balance-required')).toHaveAttribute('data-error', 'true')
  })

  it('renders the transaction form when a balance exists', async () => {
    mockEq.mockResolvedValue({ count: 1, error: null })

    const { render, screen } = await import('@testing-library/react')
    render(await NewTransactionPage())

    expect(screen.getByTestId('new-transaction-form')).toBeInTheDocument()
  })
})
