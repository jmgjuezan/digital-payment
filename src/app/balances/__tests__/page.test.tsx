import { beforeEach, describe, expect, it, vi } from 'vitest'
import BalancesPage from '@/app/balances/page'

const { mockGetUser, mockBalanceOrder, mockPaymentLte } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockBalanceOrder: vi.fn(),
  mockPaymentLte: vi.fn(),
}))

vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: vi.fn(), set: vi.fn() }) }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((...args: unknown[]) => {
    const config = args[2] as { cookies: { getAll: () => unknown; setAll: (items: { name: string; value: string; options: Record<string, unknown> }[]) => void } }
    config.cookies.getAll()
    config.cookies.setAll([{ name: 'sb-test', value: 'test', options: {} }])

    return {
      auth: { getUser: mockGetUser },
      from: (table: string) => table === 'balances'
        ? { select: () => ({ eq: () => ({ order: mockBalanceOrder }) }) }
        : { select: () => ({ gte: () => ({ lte: mockPaymentLte }) }) },
    }
  }),
}))

describe('BalancesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key'
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@example.com' } } })
    mockBalanceOrder.mockResolvedValue({ data: [], error: null })
    mockPaymentLte.mockResolvedValue({ data: [], error: null })
  })

  it('redirects when Supabase is not configured', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    await expect(BalancesPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT:/login')
  })

  it('redirects unauthenticated users', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(BalancesPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT:/login')
  })

  it('uses a valid selected date and starts both data queries', async () => {
    const page = await BalancesPage({ searchParams: Promise.resolve({ date: '2020-01-02' }) })
    const suspense = page.props.children[1].props.children

    expect(suspense.props.fallback.props.selectedDate).toBe('2020-01-02')
    expect(suspense.props.children.props.selectedDate).toBe('2020-01-02')
    expect(mockBalanceOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(mockPaymentLte).toHaveBeenCalled()

    const records = await suspense.props.children.type(suspense.props.children.props)
    expect(records.type.name).toBe('BalanceRecords')
    expect(records.props.balances).toEqual([])
    expect(records.props.payments).toEqual([])
    expect(records.props.hasError).toBe(false)
    expect(records.props.hasPaymentError).toBe(false)
  })

  it('passes independent balance and payment query errors to the records component', async () => {
    mockBalanceOrder.mockResolvedValue({ data: null, error: { message: 'balance read failed' } })
    mockPaymentLte.mockResolvedValue({ data: null, error: { message: 'payment read failed' } })
    const page = await BalancesPage({ searchParams: Promise.resolve({}) })
    const suspense = page.props.children[1].props.children

    const records = await suspense.props.children.type(suspense.props.children.props)
    expect(records.props.hasError).toBe(true)
    expect(records.props.hasPaymentError).toBe(true)
  })

  it('ignores malformed dates', async () => {
    const page = await BalancesPage({ searchParams: Promise.resolve({ date: 'tomorrow' }) })
    const selectedDate = page.props.children[1].props.children.props.fallback.props.selectedDate

    expect(selectedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(selectedDate).not.toBe('tomorrow')
  })
})
