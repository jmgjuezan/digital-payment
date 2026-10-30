import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardTransactions, { type Payment } from '@/components/dashboard/DashboardTransactions'
import DashboardTransactionsSkeleton from '@/components/dashboard/DashboardTransactionsSkeleton'

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
}: {
  dataPromise: Promise<DashboardData>
  selectedDate: string
  userEmail: string
}) {
  const { transactions, hasError } = await dataPromise

  return (
    <DashboardTransactions
      transactions={transactions}
      hasError={hasError}
      timeZone={timeZone}
      selectedDate={selectedDate}
      userEmail={userEmail}
    />
  )
}

function getTodayInTimeZone(zone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${values.year}-${values.month}-${values.day}`
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
        selectedDate={getTodayInTimeZone(timeZone)}
        userEmail=''
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

  const { date: requestedDate } = await searchParams
  const today = getTodayInTimeZone(timeZone)
  const selectedDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) && requestedDate <= today
    ? requestedDate
    : today
  const dataPromise: Promise<DashboardData> = Promise.resolve(
    supabase
      .from('payments')
      .select('id, created_at, type, tran_id, payment_date:date, date:time, charge, amount, device, note')
      .eq('date', selectedDate)
      .order('time', { ascending: false })
      .then(({ data, error }) => ({
        transactions: (data ?? []) as unknown as Payment[],
        hasError: Boolean(error),
      }))
  )

  return (
    <Suspense fallback={<DashboardTransactionsSkeleton />}>
      <DashboardTransactionsData
        dataPromise={dataPromise}
        selectedDate={selectedDate}
        userEmail={user.email ?? ''}
      />
    </Suspense>
  )
}
