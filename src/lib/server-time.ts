import type { SupabaseClient } from '@supabase/supabase-js'

const paymentTimeZone = 'Asia/Manila'

export async function getServerTime(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc('get_server_time')
  const serverTime = typeof data === 'string' ? new Date(data) : new Date(String(data ?? ''))

  if (error || Number.isNaN(serverTime.getTime())) {
    throw new Error('Could not read server time from Supabase.')
  }

  return serverTime
}

export function getTodayInPaymentTimeZone(serverTime: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: paymentTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(serverTime)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${values.year}-${values.month}-${values.day}`
}

export function getTimeInPaymentTimeZone(serverTime: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: paymentTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(serverTime)
}

export function getYesterdayInPaymentTimeZone(serverTime: Date) {
  const yesterday = new Date(`${getTodayInPaymentTimeZone(serverTime)}T00:00:00Z`)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  return yesterday.toISOString().slice(0, 10)
}
