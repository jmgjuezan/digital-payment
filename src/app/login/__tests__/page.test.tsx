import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoginPage from '@/app/login/page'

const { mockGetUser } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn(), set: vi.fn() }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((...args: unknown[]) => {
    const config = args[2] as { cookies: { getAll: () => unknown; setAll: (items: { name: string; value: string; options: Record<string, unknown> }[]) => void } }
    config.cookies.getAll()
    config.cookies.setAll([{ name: 'sb-test', value: 'test', options: {} }])
    return { auth: { getUser: mockGetUser } }
  }),
}))

vi.mock('@/components/auth/AuthForm', () => ({
  default: () => <div data-testid='auth-form' />,
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key'
  })

  it('renders login when Supabase is not configured', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    render(await LoginPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole('heading', { name: 'Sign in to Digital Payment' })).toBeInTheDocument()
    expect(screen.getByTestId('auth-form')).toBeInTheDocument()
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it('renders login for an unauthenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    render(await LoginPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole('heading', { name: 'Sign in to Digital Payment' })).toBeInTheDocument()
    expect(mockGetUser).toHaveBeenCalledOnce()
  })

  it('redirects authenticated users to the dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    await expect(LoginPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT:/dashboard')
  })

  it('shows confirmation after password recovery', async () => {
    render(await LoginPage({ searchParams: Promise.resolve({ 'password-updated': 'true' }) }))

    expect(screen.getByRole('status')).toHaveTextContent('Password updated. Sign in with your new password.')
  })

  it('shows an error for an invalid recovery link', async () => {
    render(await LoginPage({ searchParams: Promise.resolve({ error: 'recovery-link-invalid' }) }))

    expect(screen.getByRole('alert')).toHaveTextContent('This password reset link is invalid or expired.')
  })
})
