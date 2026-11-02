import type { Metadata } from 'next'
import { LogOut, ReceiptText } from 'lucide-react'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import EditTransactionForm from '@/components/dashboard/EditTransactionForm'
import type { Payment } from '@/components/dashboard/DashboardTransactions'
import { hasBalanceManagementAccess } from '@/lib/balance-access'

export const metadata: Metadata = {
  title: 'Edit transaction | Digital Payment',
}

export default async function EditTransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { id } = await params
  const paymentId = Number(id)
  const { date: requestedDate } = await searchParams
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())
  const returnDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) && requestedDate <= today
    ? requestedDate
    : undefined
  if (!Number.isSafeInteger(paymentId) || paymentId <= 0) redirect('/dashboard')

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
  if (!await hasBalanceManagementAccess(supabase, user.id)) redirect('/dashboard')

  const { data, error } = await supabase
    .from('payments')
    .select('id, created_at, created_by, type, tran_id, date, time, charge, amount, device, note')
    .eq('id', paymentId)
    .maybeSingle()

  if (error || !data) redirect('/dashboard')

  const payment = data as unknown as Payment

  return (
    <main className='dashboard-shell has-action-footer'>
      <header className='dashboard-header'>
        <a className='dashboard-brand' href={returnDate ? `/dashboard?date=${encodeURIComponent(returnDate)}` : '/dashboard'} aria-label='Digital Payment dashboard'>
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
      <section className='new-transaction-content' aria-labelledby='edit-transaction-title'>
        <div className='new-transaction-heading'>
          <span className='new-transaction-icon'><ReceiptText size={19} aria-hidden='true' /></span>
          <div>
            <p className='dashboard-eyebrow'>Transaction records</p>
            <h1 id='edit-transaction-title'>Edit transaction</h1>
            <p>{payment.tran_id ? `Transaction ${payment.tran_id}` : `Transaction ${payment.id}`}</p>
          </div>
        </div>
        <EditTransactionForm payment={payment} returnDate={returnDate} />
      </section>
      <nav className='app-action-footer' aria-label='Form actions'>
        <div className='app-action-footer-inner'>
          <a className='set-balance-button' href={returnDate ? `/dashboard?date=${encodeURIComponent(returnDate)}` : '/dashboard'}>Cancel</a>
          <button className='add-transaction-button' type='submit' form='edit-transaction-form'>Save changes</button>
        </div>
      </nav>
    </main>
  )
}
