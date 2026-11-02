import { beforeEach, describe, expect, it, vi } from 'vitest'
import EditTransactionPage from '@/app/dashboard/transactions/[id]/edit/page'

const { mockGetUser, mockRoleQuery, mockPaymentQuery, mockEditForm } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockRoleQuery: vi.fn(),
  mockPaymentQuery: vi.fn(),
  mockEditForm: vi.fn(),
}))

vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: vi.fn(), set: vi.fn() }) }))
vi.mock('next/navigation', () => ({
  redirect: (path: string) => { throw new Error(`NEXT_REDIRECT:${path}`) },
}))
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((...args: unknown[]) => {
    const config = args[2] as { cookies: { getAll: () => unknown; setAll: (items: { name: string; value: string; options: Record<string, unknown> }[]) => void } }
    config.cookies.getAll()
    config.cookies.setAll([])

    return {
      auth: { getUser: mockGetUser },
      from: (table: string) => table === 'user_roles'
        ? { select: () => ({ eq: () => ({ maybeSingle: mockRoleQuery }) }) }
        : { select: () => ({ eq: () => ({ maybeSingle: mockPaymentQuery }) }) },
    }
  }),
}))

vi.mock('@/components/dashboard/EditTransactionForm', () => ({
  default: (props: { payment: { id: number; type: string; date: string; time: string } }) => {
    mockEditForm(props)
    return <div data-testid='edit-form' data-id={props.payment.id} data-type={props.payment.type} />
  },
}))

describe('EditTransactionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key'
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1', email: 'admin@example.com' } } })
    mockRoleQuery.mockResolvedValue({ data: { role: 'moderator', email: 'mod@example.com' }, error: null })
    mockPaymentQuery.mockResolvedValue({
      data: {
        id: 21,
        type: 'GCash Cash-in',
        tran_id: '1234',
        date: '2026-11-02',
        time: '10:30:00',
        charge: 5,
        amount: 500,
        device: 'CP1',
        note: null,
      },
      error: null,
    })
  })

  it('renders the edit form for moderators', async () => {
    const page = await EditTransactionPage({
      params: Promise.resolve({ id: '21' }),
      searchParams: Promise.resolve({ date: '2026-11-01' }),
    })
    const section = page.props.children[1]
    const editForm = section.props.children[1]

    expect(editForm.props.payment).toMatchObject({ id: 21, date: '2026-11-02', time: '10:30:00' })
    expect(editForm.props.returnDate).toBe('2026-11-01')
    expect(page.props.children[0].props.children[0].props.href).toBe('/dashboard?date=2026-11-01')
    expect(page.props.children[2].props.children.props.children[0].props.href).toBe('/dashboard?date=2026-11-01')
    expect(mockPaymentQuery).toHaveBeenCalled()
  })

  it('redirects users to the dashboard', async () => {
    mockRoleQuery.mockResolvedValue({ data: { role: 'user' }, error: null })

    await expect(EditTransactionPage({ params: Promise.resolve({ id: '21' }), searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT:/dashboard')
    expect(mockPaymentQuery).not.toHaveBeenCalled()
  })

  it('redirects invalid IDs to the dashboard', async () => {
    await expect(EditTransactionPage({ params: Promise.resolve({ id: 'abc' }), searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT:/dashboard')
    expect(mockPaymentQuery).not.toHaveBeenCalled()
  })
})
