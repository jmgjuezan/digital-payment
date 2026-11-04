'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { paymentTypeOptions } from '@/lib/payment-options'
import { getUserRoleDetails } from '@/lib/balance-access'

export type CreatePaymentState = {
  error?: string
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

function getYesterdayInPaymentTimeZone() {
  const yesterday = new Date(`${getTodayInPaymentTimeZone()}T00:00:00Z`)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  return yesterday.toISOString().slice(0, 10)
}

function getCurrentTimeInPaymentTimeZone() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())
}

export async function createPayment(_previousState: CreatePaymentState, formData: FormData): Promise<CreatePaymentState> {
  const type = String(formData.get('type') ?? '').trim()
  const tranId = String(formData.get('tran_id') ?? '').trim()
  const paymentDate = String(formData.get('date') ?? '').trim()
  const paymentTime = String(formData.get('time') ?? '').trim()
  const device = String(formData.get('device') ?? '').trim()
  const note = String(formData.get('note') ?? '').trim()
  const amount = Number(formData.get('amount'))
  const charge = Number(formData.get('charge'))
  const validDevices = [...Array.from({ length: 8 }, (_, index) => `CP${index + 1}`), 'ME']
  const parsedPaymentDate = new Date(`${paymentDate}T00:00:00Z`)
  const validPaymentDate = /^\d{4}-\d{2}-\d{2}$/.test(paymentDate)
    && !Number.isNaN(parsedPaymentDate.getTime())
    && parsedPaymentDate.toISOString().slice(0, 10) === paymentDate
  const validPaymentTime = /^\d{2}:\d{2}(?::\d{2})?$/.test(paymentTime)

  if (!validPaymentDate) return { error: 'Enter a valid payment date.' }
  if (paymentDate < getYesterdayInPaymentTimeZone() || paymentDate > getTodayInPaymentTimeZone()) {
    return { error: 'Payment date must be yesterday or today.' }
  }
  if (!paymentTime) return { error: 'Enter the payment time.' }
  if (!validPaymentTime) return { error: 'Enter a valid payment time.' }
  if (paymentDate === getTodayInPaymentTimeZone() && paymentTime.slice(0, 5) > getCurrentTimeInPaymentTimeZone()) {
    return { error: 'Payment time cannot be later than the current time.' }
  }
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Amount must be greater than zero.' }

  if (type && !type.endsWith('Load') && !tranId) return { error: 'Transaction ID is required for this payment type.' }

  if (!paymentTypeOptions.includes(type as (typeof paymentTypeOptions)[number]) || !validDevices.includes(device) || !Number.isFinite(amount) || !Number.isFinite(charge) || amount < 0 || charge < 0) {
    return { error: 'Enter a payment type, device, and valid non-negative amount and charge.' }
  }

  if (tranId.length > 4) return { error: 'Transaction ID must be 4 characters or fewer.' }

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
  const userRole = await getUserRoleDetails(supabase, user.id)
  if (userRole?.role !== 'admin' && userRole?.role !== 'user') {
    return { error: 'You do not have permission to add transactions.' }
  }

  const { count: balanceCount, error: balanceError } = await supabase
    .from('balances')
    .select('id', { count: 'exact', head: true })
    .eq('date', getTodayInPaymentTimeZone())

  if (balanceError || !balanceCount) {
    return { error: 'Set today’s balance before adding a transaction.' }
  }

  const { error } = await supabase.from('payments').insert({
    type,
    tran_id: tranId || null,
    date: paymentDate,
    time: paymentTime,
    charge,
    amount,
    device,
    note: note || null,
  })

  if (error?.code === '23505') return { error: 'Duplicate transaction.' }
  if (error) {
    console.error('Failed to create payment', { code: error.code, message: error.message })

    if (error.code === '42501') return { error: 'You do not have permission to save this transaction. Check your account role and try again.' }
    if (['22P02', '42804', '42703', 'PGRST204'].includes(error.code ?? '')) {
      return { error: 'The payment database schema is out of date. Apply the latest Supabase migrations, then try again.' }
    }

    return { error: 'Could not save the transaction. Check your access and try again.' }
  }

  redirect('/dashboard')
}
