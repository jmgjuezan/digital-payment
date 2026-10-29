'use client'

import { useEffect, useActionState } from 'react'
import { saveBalance, type SaveBalanceState } from '@/app/balances/new/actions'

const initialState: SaveBalanceState = {}

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

export default function SetBalanceForm({
  onActionChange,
}: {
  onActionChange: (action: () => void, pending: boolean) => void
}) {
  const [state, action, pending] = useActionState(saveBalance, initialState)
  const today = getTodayInPaymentTimeZone()

  useEffect(() => {
    onActionChange(action, pending)
  }, [action, pending, onActionChange])

  return (
    <form className='new-transaction-form' id='balance-form' action={action}>
      <div className='form-field'>
        <label htmlFor='balance-type'>Balance type <span aria-hidden='true'>*</span></label>
        <input
          id='balance-type'
          name='type'
          list='balance-type-options'
          required
          pattern='[Gg][Cc]ash|[Mm]aya'
          title='Enter GCash or Maya.'
          placeholder='GCash or Maya'
        />
        <datalist id='balance-type-options'>
          <option value='GCash' />
          <option value='Maya' />
        </datalist>
      </div>
      <div className='form-field'>
        <label htmlFor='balance-device'>Device <span aria-hidden='true'>*</span></label>
        <select id='balance-device' name='device' required defaultValue=''>
          <option value='' disabled>Select device</option>
          {Array.from({ length: 8 }, (_, index) => `CP${index + 1}`).map((device) => (
            <option key={device} value={device}>{device}</option>
          ))}
        </select>
      </div>
      <div className='form-field'>
        <label htmlFor='balance-date-display'>Date</label>
        <input id='balance-date-display' type='text' value={today} readOnly aria-readonly='true' />
        <input type='hidden' name='date' value={today} />
      </div>
      <div className='form-field'>
        <label htmlFor='balance-amount'>Amount <span aria-hidden='true'>*</span></label>
        <div className='input-with-prefix'>
          <span aria-hidden='true'>₱</span>
          <input id='balance-amount' name='amount' type='number' min='0' step='0.01' required placeholder='0.00' />
        </div>
      </div>

      {state.error && <p className='transaction-form-error' role='alert'>{state.error}</p>}
    </form>
  )
}