import { createClient } from '@supabase/supabase-js'

function getTodayInManila() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${values.year}-${values.month}-${values.day}`
}

export default async function globalSetup() {
  const url = process.env.E2E_SUPABASE_URL
  const key = process.env.E2E_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('The local Supabase API is not configured for UI automation.')
  if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname)) {
    throw new Error('UI automation setup is restricted to local Supabase.')
  }

  const email = `ui-test-${crypto.randomUUID()}@example.com`
  const password = `Local-${crypto.randomUUID()}!`
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  })

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(`Could not create the local UI test user: ${error.message}`)
  if (!data.session) throw new Error('Local Supabase did not create an authenticated UI test session.')

  const today = getTodayInManila()
  const { error: balanceError } = await supabase.from('balances').insert({
    type: 'GCash',
    device: 'CP1',
    date: today,
    amount: 5000,
  })
  if (balanceError) throw new Error(`Could not seed the local UI balance: ${balanceError.message}`)

  const { error: paymentError } = await supabase.from('payments').insert([
    {
      type: 'GCash Cash-in',
      tran_id: 'UI01',
      date: today,
      time: '10:00:00',
      amount: 1000,
      charge: 10,
      device: 'CP1',
      note: 'UI automation seed cash-in',
    },
    {
      type: 'Maya Cash-out',
      tran_id: 'UI02',
      date: today,
      time: '11:00:00',
      amount: 400,
      charge: 5,
      device: 'CP2',
      note: 'UI automation seed cash-out',
    },
  ])
  if (paymentError) throw new Error(`Could not seed local UI transactions: ${paymentError.message}`)

  process.env.E2E_TEST_EMAIL = email
  process.env.E2E_TEST_PASSWORD = password
}
