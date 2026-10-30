import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPayment } from '@/app/transactions/new/actions'

const mockRedirect = vi.fn()
const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockInsert = vi.fn()
const mockFrom = vi.fn()

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
    from: mockFrom,
  })),
}))

function makeFormData(overrides: Record<string, string | number> = {}) {
  const defaults = {
    type: 'GCash Cash-in',
    tran_id: 'AB12',
    payment_date: '2026-10-31',
    date: '10:00',
    device: 'CP1',
    note: '',
    amount: '500',
    charge: '5',
  }
  const fd = new FormData()
  const merged = { ...defaults, ...overrides }
  for (const [key, val] of Object.entries(merged)) {
    fd.set(key, String(val))
  }
  return fd
}

describe('createPayment — extended coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'anon-key'

    // Default balance check: 1 record (has balance)
    mockEq.mockResolvedValue({ count: 1, error: null })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockInsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert })
  })

  it('returns error for badly-formatted payment_date', async () => {
    const result = await createPayment({}, makeFormData({ payment_date: '10/31/2026' }))
    expect(result).toEqual({ error: 'Enter a valid payment date.' })
  })

  it('returns error for payment_date outside allowed range', async () => {
    const result = await createPayment({}, makeFormData({ payment_date: '2020-01-01' }))
    expect(result).toEqual({ error: 'Payment date must be yesterday or today.' })
  })

  it('returns error when payment time is blank', async () => {
    const result = await createPayment({}, makeFormData({ date: '' }))
    expect(result).toEqual({ error: 'Enter the payment time.' })
  })

  it('returns error when amount is zero or negative', async () => {
    const result = await createPayment({}, makeFormData({ amount: '0' }))
    expect(result).toEqual({ error: 'Amount must be greater than zero.' })
  })

  it('returns error when tran_id missing for non-Load type', async () => {
    const result = await createPayment({}, makeFormData({ tran_id: '' }))
    expect(result).toEqual({ error: 'Transaction ID is required for this payment type.' })
  })

  it('returns validation error for invalid type or device', async () => {
    const result = await createPayment({}, makeFormData({ type: 'VISA', device: 'TABLET' }))
    expect(result).toEqual({
      error: 'Enter a payment type, device, and valid non-negative amount and charge.',
    })
  })

  it('returns error when tran_id exceeds 4 characters', async () => {
    const result = await createPayment({}, makeFormData({ tran_id: 'TOOLONG' }))
    expect(result).toEqual({ error: 'Transaction ID must be 4 characters or fewer.' })
  })

  it('returns error when Supabase env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const result = await createPayment({}, makeFormData())
    expect(result).toEqual({ error: 'Supabase is not configured.' })
  })

  it('redirects to /login when user is unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(createPayment({}, makeFormData())).rejects.toThrow('NEXT_REDIRECT:/login')
  })

  it('returns error when no balance exists for today', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockEq.mockResolvedValue({ count: 0, error: null })

    const result = await createPayment({}, makeFormData())
    expect(result.error).toMatch(/set today.s balance/i)
  })

  it('returns error when balance check query fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockEq.mockResolvedValue({ count: null, error: { message: 'db error' } })

    const result = await createPayment({}, makeFormData())
    expect(result.error).toMatch(/set today.s balance/i)
  })

  it('returns error when insert fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockInsert.mockResolvedValue({ error: { message: 'insert failed' } })

    const result = await createPayment({}, makeFormData())
    expect(result).toEqual({ error: 'Could not save the transaction. Check your access and try again.' })
  })

  it('redirects to /dashboard after successful insert', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockInsert.mockResolvedValue({ error: null })

    await expect(createPayment({}, makeFormData())).rejects.toThrow('NEXT_REDIRECT:/dashboard')
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })

  it('accepts GCash Load without tran_id', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    // Load type doesn't require tran_id
    await expect(
      createPayment({}, makeFormData({ type: 'GCash Load', tran_id: '' }))
    ).rejects.toThrow('NEXT_REDIRECT:/dashboard')
  })
})
