import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | undefined

function getSupabaseClient() {
  if (!supabase) throw new Error('Supabase integration client has not been initialized.')
  return supabase
}

function getRequiredEnvironmentValue(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Run scripts/test-integration.ps1 to set ${name} from the local Docker stack.`)

  return value
}

function getLocalTestCredentials() {
  const url = getRequiredEnvironmentValue('INTEGRATION_SUPABASE_URL')
  const hostname = new URL(url).hostname
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    throw new Error('Docker integration tests only run against a local Supabase URL.')
  }

  return {
    email: process.env.INTEGRATION_TEST_EMAIL ?? `integration-${crypto.randomUUID()}@example.com`,
    password: process.env.INTEGRATION_TEST_PASSWORD ?? `Local-${crypto.randomUUID()}!`,
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

describe('Supabase integration', () => {
  beforeAll(async () => {
    const url = getRequiredEnvironmentValue('INTEGRATION_SUPABASE_URL')
    const publishableKey = getRequiredEnvironmentValue('INTEGRATION_SUPABASE_PUBLISHABLE_KEY')
    const { email, password } = getLocalTestCredentials()

    supabase = createClient(url, publishableKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(`Could not create the local Supabase integration user: ${error.message}`)
    expect(data.user).not.toBeNull()
    expect(data.session).not.toBeNull()
  })

  afterAll(async () => {
    if (supabase) await supabase.auth.signOut()
  })

  it('reads today’s balances through authenticated access and RLS', async () => {
    const { data, error } = await getSupabaseClient()
      .from('balances')
      .select('id, created_at, type, device, date, amount')
      .eq('date', getTodayInPaymentTimeZone())
      .limit(10)

    expect(error).toBeNull()
    expect(data).not.toBeNull()
  })

  it('reads today’s transactions through authenticated access and RLS', async () => {
    const { data, error } = await getSupabaseClient()
      .from('payments')
      .select('id, created_at, type, tran_id, payment_date:date, date:time, charge, amount, device, note')
      .eq('date', getTodayInPaymentTimeZone())
      .order('time', { ascending: false })
      .limit(10)

    expect(error).toBeNull()
    expect(data).not.toBeNull()
  })
})
