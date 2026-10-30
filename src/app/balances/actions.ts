'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

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

export async function getBalancesForDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > getTodayInPaymentTimeZone()) {
    return { balances: [], payments: [], hasError: true, hasPaymentError: true }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabasePublishableKey) {
    return { balances: [], payments: [], hasError: true, hasPaymentError: true }
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

  const today = getTodayInPaymentTimeZone()
  const [{ data: balances, error }, { data: payments, error: paymentError }] = await Promise.all([
    supabase
      .from('balances')
      .select('id, created_at, type, device, date, amount')
      .eq('date', date)
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select('type, device, amount, date')
      .gte('date', date)
      .lte('date', today),
  ])

  return {
    balances: balances ?? [],
    payments: payments ?? [],
    hasError: Boolean(error),
    hasPaymentError: Boolean(paymentError),
  }
}
