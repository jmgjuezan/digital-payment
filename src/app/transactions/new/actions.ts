'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { paymentTypeOptions } from '@/lib/payment-options'

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

export async function createPayment(_previousState: CreatePaymentState, formData: FormData): Promise<CreatePaymentState> {
  const type = String(formData.get('type') ?? '').trim()
  const tranId = String(formData.get('tran_id') ?? '').trim()
  const paymentDate = String(formData.get('payment_date') ?? '').trim()
  const paymentTime = String(formData.get('date') ?? '').trim()
  const device = String(formData.get('device') ?? '').trim()
  const note = String(formData.get('note') ?? '').trim()
  const amount = Number(formData.get('amount'))
  const charge = Number(formData.get('charge'))
  const validDevices = [...Array.from({ length: 8 }, (_, index) => `CP${index + 1}`), 'ME']

  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) return { error: 'Enter a valid payment date.' }
  if (paymentDate < getTodayInPaymentTimeZone()) return { error: 'Payment date cannot be in the past.' }
  if (!paymentTime) return { error: 'Enter the payment time.' }
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Amount must be greater than zero.' }

  if (type.endsWith('Cash-out') && !tranId) return { error: 'Transaction ID is required for cash-out payments.' }

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

  if (error) return { error: 'Could not save the transaction. Check your access and try again.' }

  redirect('/dashboard')
}