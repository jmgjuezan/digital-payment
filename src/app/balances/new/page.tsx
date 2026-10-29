import type { Metadata } from 'next'
import { LogOut, WalletCards } from 'lucide-react'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SetBalanceFormWrapper from '@/components/balances/SetBalanceFormWrapper'

export const metadata: Metadata = {
  title: 'Add balance | Digital Payment',
}

export default async function NewBalancePage() {
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

      <section className='new-transaction-content' aria-labelledby='add-balance-title'>
        <div className='new-transaction-heading'>
          <span className='new-transaction-icon'><WalletCards size={19} aria-hidden='true' /></span>
          <div>
            <p className='dashboard-eyebrow'>Account records</p>
            <h1 id='add-balance-title'>Add balance</h1>
            <p>Record a GCash or Maya balance for a device today.</p>
          </div>
        </div>
        <SetBalanceFormWrapper />
      </section>
    </main>
  )
}