import { beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from '@/app/dashboard/page'

const { mockGetUser, mockRoleQuery, mockSelect, mockOrder } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockRoleQuery: vi.fn(),
  mockSelect: vi.fn(),
  mockOrder: vi.fn(),
}))

vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: vi.fn(), set: vi.fn() }) }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((...args: unknown[]) => {
    const config = args[2] as { cookies: { getAll: () => unknown; setAll: (items: { name: string; value: string; options: Record<string, unknown> }[]) => void } }
    config.cookies.getAll()
    config.cookies.setAll([{ name: 'sb-test', value: 'test', options: {} }])

    return {
      auth: { getUser: mockGetUser },
      from: (table: string) => table === 'user_roles'
        ? { select: () => ({ eq: () => ({ maybeSingle: mockRoleQuery }) }) }
        : { select: mockSelect },
    }
  }),
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key'
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@example.com' } } })
    mockRoleQuery.mockResolvedValue({ data: { role: 'admin' }, error: null })
    mockSelect.mockReturnValue({ eq: () => ({ order: mockOrder }) })
    mockOrder.mockResolvedValue({ data: [], error: null })
  })

  it('renders an error dashboard when Supabase is not configured', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const page = await DashboardPage({ searchParams: Promise.resolve({}) })

    expect(page.type.name).toBe('DashboardTransactions')
    expect(page.props.hasError).toBe(true)
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it('redirects unauthenticated users to login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(DashboardPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT:/login')
  })

  it('uses a valid past date and fetches its transactions', async () => {
    const page = await DashboardPage({ searchParams: Promise.resolve({ date: '2020-01-02' }) })
    const transactionData = page.props.children

    expect(transactionData.props.selectedDate).toBe('2020-01-02')
    expect(transactionData.props.userEmail).toBe('test@example.com')
    expect(transactionData.props.canManageBalances).toBe(true)
    expect(transactionData.props.canAddTransactions).toBe(true)
    expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('created_by'))
    expect(mockOrder).toHaveBeenCalledWith('time', { ascending: false })

    const dashboard = await transactionData.type(transactionData.props)
    expect(dashboard.type.name).toBe('DashboardTransactions')
    expect(dashboard.props.transactions).toEqual([])
    expect(dashboard.props.hasError).toBe(false)
  })

  it('does not grant balance access to the user role', async () => {
    mockRoleQuery.mockResolvedValue({ data: { role: 'user' }, error: null })
    const page = await DashboardPage({ searchParams: Promise.resolve({}) })

    expect(page.props.children.props.canManageBalances).toBe(false)
    expect(page.props.children.props.canAddTransactions).toBe(true)
    expect(mockSelect).toHaveBeenCalledWith(expect.not.stringContaining('created_by'))
  })

  it('does not grant transaction creation to moderators', async () => {
    mockRoleQuery.mockResolvedValue({ data: { role: 'moderator' }, error: null })
    const page = await DashboardPage({ searchParams: Promise.resolve({}) })

    expect(page.props.children.props.canManageBalances).toBe(true)
    expect(page.props.children.props.canAddTransactions).toBe(false)
    expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('created_by'))
  })

  it('passes failed query results to the dashboard component', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'read failed' } })
    const page = await DashboardPage({ searchParams: Promise.resolve({}) })
    const transactionData = page.props.children

    const dashboard = await transactionData.type(transactionData.props)
    expect(dashboard.props.transactions).toEqual([])
    expect(dashboard.props.hasError).toBe(true)
  })

  it('falls back to today for malformed or future dates', async () => {
    const page = await DashboardPage({ searchParams: Promise.resolve({ date: '9999-99-99' }) })
    const selectedDate = page.props.children.props.selectedDate

    expect(selectedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(selectedDate).not.toBe('9999-99-99')
  })
})
