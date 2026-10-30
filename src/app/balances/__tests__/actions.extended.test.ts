import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBalancesForDate } from '@/app/balances/actions'

const mockRedirect = vi.fn()
const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()

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
    auth: { getUser: mockGetUser },
    from: () => ({ select: mockSelect }),
  })),
}))

describe('getBalancesForDate — extended coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'anon-key'

    // Default chain: .select().eq().order() for balances
    //                .select().gte().lte() for payments
    mockEq.mockReturnValue({ order: mockOrder })
    mockOrder.mockResolvedValue({ data: [], error: null })
    mockGte.mockReturnValue({ lte: mockLte })
    mockLte.mockResolvedValue({ data: [], error: null })

    // select returns different chain per call — use mockReturnValueOnce
    mockSelect
      .mockReturnValueOnce({ eq: mockEq })   // balances query
      .mockReturnValueOnce({ gte: mockGte }) // payments query
  })

  it('returns error result for invalid date format', async () => {
    const result = await getBalancesForDate('31-10-2026')
    expect(result).toEqual({ balances: [], payments: [], hasError: true, hasPaymentError: true })
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it('returns error result for future date', async () => {
    const result = await getBalancesForDate('2099-12-31')
    expect(result).toEqual({ balances: [], payments: [], hasError: true, hasPaymentError: true })
  })

  it('returns error when env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const result = await getBalancesForDate('2026-10-31')
    expect(result).toEqual({ balances: [], payments: [], hasError: true, hasPaymentError: true })
  })

  it('redirects to /login when user is unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(getBalancesForDate('2026-10-31')).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('returns balances and payments on success', async () => {
    const mockBalances = [{ id: 1, type: 'GCash', amount: 5000 }]
    const mockPayments = [{ type: 'GCash Cash-in', amount: 200 }]

    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockOrder.mockResolvedValue({ data: mockBalances, error: null })
    mockLte.mockResolvedValue({ data: mockPayments, error: null })

    const result = await getBalancesForDate('2026-10-31')
    expect(result.balances).toEqual(mockBalances)
    expect(result.payments).toEqual(mockPayments)
    expect(result.hasError).toBe(false)
    expect(result.hasPaymentError).toBe(false)
  })

  it('returns hasError when balances query fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockOrder.mockResolvedValue({ data: null, error: { message: 'db error' } })
    mockLte.mockResolvedValue({ data: [], error: null })

    const result = await getBalancesForDate('2026-10-31')
    expect(result.hasError).toBe(true)
    expect(result.balances).toEqual([])
  })

  it('returns hasPaymentError when payments query fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockOrder.mockResolvedValue({ data: [], error: null })
    mockLte.mockResolvedValue({ data: null, error: { message: 'payment error' } })

    const result = await getBalancesForDate('2026-10-31')
    expect(result.hasPaymentError).toBe(true)
    expect(result.payments).toEqual([])
  })
})
