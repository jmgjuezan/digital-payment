import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardTransactions, { type Payment } from '@/components/dashboard/DashboardTransactions'
import DashboardTransactionsSkeleton from '@/components/dashboard/DashboardTransactionsSkeleton'
import { getUserRole, resolvePaymentCreatorEmails } from '@/lib/balance-access'
import { getServerTime, getTodayInPaymentTimeZone } from '@/lib/server-time'

const timeZone = 'Asia/Manila'

export const metadata: Metadata = {
  title: 'Dashboard | Digital Payment',
}

type DashboardData = {
  transactions: Payment[]
  hasError: boolean
}

async function DashboardTransactionsData({
  dataPromise,
  selectedDate,
  userEmail,
  canManageBalances,
  canAddTransactions,
  today,
}: {
  dataPromise: Promise<DashboardData>
  selectedDate: string
  userEmail: string
  canManageBalances: boolean
  canAddTransactions: boolean
  today: string
}) {
  const { transactions, hasError } = await dataPromise

  return (
    <DashboardTransactions
      transactions={transactions}
      hasError={hasError}
      timeZone={timeZone}
      selectedDate={selectedDate}
      userEmail={userEmail}
      canManageBalances={canManageBalances}
      canAddTransactions={canAddTransactions}
      today={today}
    />
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabasePublishableKey) {
    return (
      <DashboardTransactions
        transactions={[]}
        hasError
        timeZone={timeZone}
        selectedDate=''
        userEmail=''
        today=''
      />
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Middleware refreshes cookies when server components cannot write them.
        }
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const today = getTodayInPaymentTimeZone(await getServerTime(supabase))
  const role = await getUserRole(supabase, user.id)
  const canManageBalances = role === 'admin' || role === 'moderator'
  const canAddTransactions = role === 'admin' || role === 'user'
  const transactionFields = canManageBalances
    ? 'id, created_at, created_by, type, tran_id, date, time, charge, amount, device, note'
    : 'id, created_at, type, tran_id, date, time, charge, amount, device, note'

  const { date: requestedDate } = await searchParams
  const selectedDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) && requestedDate <= today
    ? requestedDate
    : today
  const dataPromise: Promise<DashboardData> = Promise.resolve(
    supabase
      .from('payments')
      .select(transactionFields)
      .eq('date', selectedDate)
      .order('time', { ascending: false })
      .then(async ({ data, error }) => ({
        transactions: await resolvePaymentCreatorEmails(supabase, (data ?? []) as unknown as Payment[]),
        hasError: Boolean(error),
      }))
  )

  return (
    <Suspense fallback={<DashboardTransactionsSkeleton />}>
      <DashboardTransactionsData
        dataPromise={dataPromise}
        selectedDate={selectedDate}
        userEmail={user.email ?? ''}
        canManageBalances={canManageBalances}
        canAddTransactions={canAddTransactions}
        today={today}
      />
    </Suspense>
  )
}
