'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserRole, hasBalanceManagementAccess, resolvePaymentCreatorEmails } from '@/lib/balance-access'
import { paymentTypeOptions } from '@/lib/payment-options'

export type UpdatePaymentState = {
  error?: string
  success?: boolean
  redirectTo?: string
}

type DashboardTransaction = {
  id: number
  created_at: string
  created_by?: string | null
  type: string
  tran_id: string | null
  date: string
  time: string | null
  charge: number
  amount: number
  device: string
  note: string | null
}

export type TodayBalanceCheck = {
  hasBalance: boolean
  hasError: boolean
}

export async function updatePayment(paymentId: number, formData: FormData, returnDate?: string): Promise<UpdatePaymentState> {
  const type = String(formData.get('type') ?? '').trim()
  const transactionId = String(formData.get('tran_id') ?? '').trim()
  const paymentDate = String(formData.get('date') ?? '').trim()
  const paymentTime = String(formData.get('time') ?? '').trim()
  const device = String(formData.get('device') ?? '').trim()
  const amount = Number(formData.get('amount'))
  const charge = Number(formData.get('charge'))
  const note = String(formData.get('note') ?? '').trim()
  const validDevices = [...Array.from({ length: 8 }, (_, index) => `CP${index + 1}`), 'ME']
  const today = getTodayInPaymentTimeZone()
  const parsedPaymentDate = new Date(`${paymentDate}T00:00:00Z`)
  const validPaymentDate = /^\d{4}-\d{2}-\d{2}$/.test(paymentDate)
    && !Number.isNaN(parsedPaymentDate.getTime())
    && parsedPaymentDate.toISOString().slice(0, 10) === paymentDate
    && paymentDate <= today

  if (!Number.isSafeInteger(paymentId) || paymentId <= 0) return { error: 'Invalid transaction.' }
  if (!paymentTypeOptions.includes(type as (typeof paymentTypeOptions)[number])
    || !validDevices.includes(device)
    || !validPaymentDate
    || !/^\d{2}:\d{2}$/.test(paymentTime)
    || !Number.isFinite(amount)
    || amount <= 0
    || !Number.isFinite(charge)
    || charge < 0
    || transactionId.length > 4
    || (type && !type.endsWith('Load') && !transactionId)) {
    return { error: 'Enter valid transaction details.' }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabasePublishableKey) return { error: 'Supabase is not configured.' }

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
  if (!await hasBalanceManagementAccess(supabase, user.id)) {
    return { error: 'You do not have permission to edit transactions.' }
  }

  const { error } = await supabase
    .from('payments')
    .update({
      type,
      tran_id: transactionId || null,
      date: paymentDate,
      time: paymentTime,
      device,
      amount,
      charge,
      note: note || null,
    })
    .eq('id', paymentId)

  if (error?.code === '23505') return { error: 'Duplicate transaction.' }
  if (error) return { error: 'Could not update the transaction.' }
  return {
    success: true,
    redirectTo: returnDate && /^\d{4}-\d{2}-\d{2}$/.test(returnDate) && returnDate <= today
      ? `/dashboard?date=${encodeURIComponent(returnDate)}`
      : '/dashboard',
  }
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

export async function checkTodayBalance(): Promise<TodayBalanceCheck> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabasePublishableKey) return { hasBalance: false, hasError: true }

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

  return { hasBalance: !error && Boolean(count), hasError: Boolean(error) }
}

export async function getTransactionsForDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > getTodayInPaymentTimeZone()) {
    return { transactions: [], hasError: true }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabasePublishableKey) return { transactions: [], hasError: true }

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
  const role = await getUserRole(supabase, user.id)
  const includeCreator = role === 'admin' || role === 'moderator'
  const transactionFields = includeCreator
    ? 'id, created_at, created_by, type, tran_id, date, time, charge, amount, device, note'
    : 'id, created_at, type, tran_id, date, time, charge, amount, device, note'

  const { data, error } = await supabase
    .from('payments')
    .select(transactionFields)
    .eq('date', date)
    .order('time', { ascending: false })

  return {
    transactions: await resolvePaymentCreatorEmails(supabase, (data ?? []) as unknown as DashboardTransaction[]),
    hasError: Boolean(error),
  }
}
