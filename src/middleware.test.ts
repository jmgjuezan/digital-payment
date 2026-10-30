import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const mockGetUser = vi.fn()
const mockCreateServerClient = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}))

// Import after mocks are set up
const { middleware } = await import('@/middleware')

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost'))
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'anon-key'

    mockCreateServerClient.mockImplementation((_url, _key, options) => {
      options.cookies.getAll()
      options.cookies.setAll([{ name: 'sb-test', value: 'test', options: {} }])
      return { auth: { getUser: mockGetUser } }
    })
  })

  it('redirects to /login when SUPABASE env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const request = makeRequest('http://localhost/dashboard')
    const response = await middleware(request)

    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login')
  })

  it('redirects to /login when SUPABASE_PUBLISHABLE_KEY is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    const request = makeRequest('http://localhost/dashboard')
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login')
  })

  it('redirects to /login when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const request = makeRequest('http://localhost/dashboard')
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login')
  })

  it('passes through when user is authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const request = makeRequest('http://localhost/dashboard')
    const response = await middleware(request)

    // A next response (not a redirect) has no Location header
    expect(response.headers.get('location')).toBeNull()
  })

  it('calls createServerClient with the env-var credentials', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    await middleware(makeRequest('http://localhost/dashboard'))

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key',
      expect.objectContaining({ cookies: expect.any(Object) }),
    )
  })
})
