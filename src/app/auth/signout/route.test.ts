import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const mockSignOut = vi.fn()
const mockCreateServerClient = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}))

const { POST } = await import('@/app/auth/signout/route')

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost'), { method: 'POST' })
}

describe('POST /auth/signout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'anon-key'

    mockCreateServerClient.mockImplementation((_url, _key, options) => {
      options.cookies.getAll()
      options.cookies.setAll([{ name: 'sb-test', value: 'test', options: {} }])
      return { auth: { signOut: mockSignOut } }
    })
    mockSignOut.mockResolvedValue({})
  })

  it('calls supabase.auth.signOut() and redirects to /login with 303', async () => {
    const request = makeRequest('http://localhost/auth/signout')
    const response = await POST(request)

    expect(mockSignOut).toHaveBeenCalledOnce()
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toContain('/login')
  })

  it('redirects to /login without calling signOut when env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const request = makeRequest('http://localhost/auth/signout')
    const response = await POST(request)

    expect(mockSignOut).not.toHaveBeenCalled()
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toContain('/login')
  })

  it('always redirects to /login even when signOut resolves', async () => {
    mockSignOut.mockResolvedValue({ error: null })

    const response = await POST(makeRequest('http://localhost/auth/signout'))

    expect(response).toBeInstanceOf(NextResponse)
    expect(response.headers.get('location')).toContain('/login')
  })
})
