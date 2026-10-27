import type { Metadata } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardTransactions, { type Payment } from '@/components/dashboard/DashboardTransactions'

const timeZone = 'Asia/Manila'

export const metadata: Metadata = {
  title: 'Dashboard | Digital Payment',
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

  if (!supabaseUrl || !supabasePublishableKey) redirect('/login')

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
  const selectedDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
    ? requestedDate
    : today
  const { data, error } = await supabase
    .from('payments')
    .select('id, created_at, type, tran_id, payment_date:date, date:time, charge, amount, device, note')
    .eq('date', selectedDate)
    .order('time', { ascending: false })

  return (
    <DashboardTransactions
      transactions={(data ?? []) as Payment[]}
      hasError={Boolean(error)}
      timeZone={timeZone}
      selectedDate={selectedDate}
      userEmail={user.email ?? ''}
    />
  )
}