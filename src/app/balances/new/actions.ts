'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { hasBalanceManagementAccess } from '@/lib/balance-access'
import { getServerTime, getTodayInPaymentTimeZone } from '@/lib/server-time'

export type SaveBalanceState = {
  error?: string
  success?: boolean
}

export async function saveBalance(_previousState: SaveBalanceState, formData: FormData): Promise<SaveBalanceState> {
  const type = String(formData.get('type') ?? '').trim()
  const device = String(formData.get('device') ?? '').trim()
  const date = String(formData.get('date') ?? '').trim()
  const returnDate = String(formData.get('return_date') ?? '').trim()
  const amount = Number(formData.get('amount'))
  const validDevices = Array.from({ length: 8 }, (_, index) => `CP${index + 1}`)

  if (!['gcash', 'maya'].includes(type.toLowerCase())) return { error: 'Balance type must be GCash or Maya.' }
  if (!validDevices.includes(device)) return { error: 'Select a valid device.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Enter a valid balance date.' }
  if (!Number.isFinite(amount) || amount < 0) return { error: 'Balance must be zero or greater.' }

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
    return { error: 'You do not have permission to manage balances.' }
  }
  let today: string
  try {
    today = getTodayInPaymentTimeZone(await getServerTime(supabase))
  } catch {
    return { error: 'Could not verify the current time. Please try again.' }
  }
  if (date !== today) return { error: 'Balance date must be today.' }

  const { error } = await supabase.from('balances').insert({ type, device, date, amount })
  if (error?.code === '23505') return { error: 'Duplicate transaction.' }
  if (error) return { error: 'Could not save the balance. Check your access and try again.' }

  const validReturnDate = /^\d{4}-\d{2}-\d{2}$/.test(returnDate)
    && returnDate <= today
  redirect(validReturnDate ? `/balances?date=${encodeURIComponent(returnDate)}` : '/balances')
}
