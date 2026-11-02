import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NewBalancePage from '@/app/balances/new/page'

const { mockGetUser, mockRoleQuery } = vi.hoisted(() => ({ mockGetUser: vi.fn(), mockRoleQuery: vi.fn() }))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn(), set: vi.fn() }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((...args: unknown[]) => {
    const config = args[2] as { cookies: { getAll: () => unknown; setAll: (items: { name: string; value: string; options: Record<string, unknown> }[]) => void } }
    config.cookies.getAll()
    config.cookies.setAll([{ name: 'sb-test', value: 'test', options: {} }])
    return {
      auth: { getUser: mockGetUser },
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mockRoleQuery }) }) }),
    }
  }),
}))

vi.mock('@/components/balances/SetBalanceFormWrapper', () => ({
  default: () => null,
}))

describe('NewBalancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key'
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@example.com' } } })
    mockRoleQuery.mockResolvedValue({ data: { role: 'moderator' }, error: null })
  })

  it('redirects to login when Supabase is not configured', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    await expect(NewBalancePage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT:/login')
  })

  it('redirects unauthenticated users to login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(NewBalancePage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT:/login')
  })

  it('redirects users without admin or moderator role to the transaction dashboard', async () => {
    mockRoleQuery.mockResolvedValue({ data: { role: 'user' }, error: null })

    await expect(NewBalancePage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT:/dashboard')
  })

  it('renders the balance form page for an authenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@example.com' } } })

    render(await NewBalancePage({ searchParams: Promise.resolve({ date: '2026-10-31' }) }))

    expect(screen.getByRole('heading', { name: 'Add balance' })).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })
})
