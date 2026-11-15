import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updatePayment } from '@/app/dashboard/actions'

const mockGetUser = vi.fn()
const mockRoleQuery = vi.fn()
const mockPaymentSelect = vi.fn()
const mockPaymentEq = vi.fn()
const mockPaymentSingle = vi.fn()
const mockUpdate = vi.fn()
const mockUpdateEq = vi.fn()
const mockRedirect = vi.fn()

vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    mockRedirect(path)
    throw new Error(`NEXT_REDIRECT:${path}`)
  },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: vi.fn(), set: vi.fn() }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    rpc: vi.fn().mockResolvedValue({ data: '2026-11-14T00:00:00.000Z', error: null }),
    from: (table: string) => {
      if (table === 'user_roles') {
        return { select: () => ({ eq: () => ({ maybeSingle: mockRoleQuery }) }) }
      }
      if (table === 'payments') {
        return {
          select: mockPaymentSelect,
          update: mockUpdate,
        }
      }
      return {}
    },
  })),
}))

function getValidPaymentForm(overrides: Record<string, string> = {}) {
  const formData = new FormData()
  const fields = {
    type: 'GCash Cash-in',
    tran_id: '1234',
    date: '2026-11-14',
    time: '14:30',
    device: 'CP1',
    amount: '500',
    charge: '5',
    note: 'Edited note',
    ...overrides,
  }
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value))
  return formData
}

describe('updatePayment action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key'
    mockGetUser.mockResolvedValue({ data: { user: { id: 'editor-1' } } })
    mockRoleQuery.mockResolvedValue({ data: { role: 'admin' }, error: null })
    mockPaymentSelect.mockReturnValue({ eq: mockPaymentEq })
    mockPaymentEq.mockReturnValue({ single: mockPaymentSingle })
    mockPaymentSingle.mockResolvedValue({ data: { created_by: 'editor-1' }, error: null })
    mockUpdate.mockReturnValue({ eq: mockUpdateEq })
    mockUpdateEq.mockResolvedValue({ error: null })
  })

  it.each(['admin', 'moderator'])('updates a transaction for the %s role when they own it', async (role) => {
    mockRoleQuery.mockResolvedValue({ data: { role }, error: null })
    mockPaymentSingle.mockResolvedValue({ data: { created_by: 'editor-1' }, error: null })

    await expect(updatePayment(42, getValidPaymentForm(), '2026-11-01')).resolves.toEqual({
      success: true,
      redirectTo: '/dashboard?date=2026-11-01',
    })
    expect(mockUpdate).toHaveBeenCalledWith({
      type: 'GCash Cash-in',
      tran_id: '1234',
      date: getValidPaymentForm().get('date'),
      time: '14:30',
      device: 'CP1',
      amount: 500,
      charge: 5,
      note: 'Edited note',
    })
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 42)
  })

  it('allows admin to edit any transaction regardless of creator', async () => {
    mockRoleQuery.mockResolvedValue({ data: { role: 'admin' }, error: null })
    mockPaymentSingle.mockResolvedValue({ data: { created_by: 'other-user' }, error: null })

    await expect(updatePayment(42, getValidPaymentForm())).resolves.toEqual({
      success: true,
      redirectTo: '/dashboard',
    })
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('rejects users without edit permission without updating', async () => {
    mockRoleQuery.mockResolvedValue({ data: { role: 'user' }, error: null })

    await expect(updatePayment(42, getValidPaymentForm())).resolves.toEqual({
      error: 'You do not have permission to edit transactions.',
    })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('redirects unauthenticated callers to login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(updatePayment(42, getValidPaymentForm())).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('rejects invalid payment data', async () => {
    await expect(updatePayment(42, getValidPaymentForm({ amount: '-1' }))).resolves.toEqual({
      error: 'Enter valid transaction details.',
    })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns error when payment is not found', async () => {
    mockPaymentSingle.mockResolvedValue({ data: null, error: null })

    await expect(updatePayment(42, getValidPaymentForm())).resolves.toEqual({
      error: 'Transaction not found.',
    })
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
