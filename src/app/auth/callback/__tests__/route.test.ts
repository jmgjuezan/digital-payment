import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockExchangeCodeForSession } = vi.hoisted(() => ({ mockExchangeCodeForSession: vi.fn() }))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn(), set: vi.fn() }),
}))
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { exchangeCodeForSession: mockExchangeCodeForSession },
  })),
}))

import { GET } from '@/app/auth/callback/route'

describe('auth recovery callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key'
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
  })

  it('exchanges the recovery code and redirects to the update-password page', async () => {
    const request = new NextRequest('https://app.example/auth/callback?code=one-time-code')

    const response = await GET(request)

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('one-time-code')
    expect(response.headers.get('location')).toBe('https://app.example/auth/update-password')
  })

  it('rejects missing and invalid recovery codes', async () => {
    const missingCodeResponse = await GET(new NextRequest('https://app.example/auth/callback'))
    expect(missingCodeResponse.headers.get('location')).toBe('https://app.example/login?error=recovery-link-invalid')

    mockExchangeCodeForSession.mockResolvedValue({ error: new Error('invalid code') })
    const invalidCodeResponse = await GET(new NextRequest('https://app.example/auth/callback?code=invalid'))
    expect(invalidCodeResponse.headers.get('location')).toBe('https://app.example/login?error=recovery-link-invalid')
  })
})
