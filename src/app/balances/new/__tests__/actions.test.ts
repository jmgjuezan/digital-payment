import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveBalance } from '@/app/balances/new/actions'

const mockRedirect = vi.fn()
const mockGetUser = vi.fn()
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
    from: () => ({
      insert: mockInsert,
    }),
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

describe('saveBalance action', () => {
  const today = getTodayInManila()

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-anon-key'
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockInsert.mockResolvedValue({ error: null })
  })

  it('rejects unsupported balance types', async () => {
    const formData = new FormData()
    formData.set('type', 'BPI')
    formData.set('device', 'CP1')
    formData.set('date', today)
    formData.set('amount', '5000')

    const result = await saveBalance({}, formData)
    expect(result).toEqual({ error: 'Balance type must be GCash or Maya.' })
  })

  it('rejects invalid device names', async () => {
    const formData = new FormData()
    formData.set('type', 'GCash')
    formData.set('device', 'CP99')
    formData.set('date', today)
    formData.set('amount', '5000')

    const result = await saveBalance({}, formData)
    expect(result).toEqual({ error: 'Select a valid device.' })
  })

  it('rejects non-today dates', async () => {
    const formData = new FormData()
    formData.set('type', 'GCash')
    formData.set('device', 'CP1')
    formData.set('date', '2020-01-01')
    formData.set('amount', '5000')

    const result = await saveBalance({}, formData)
    expect(result).toEqual({ error: 'Balance date must be today.' })
  })

  it('rejects malformed dates and non-numeric amounts', async () => {
    const malformedDate = new FormData()
    malformedDate.set('type', 'GCash')
    malformedDate.set('device', 'CP1')
    malformedDate.set('date', 'today')
    malformedDate.set('amount', '5000')
    expect(await saveBalance({}, malformedDate)).toEqual({ error: 'Enter a valid balance date.' })

    const invalidAmount = new FormData()
    invalidAmount.set('type', 'Maya')
    invalidAmount.set('device', 'CP8')
    invalidAmount.set('date', today)
    invalidAmount.set('amount', 'not-a-number')
    expect(await saveBalance({}, invalidAmount)).toEqual({ error: 'Balance must be zero or greater.' })
  })

  it('rejects negative amounts', async () => {
    const formData = new FormData()
    formData.set('type', 'GCash')
    formData.set('device', 'CP1')
    formData.set('date', today)
    formData.set('amount', '-500')

    const result = await saveBalance({}, formData)
    expect(result).toEqual({ error: 'Balance must be zero or greater.' })
  })

  it('saves valid balance and redirects to /balances', async () => {
    const formData = new FormData()
    formData.set('type', 'GCash')
    formData.set('device', 'CP1')
    formData.set('date', today)
    formData.set('amount', '15000')

    await expect(saveBalance({}, formData)).rejects.toThrow('NEXT_REDIRECT:/balances')
    expect(mockInsert).toHaveBeenCalledWith({
      type: 'GCash',
      device: 'CP1',
      date: today,
      amount: 15000,
    })
    expect(mockRedirect).toHaveBeenCalledWith('/balances')
  })

  it('returns a configuration error when Supabase credentials are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const formData = new FormData()
    formData.set('type', 'GCash')
    formData.set('device', 'CP1')
    formData.set('date', today)
    formData.set('amount', '0')

    expect(await saveBalance({}, formData)).toEqual({ error: 'Supabase is not configured.' })
  })

  it('redirects unauthenticated users to login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const formData = new FormData()
    formData.set('type', 'GCash')
    formData.set('device', 'CP1')
    formData.set('date', today)
    formData.set('amount', '5000')

    await expect(saveBalance({}, formData)).rejects.toThrow('NEXT_REDIRECT:/login')
  })

  it('returns a database error when the insert fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'permission denied' } })
    const formData = new FormData()
    formData.set('type', 'GCash')
    formData.set('device', 'CP1')
    formData.set('date', today)
    formData.set('amount', '5000')

    expect(await saveBalance({}, formData)).toEqual({ error: 'Could not save the balance. Check your access and try again.' })
  })
})
