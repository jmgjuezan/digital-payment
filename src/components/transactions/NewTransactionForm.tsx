'use client'

import { useActionState, useState } from 'react'
import { createPayment, type CreatePaymentState } from '@/app/transactions/new/actions'
import { calculatePaymentCharge } from '@/lib/payment-charge'
import { paymentTypeOptions } from '@/lib/payment-options'

const initialState: CreatePaymentState = {}
const paymentTimeZone = 'Asia/Manila'

function getTodayInPaymentTimeZone() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: paymentTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${values.year}-${values.month}-${values.day}`
}

export default function NewTransactionForm() {
  const [state, action, pending] = useActionState(createPayment, initialState)
  const [paymentType, setPaymentType] = useState('')
  const [paymentDate, setPaymentDate] = useState(getTodayInPaymentTimeZone)
  const [amount, setAmount] = useState('')
  const [charge, setCharge] = useState('')
  const transactionIdRequired = paymentType.endsWith('Cash-out')
  const today = getTodayInPaymentTimeZone()

  function preventNegativeAmount(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === '-' || event.key === 'Subtract') event.preventDefault()
  }

  function clampAmountToZero(event: React.ChangeEvent<HTMLInputElement>) {
    if (Number(event.currentTarget.value) < 0) event.currentTarget.value = '0'
  }

  return (
    <>
    <form id='new-transaction-form' className='new-transaction-form' action={action}>
      <div className='form-field'>
        <label htmlFor='type'>Payment type <span aria-hidden='true'>*</span></label>
        <select
          id='type'
          name='type'
          required
          value={paymentType}
          onChange={(event) => {
            const nextType = event.target.value
            setPaymentType(nextType)
            if (!nextType || nextType === 'GCash Load' || !amount) {
              setCharge('')
            } else {
              const calculatedCharge = calculatePaymentCharge(nextType, Number(amount))
              setCharge(calculatedCharge > 0 ? calculatedCharge.toFixed(2) : '')
            }
          }}
        >
          <option value='' disabled>Select payment type</option>
          {paymentTypeOptions.map((paymentType) => (
            <option key={paymentType} value={paymentType}>{paymentType}</option>
          ))}
        </select>
      </div>
      <div className='form-field'>
        <label htmlFor='device'>Device <span aria-hidden='true'>*</span></label>
        <select id='device' name='device' required defaultValue=''>
          <option value='' disabled>Select device</option>
          {Array.from({ length: 8 }, (_, index) => `CP${index + 1}`).map((device) => (
            <option key={device} value={device}>{device}</option>
          ))}
          <option value='ME'>ME</option>
        </select>
      </div>
      <div className='form-field'>
        <label htmlFor='payment_date'>Payment date <span aria-hidden='true'>*</span></label>
        <input
          id='payment_date'
          name='payment_date'
          type='date'
          min={today}
          value={paymentDate}
          onChange={(event) => {
            const selectedDate = event.target.value
            setPaymentDate(selectedDate && selectedDate < today ? today : selectedDate)
          }}
          required
        />
      </div>
      <div className='form-field'>
        <label htmlFor='date'>Payment time <span aria-hidden='true'>*</span></label>
        <input id='date' name='date' type='time' required />
      </div>
      <div className='form-field'>
        <label htmlFor='amount'>Amount <span aria-hidden='true'>*</span></label>
        <div className='input-with-prefix'>
          <span aria-hidden='true'>₱</span>
          <input
            id='amount'
            name='amount'
            type='number'
            min='0.01'
            step='0.01'
            required
            placeholder='0.00'
            onKeyDown={preventNegativeAmount}
            onChange={(event) => {
              clampAmountToZero(event)
              const nextAmount = event.currentTarget.value
              setAmount(nextAmount)
              if (!nextAmount) {
                setCharge('')
              } else if (paymentType && paymentType !== 'GCash Load') {
                const calculatedCharge = calculatePaymentCharge(paymentType, Number(nextAmount))
                setCharge(calculatedCharge > 0 ? calculatedCharge.toFixed(2) : '')
              }
            }}
          />
        </div>
        <span className='field-hint'>The actual amount in the GCash, Maya, or banking app</span>
      </div>
      <div className='form-field'>
        <label htmlFor='charge'>Charge <span aria-hidden='true'>*</span></label>
        <div className='input-with-prefix'>
          <span aria-hidden='true'>₱</span>
          <input
            id='charge'
            name='charge'
            type='number'
            min='0'
            step='0.01'
            required
            value={charge}
            placeholder='0.00'
            onKeyDown={preventNegativeAmount}
            onChange={(event) => {
              clampAmountToZero(event)
              setCharge(event.currentTarget.value)
            }}
            aria-describedby='charge-calculation'
          />
        </div>
        <span id='charge-calculation' className='field-hint'>Auto-calculated from payment type and amount; you can adjust it.</span>
      </div>
      <div className='form-field'>
        <label htmlFor='tran_id'>Transaction ID{transactionIdRequired && <span aria-hidden='true'> *</span>}</label>
        <input
          id='tran_id'
          name='tran_id'
          maxLength={4}
          placeholder={transactionIdRequired ? 'Required, up to 4 characters' : 'Optional, up to 4 characters'}
          required={transactionIdRequired}
        />
      </div>
      <div className='form-field form-field-wide'>
        <label htmlFor='note'>Note</label>
        <textarea id='note' name='note' maxLength={500} rows={3} placeholder='Add a note (optional)' />
      </div>

      {state.error && <p className='transaction-form-error' role='alert'>{state.error}</p>}
    </form>
    <div className='app-action-footer'>
      <div className='app-action-footer-inner'>
        <a className='set-balance-button' href='/dashboard'>Cancel</a>
        <button
          className='add-transaction-button'
          type='submit'
          form='new-transaction-form'
          disabled={pending}
        >
          {pending ? 'Saving…' : 'Save transaction'}
        </button>
      </div>
    </div>
    </>
  )
}