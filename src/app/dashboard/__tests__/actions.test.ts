import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkTodayBalance, getTransactionsForDate } from '@/app/dashboard/actions'

const mockRedirect = vi.fn()
const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()

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
    from: () => ({
      select: mockSelect,
    }),
  })),
}))

describe('Dashboard Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-anon-key'

    mockSelect.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockReturnValue({
      order: mockOrder,
    })
  })

  describe('checkTodayBalance', () => {
    it('returns error when supabase environment variables are missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL

      const result = await checkTodayBalance()
      expect(result).toEqual({ hasBalance: false, hasError: true })
    })

    it('redirects to /login if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      await expect(checkTodayBalance()).rejects.toThrow('NEXT_REDIRECT:/login')
      expect(mockRedirect).toHaveBeenCalledWith('/login')
    })

    it('returns hasBalance: true when count > 0 without error', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      mockEq.mockResolvedValue({ count: 1, error: null })

      const result = await checkTodayBalance()
      expect(result).toEqual({ hasBalance: true, hasError: false })
    })

    it('returns hasError: true when database query errors', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      mockEq.mockResolvedValue({ count: null, error: { message: 'db error' } })

      const result = await checkTodayBalance()
      expect(result).toEqual({ hasBalance: false, hasError: true })
    })
  })

  describe('getTransactionsForDate', () => {
    it('returns error for invalid date formats without querying', async () => {
      const result = await getTransactionsForDate('2026-1-1')
      expect(result).toEqual({ transactions: [], hasError: true })
      expect(mockGetUser).not.toHaveBeenCalled()
    })

    it('rejects future dates without querying', async () => {
      const result = await getTransactionsForDate('2999-01-01')
      expect(result).toEqual({ transactions: [], hasError: true })
      expect(mockGetUser).not.toHaveBeenCalled()
    })

    it('returns an error when Supabase is not configured', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

      const result = await getTransactionsForDate('2026-10-31')
      expect(result).toEqual({ transactions: [], hasError: true })
      expect(mockGetUser).not.toHaveBeenCalled()
    })

    it('redirects to /login if user is unauthenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      await expect(getTransactionsForDate('2026-10-31')).rejects.toThrow('NEXT_REDIRECT:/login')
      expect(mockRedirect).toHaveBeenCalledWith('/login')
    })

    it('fetches and returns transactions ordered by time', async () => {
      const mockTx = [
        { id: 1, type: 'GCash Cash-in', amount: 500, time: '12:00:00' },
      ]
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      mockOrder.mockResolvedValue({ data: mockTx, error: null })

      const result = await getTransactionsForDate('2026-10-31')
      expect(result).toEqual({ transactions: mockTx, hasError: false })
    })

    it('returns empty transactions and an error when the query fails', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      mockOrder.mockResolvedValue({ data: null, error: { message: 'database error' } })

      expect(await getTransactionsForDate('2026-10-31')).toEqual({ transactions: [], hasError: true })
    })
  })
})
