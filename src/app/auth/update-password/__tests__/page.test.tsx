import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import UpdatePasswordPage from '@/app/auth/update-password/page'

const mockRedirect = vi.fn()
const mockGetUser = vi.fn()

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
  createServerClient: vi.fn((...args: unknown[]) => {
    const config = args[2] as {
      cookies: {
        getAll: () => unknown
        setAll: (items: { name: string; value: string; options: Record<string, unknown> }[]) => void
      }
    }
    config.cookies.getAll()
    config.cookies.setAll([{ name: 'test', value: '1', options: {} }])
    return {
      auth: {
        getUser: mockGetUser,
      },
    }
  }),
}))

vi.mock('@/components/auth/UpdatePasswordForm', () => ({
  default: () => <div data-testid='update-password-form' />,
}))

describe('UpdatePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'anon-key'
  })

  it('redirects to /login when Supabase is not configured', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    await expect(UpdatePasswordPage()).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('redirects with error parameter when recovery user session is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(UpdatePasswordPage()).rejects.toThrow('NEXT_REDIRECT:/login?error=recovery-link-invalid')
    expect(mockRedirect).toHaveBeenCalledWith('/login?error=recovery-link-invalid')
  })

  it('renders the update password form when authenticated with recovery session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-rec' } } })

    render(await UpdatePasswordPage())

    expect(screen.getByRole('heading', { name: 'Choose a new password.' })).toBeInTheDocument()
    expect(screen.getByTestId('update-password-form')).toBeInTheDocument()
  })
})
