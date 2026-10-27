import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ReceiptText } from 'lucide-react'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BalanceRequiredDialog from '@/components/transactions/BalanceRequiredDialog'
import NewTransactionForm from '@/components/transactions/NewTransactionForm'

export const metadata: Metadata = {
  title: 'Add transaction | Digital Payment',
}

function getTodayInPaymentTimeZone() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${values.year}-${values.month}-${values.day}`
}

export default async function NewTransactionPage() {
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

  const { count, error } = await supabase
    .from('balances')
    .select('id', { count: 'exact', head: true })
    .eq('date', getTodayInPaymentTimeZone())

  const requiresBalance = Boolean(error) || !count

  return (
    <main className='dashboard-shell'>
      <header className='dashboard-header'>
        <a className='dashboard-brand' href='/dashboard' aria-label='Digital Payment dashboard'>
          <span className='dashboard-brand-mark' aria-hidden='true'>↗</span>
          <span>Digital Payment</span>
        </a>
        <Link className='transaction-back-link' href='/dashboard'>
          <ArrowLeft size={16} aria-hidden='true' />
          <span>Back to dashboard</span>
        </Link>
      </header>

      <section className='new-transaction-content' aria-labelledby='new-transaction-title'>
        <div className='new-transaction-heading'>
          <span className='new-transaction-icon'><ReceiptText size={19} aria-hidden='true' /></span>
          <div>
            <p className='dashboard-eyebrow'>Payment records</p>
            <h1 id='new-transaction-title'>Add transaction</h1>
            <p>Enter the details for this payment.</p>
          </div>
        </div>
        {requiresBalance ? (
          <BalanceRequiredDialog open hasError={Boolean(error)} onClose={() => redirect('/dashboard')} />
        ) : <NewTransactionForm />}
      </section>
    </main>
  )
}