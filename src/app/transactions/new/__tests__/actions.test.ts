import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPayment } from '@/app/transactions/new/actions'

const mockRedirect = vi.fn()
const mockGetUser = vi.fn()
const mockEq = vi.fn()
const mockInsert = vi.fn()

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
          select: () => ({
            eq: mockEq,
          }),
        }
      }
      return {
        insert: mockInsert,
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

function getValidPaymentForm(overrides: Record<string, string> = {}) {
  const formData = new FormData()
  const fields = {
    payment_date: todayForForm(),
    date: '14:30:00',
    amount: '500',
    charge: '5',
    type: 'GCash Cash-in',
    device: 'CP1',
    tran_id: '1234',
    note: '',
    ...overrides,
  }
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value))
  return formData
}

function todayForForm() {
  return getTodayInManila()
}

describe('createPayment action', () => {
  const today = getTodayInManila()

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-anon-key'
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockEq.mockResolvedValue({ count: 1, error: null })
    mockInsert.mockResolvedValue({ error: null })
  })

  it('rejects invalid payment dates', async () => {
    const formData = new FormData()
    formData.set('payment_date', 'not-a-date')

    const result = await createPayment({}, formData)
    expect(result).toEqual({ error: 'Enter a valid payment date.' })
  })

  it('rejects dates that are not yesterday or today', async () => {
    const formData = new FormData()
    formData.set('payment_date', '2020-01-01')

    const result = await createPayment({}, formData)
    expect(result).toEqual({ error: 'Payment date must be yesterday or today.' })
  })

  it('rejects missing payment time', async () => {
    const formData = new FormData()
    formData.set('payment_date', today)
    formData.set('date', '')

    const result = await createPayment({}, formData)
    expect(result).toEqual({ error: 'Enter the payment time.' })
  })

  it('rejects non-positive amounts', async () => {
    const formData = new FormData()
    formData.set('payment_date', today)
    formData.set('date', '14:30:00')
    formData.set('amount', '0')

    const result = await createPayment({}, formData)
    expect(result).toEqual({ error: 'Amount must be greater than zero.' })
  })

  it('requires a transaction ID for non-load payment types', async () => {
    const formData = new FormData()
    formData.set('payment_date', today)
    formData.set('date', '14:30:00')
    formData.set('amount', '500')
    formData.set('type', 'GCash Cash-in')
    formData.set('tran_id', '')

    const result = await createPayment({}, formData)
    expect(result).toEqual({ error: 'Transaction ID is required for this payment type.' })
  })

  it('allows load payment types without a transaction ID', async () => {
    const formData = new FormData()
    formData.set('payment_date', today)
    formData.set('date', '14:30:00')
    formData.set('amount', '500')
    formData.set('charge', '5')
    formData.set('type', 'GCash Load')
    formData.set('device', 'CP1')
    formData.set('tran_id', '')

    await expect(createPayment({}, formData)).rejects.toThrow('NEXT_REDIRECT:/dashboard')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'GCash Load',
        tran_id: null,
      })
    )
  })

  it('rejects transaction IDs longer than 4 characters', async () => {
    const formData = new FormData()
    formData.set('payment_date', today)
    formData.set('date', '14:30:00')
    formData.set('amount', '500')
    formData.set('charge', '5')
    formData.set('type', 'GCash Cash-in')
    formData.set('device', 'CP1')
    formData.set('tran_id', '12345')

    const result = await createPayment({}, formData)
    expect(result).toEqual({ error: 'Transaction ID must be 4 characters or fewer.' })
  })

  it('requires setting today’s balance first if balance count is 0', async () => {
    mockEq.mockResolvedValue({ count: 0, error: null })

    const formData = new FormData()
    formData.set('payment_date', today)
    formData.set('date', '14:30:00')
    formData.set('amount', '500')
    formData.set('charge', '5')
    formData.set('type', 'GCash Cash-in')
    formData.set('device', 'CP1')
    formData.set('tran_id', '1234')

    const result = await createPayment({}, formData)
    expect(result).toEqual({ error: 'Set today’s balance before adding a transaction.' })
  })

  it('rejects unsupported payment types and invalid charges', async () => {
    expect(await createPayment({}, getValidPaymentForm({ type: 'Unknown payment' }))).toEqual({
      error: 'Enter a payment type, device, and valid non-negative amount and charge.',
    })
    expect(await createPayment({}, getValidPaymentForm({ charge: '-1' }))).toEqual({
      error: 'Enter a payment type, device, and valid non-negative amount and charge.',
    })
  })

  it('returns an error when the balance lookup fails', async () => {
    mockEq.mockResolvedValue({ count: null, error: { message: 'database unavailable' } })

    expect(await createPayment({}, getValidPaymentForm())).toEqual({
      error: 'Set today’s balance before adding a transaction.',
    })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('returns an error when the payment insert fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'permission denied' } })

    expect(await createPayment({}, getValidPaymentForm())).toEqual({
      error: 'Could not save the transaction. Check your access and try again.',
    })
  })

  it('reports missing Supabase configuration for otherwise valid input', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    expect(await createPayment({}, getValidPaymentForm())).toEqual({ error: 'Supabase is not configured.' })
  })

  it('redirects unauthenticated users to login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(createPayment({}, getValidPaymentForm())).rejects.toThrow('NEXT_REDIRECT:/login')
  })

  it('accepts yesterday as a payment date', async () => {
    const yesterday = new Date(`${today}T00:00:00Z`)
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const paymentDate = yesterday.toISOString().slice(0, 10)

    await expect(createPayment({}, getValidPaymentForm({ payment_date: paymentDate }))).rejects.toThrow('NEXT_REDIRECT:/dashboard')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ date: paymentDate }))
  })

  it('saves the transaction and redirects to /dashboard on success', async () => {
    const formData = new FormData()
    formData.set('payment_date', today)
    formData.set('date', '14:30:00')
    formData.set('amount', '500')
    formData.set('charge', '5')
    formData.set('type', 'GCash Cash-in')
    formData.set('device', 'CP1')
    formData.set('tran_id', '9999')
    formData.set('note', 'Customer payment')

    await expect(createPayment({}, formData)).rejects.toThrow('NEXT_REDIRECT:/dashboard')
    expect(mockInsert).toHaveBeenCalledWith({
      type: 'GCash Cash-in',
      tran_id: '9999',
      date: today,
      time: '14:30:00',
      charge: 5,
      amount: 500,
      device: 'CP1',
      note: 'Customer payment',
    })
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })
})
