'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type SaveBalanceState = {
  error?: string
  success?: boolean
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

export async function saveBalance(_previousState: SaveBalanceState, formData: FormData): Promise<SaveBalanceState> {
  const type = String(formData.get('type') ?? '').trim()
  const device = String(formData.get('device') ?? '').trim()
  const date = String(formData.get('date') ?? '').trim()
  const amount = Number(formData.get('amount'))
  const validDevices = Array.from({ length: 8 }, (_, index) => `CP${index + 1}`)

  if (!['gcash', 'maya'].includes(type.toLowerCase())) return { error: 'Balance type must be GCash or Maya.' }
  if (!validDevices.includes(device)) return { error: 'Select a valid device.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Enter a valid balance date.' }
  if (date !== getTodayInPaymentTimeZone()) return { error: 'Balance date must be today.' }
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

  const { error } = await supabase.from('balances').insert({ type, device, date, amount })
  if (error) return { error: 'Could not save the balance. Check your access and try again.' }

  redirect('/balances')
}