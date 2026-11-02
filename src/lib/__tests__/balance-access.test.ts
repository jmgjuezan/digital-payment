import { describe, expect, it, vi } from 'vitest'
import { getUserRole, getUserRoleDetails, hasBalanceManagementAccess, hasTransactionCreationAccess, resolvePaymentCreatorEmails } from '@/lib/balance-access'

function makeSupabaseRoleLookup(result: { data: { role: string; email?: string } | null; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result)
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })

  return { client: { from } as never, from, select, eq, maybeSingle }
}

describe('hasBalanceManagementAccess', () => {
  it.each(['admin', 'moderator'])('allows the %s role', async (role) => {
    const lookup = makeSupabaseRoleLookup({ data: { role }, error: null })

    await expect(hasBalanceManagementAccess(lookup.client, 'user-1')).resolves.toBe(true)
    expect(lookup.from).toHaveBeenCalledWith('user_roles')
    expect(lookup.select).toHaveBeenCalledWith('role, email')
    expect(lookup.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('denies the user role', async () => {
    const lookup = makeSupabaseRoleLookup({ data: { role: 'user' }, error: null })

    await expect(hasBalanceManagementAccess(lookup.client, 'user-1')).resolves.toBe(false)
  })

  it('denies missing roles and role lookup errors', async () => {
    const missingRole = makeSupabaseRoleLookup({ data: null, error: null })
    const failedLookup = makeSupabaseRoleLookup({ data: null, error: new Error('query failed') })

    await expect(hasBalanceManagementAccess(missingRole.client, 'user-1')).resolves.toBe(false)
    await expect(hasBalanceManagementAccess(failedLookup.client, 'user-1')).resolves.toBe(false)
  })

  it.each(['admin', 'user'])('allows the %s role to create transactions', async (role) => {
    const lookup = makeSupabaseRoleLookup({ data: { role }, error: null })

    await expect(hasTransactionCreationAccess(lookup.client, 'user-1')).resolves.toBe(true)
  })

  it('denies transaction creation to moderators and when role lookup fails', async () => {
    const moderator = makeSupabaseRoleLookup({ data: { role: 'moderator' }, error: null })
    const failedLookup = makeSupabaseRoleLookup({ data: null, error: new Error('query failed') })

    await expect(hasTransactionCreationAccess(moderator.client, 'user-1')).resolves.toBe(false)
    await expect(getUserRole(failedLookup.client, 'user-1')).resolves.toBeNull()
  })

  it('returns the role email from user_roles', async () => {
    const lookup = makeSupabaseRoleLookup({ data: { role: 'user', email: 'person@example.com' }, error: null })

    await expect(getUserRoleDetails(lookup.client, 'user-1')).resolves.toEqual({
      role: 'user',
      email: 'person@example.com',
    })
  })

  it('does not return an empty role email', async () => {
    const lookup = makeSupabaseRoleLookup({ data: { role: 'user', email: '  ' }, error: null })

    await expect(getUserRoleDetails(lookup.client, 'user-1')).resolves.toEqual({ role: 'user', email: null })
  })

  it('resolves legacy payment creator UUIDs to user role emails', async () => {
    const userRolesQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          { user_id: 'a1b2c3d4-e5f6-4789-a012-3456789abcde', email: 'creator@example.com' },
        ],
        error: null,
      }),
    }
    const supabase = { from: vi.fn().mockReturnValue(userRolesQuery) } as never
    const payments = [
      { created_by: 'a1b2c3d4-e5f6-4789-a012-3456789abcde' },
      { created_by: 'already@example.com' },
      { created_by: 'not-mapped-uuid' },
    ]

    await expect(resolvePaymentCreatorEmails(supabase, payments)).resolves.toEqual([
      { created_by: 'creator@example.com' },
      { created_by: 'already@example.com' },
      { created_by: 'not-mapped-uuid' },
    ])
    expect(userRolesQuery.in).toHaveBeenCalledWith('user_id', ['a1b2c3d4-e5f6-4789-a012-3456789abcde'])
  })
})