import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCurrentServerTime } from '@/app/actions/server-time'
import { getServerTime } from '@/lib/server-time'

const mockGetUser = vi.fn()
const mockSetCookie = vi.fn()
const mockGetAllCookies = vi.fn(() => [])

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => mockGetAllCookies(),
    set: (...args: unknown[]) => mockSetCookie(...args),
  }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((...args: unknown[]) => {
    const config = args[2] as {
      cookies: {
        getAll: () => unknown
        setAll: (items: { name: string; value: string; options: Record<string, unknown> }[]) => void
      }
    }
    config.cookies.getAll()
    config.cookies.setAll([{ name: 'test-cookie', value: '1', options: {} }])
    return {
      auth: {
        getUser: mockGetUser,
      },
    }
  }),
}))

vi.mock('@/lib/server-time', () => ({
  getServerTime: vi.fn(),
}))

describe('getCurrentServerTime server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'anon-key'
  })

  it('returns null when Supabase environment variables are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const result = await getCurrentServerTime()
    expect(result).toBeNull()
  })

  it('returns null when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const result = await getCurrentServerTime()
    expect(result).toBeNull()
  })

  it('returns server time in ISO string when user is authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const mockDate = new Date('2026-11-14T12:00:00.000Z')
    vi.mocked(getServerTime).mockResolvedValue(mockDate)

    const result = await getCurrentServerTime()
    expect(result).toBe('2026-11-14T12:00:00.000Z')
  })

  it('returns null when getServerTime fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    vi.mocked(getServerTime).mockRejectedValue(new Error('RPC failed'))

    const result = await getCurrentServerTime()
    expect(result).toBeNull()
  })
})
