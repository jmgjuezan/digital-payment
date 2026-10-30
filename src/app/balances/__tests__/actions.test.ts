import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBalancesForDate } from '@/app/balances/actions'

const mockRedirect = vi.fn()
const mockGetUser = vi.fn()
const mockBalancesSelect = vi.fn()
const mockPaymentsSelect = vi.fn()

vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    mockRedirect(path)
    throw new Error(`NEXT_REDIRECT:${path}`)
  },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: (table: string) => {
      if (table === 'balances') {
        return {
          select: mockBalancesSelect,
        }
      }
      return {
        select: mockPaymentsSelect,
      }
    },
  })),
}))

function getTodayInManila() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

describe('getBalancesForDate action', () => {
  const today = getTodayInManila()

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-anon-key'
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
  })

  it('rejects invalid date formats', async () => {
    const result = await getBalancesForDate('invalid-date')
    expect(result).toEqual({
      balances: [],
      payments: [],
      hasError: true,
      hasPaymentError: true,
    })
  })

  it('rejects future dates', async () => {
    const result = await getBalancesForDate('2099-01-01')
    expect(result).toEqual({
      balances: [],
      payments: [],
      hasError: true,
      hasPaymentError: true,
    })
  })

  it('returns errors when Supabase is not configured', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    expect(await getBalancesForDate(today)).toEqual({
      balances: [],
      payments: [],
      hasError: true,
      hasPaymentError: true,
    })
  })

  it('redirects to /login if user is unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(getBalancesForDate(today)).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('fetches and returns balances and payments correctly', async () => {
    const mockBalances = [
      { id: 1, type: 'GCash', device: 'CP1', date: today, amount: 10000 },
    ]
    const mockPayments = [
      { type: 'GCash Cash-in', device: 'CP1', amount: 500, date: today },
    ]

    mockBalancesSelect.mockReturnValue({
      eq: () => ({
        order: () => Promise.resolve({ data: mockBalances, error: null }),
      }),
    })
    mockPaymentsSelect.mockReturnValue({
      gte: () => ({
        lte: () => Promise.resolve({ data: mockPayments, error: null }),
      }),
    })

    const result = await getBalancesForDate(today)
    expect(result).toEqual({
      balances: mockBalances,
      payments: mockPayments,
      hasError: false,
      hasPaymentError: false,
    })
  })

  it('returns independent error states and empty results when queries fail', async () => {
    mockBalancesSelect.mockReturnValue({
      eq: () => ({ order: () => Promise.resolve({ data: null, error: { message: 'balance read failed' } }) }),
    })
    mockPaymentsSelect.mockReturnValue({
      gte: () => ({ lte: () => Promise.resolve({ data: null, error: { message: 'payment read failed' } }) }),
    })

    expect(await getBalancesForDate(today)).toEqual({
      balances: [],
      payments: [],
      hasError: true,
      hasPaymentError: true,
    })
  })
})
