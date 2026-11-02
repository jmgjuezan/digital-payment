import type { SupabaseClient } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'moderator' | 'user'

type PaymentCreator = {
  created_by?: string | null
}

export async function getUserRoleDetails(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role, email')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data || (data.role !== 'admin' && data.role !== 'moderator' && data.role !== 'user')) return null

  return {
    role: data.role as UserRole,
    email: typeof data.email === 'string' && data.email.trim() ? data.email.trim() : null,
  }
}

export async function getUserRole(supabase: SupabaseClient, userId: string): Promise<UserRole | null> {
  const userRole = await getUserRoleDetails(supabase, userId)
  return userRole?.role ?? null
}

export async function hasBalanceManagementAccess(supabase: SupabaseClient, userId: string) {
  const role = await getUserRole(supabase, userId)
  return role === 'admin' || role === 'moderator'
}

export async function hasTransactionCreationAccess(supabase: SupabaseClient, userId: string) {
  const role = await getUserRole(supabase, userId)
  return role === 'admin' || role === 'user'
}

export async function resolvePaymentCreatorEmails<T extends PaymentCreator>(supabase: SupabaseClient, payments: T[]): Promise<T[]> {
  const creatorIds = [...new Set(payments
    .map((payment) => payment.created_by)
    .filter((creator): creator is string => Boolean(creator && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(creator))))]

  if (creatorIds.length === 0) return payments

  const { data, error } = await supabase
    .from('user_roles')
    .select('user_id, email')
    .in('user_id', creatorIds)

  if (error || !data) return payments

  const emailByUserId = new Map(
    (data as unknown as { user_id: string; email: string | null }[])
      .filter((role) => Boolean(role.email?.trim()))
      .map((role) => [role.user_id, role.email!.trim()]),
  )

  return payments.map((payment) => ({
    ...payment,
    created_by: payment.created_by ? emailByUserId.get(payment.created_by) ?? payment.created_by : payment.created_by,
  }))
}