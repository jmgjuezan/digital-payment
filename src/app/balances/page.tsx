import type { Metadata } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LogOut, WalletCards } from 'lucide-react'
import BalanceRecords, { type Balance } from '@/components/balances/BalanceRecords'
import AppActionFooter from '@/components/layout/AppActionFooter'

const timeZone = 'Asia/Manila'

export const metadata: Metadata = {
  title: 'Balances | Digital Payment',
}

function getTodayInPaymentTimeZone() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${values.year}-${values.month}-${values.day}`
}

export default async function BalancesPage({
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
  const today = getTodayInPaymentTimeZone()
  const selectedDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : today
  const { data, error } = await supabase
    .from('balances')
    .select('id, created_at, type, device, date, amount')
    .eq('date', selectedDate)
    .order('created_at', { ascending: false })

  const { data: paymentData, error: paymentError } = await supabase
    .from('payments')
    .select('type, device, amount, date')
    .gte('date', selectedDate)
    .lte('date', today)

  return (
    <main className='dashboard-shell has-action-footer'>
      <header className='dashboard-header'>
        <a className='dashboard-brand' href='/dashboard' aria-label='Digital Payment dashboard'>
          <span className='dashboard-brand-mark' aria-hidden='true'>↗</span>
          <span>Digital Payment</span>
        </a>
        <div className='dashboard-header-actions'>
          {user.email && <span className='dashboard-user-email' title={user.email}>{user.email}</span>}
          <form action='/auth/signout' method='post'>
            <button className='dashboard-logout' type='submit'>
              <LogOut size={15} aria-hidden='true' />
              <span>Log out</span>
            </button>
          </form>
        </div>
      </header>

      <section className='dashboard-content' aria-labelledby='balances-title'>
        <div className='dashboard-heading-row'>
          <div>
            <p className='dashboard-eyebrow'>Account records</p>
            <h1 id='balances-title'>Balances</h1>
            <p className='dashboard-date'><WalletCards size={16} aria-hidden='true' />Balances recorded for {selectedDate}</p>
          </div>
          <div className='dashboard-count' aria-live='polite'>
            <span>{data?.length ?? 0}</span>
            <small>{data?.length === 1 ? 'balance' : 'balances'}</small>
          </div>
        </div>
        <BalanceRecords
          balances={(data ?? []) as Balance[]}
          payments={paymentData ?? []}
          hasError={Boolean(error)}
          hasPaymentError={Boolean(paymentError)}
          selectedDate={selectedDate}
        />
      </section>
      <AppActionFooter current='balances' />
    </main>
  )
}