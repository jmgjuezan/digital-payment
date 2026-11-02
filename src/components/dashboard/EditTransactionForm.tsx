'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePayment } from '@/app/dashboard/actions'
import type { Payment } from '@/components/dashboard/DashboardTransactions'
import { paymentTypeOptions } from '@/lib/payment-options'
import { calculatePaymentCharge } from '@/lib/payment-charge'

export default function EditTransactionForm({
  payment,
  returnDate,
}: {
  payment: Payment
  returnDate?: string
}) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [paymentType, setPaymentType] = useState(payment.type)
  const [paymentTypeQuery, setPaymentTypeQuery] = useState(payment.type)
  const [paymentTypeMenuOpen, setPaymentTypeMenuOpen] = useState(false)
  const [activePaymentTypeIndex, setActivePaymentTypeIndex] = useState(-1)
  const [device, setDevice] = useState(payment.device)
  const [deviceQuery, setDeviceQuery] = useState(payment.device)
  const [deviceMenuOpen, setDeviceMenuOpen] = useState(false)
  const [activeDeviceIndex, setActiveDeviceIndex] = useState(-1)
  const [amount, setAmount] = useState(String(payment.amount))
  const [charge, setCharge] = useState(String(payment.charge))
  const paymentTypes = paymentTypeOptions.filter((option) => option.toLowerCase().includes(paymentTypeQuery.trim().toLowerCase()))
  const devices = [...Array.from({ length: 8 }, (_, index) => `CP${index + 1}`), 'ME']
  const filteredDevices = devices.filter((option) => option.toLowerCase().includes(deviceQuery.trim().toLowerCase()))
  const transactionIdRequired = Boolean(paymentType) && !paymentType.endsWith('Load')

  function selectPaymentType(option: string) {
    setPaymentType(option)
    setPaymentTypeQuery(option)
    setPaymentTypeMenuOpen(false)
    setActivePaymentTypeIndex(-1)

    if (!amount || option.endsWith('Load')) {
      setCharge('')
      return
    }

    const calculatedCharge = calculatePaymentCharge(option, Number(amount))
    setCharge(calculatedCharge > 0 ? calculatedCharge.toFixed(2) : '')
  }

  function selectDevice(option: string) {
    setDevice(option)
    setDeviceQuery(option)
    setDeviceMenuOpen(false)
    setActiveDeviceIndex(-1)
  }

  function handleComboboxKeyDown(event: React.KeyboardEvent<HTMLInputElement>, options: string[], activeIndex: number, setActiveIndex: (index: number) => void, selectOption: (option: string) => void) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex(options.length
        ? activeIndex < 0
          ? direction > 0 ? 0 : options.length - 1
          : (activeIndex + direction + options.length) % options.length
        : -1)
    } else if (event.key === 'Enter' && activeIndex >= 0 && options[activeIndex]) {
      event.preventDefault()
      selectOption(options[activeIndex])
    } else if (event.key === 'Escape') {
      setPaymentTypeMenuOpen(false)
      setDeviceMenuOpen(false)
      setActiveIndex(-1)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setError('')

    try {
      const result = await updatePayment(payment.id, formData, returnDate)
      if (result.error) {
        setError(result.error)
        return
      }

      router.push(result.redirectTo ?? '/dashboard')
      router.refresh()
    } catch {
      setError('Could not update the transaction. Try again.')
    }
  }

  return (
    <form id='edit-transaction-form' className='new-transaction-form' onSubmit={(event) => void handleSubmit(event)}>
      <div className='form-field'>
        <label htmlFor='edit-type'>Payment type <span aria-hidden='true'>*</span></label>
        <div className='payment-type-combobox'>
          <input
            id='edit-type'
            type='text'
            role='combobox'
            aria-autocomplete='list'
            aria-required='true'
            aria-expanded={paymentTypeMenuOpen}
            aria-controls='edit-type-options'
            aria-activedescendant={paymentTypeMenuOpen && activePaymentTypeIndex >= 0 ? `edit-type-option-${activePaymentTypeIndex}` : undefined}
            autoComplete='off'
            placeholder='Search payment type'
            value={paymentTypeQuery}
            onFocus={() => setPaymentTypeMenuOpen(true)}
            onBlur={() => setPaymentTypeMenuOpen(false)}
            onKeyDown={(event) => handleComboboxKeyDown(event, paymentTypes, activePaymentTypeIndex, setActivePaymentTypeIndex, selectPaymentType)}
            onChange={(event) => {
              setPaymentTypeQuery(event.target.value)
              setPaymentType('')
              setPaymentTypeMenuOpen(true)
              setActivePaymentTypeIndex(-1)
            }}
            required
          />
          <input type='hidden' name='type' value={paymentType} />
          {paymentTypeMenuOpen && (
            <ul className='payment-type-options' id='edit-type-options' role='listbox' aria-label='Payment type options'>
              {paymentTypes.length ? paymentTypes.map((option, index) => (
                <li
                  className={index === activePaymentTypeIndex ? 'payment-type-option is-active' : 'payment-type-option'}
                  id={`edit-type-option-${index}`}
                  key={option}
                  role='option'
                  aria-selected={paymentType === option}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectPaymentType(option)}
                >{option}</li>
              )) : <li className='payment-type-no-options' role='option' aria-selected={false} aria-disabled='true'>No matching payment types</li>}
            </ul>
          )}
        </div>
      </div>
      <div className='form-field'>
        <label htmlFor='edit-device'>Device <span aria-hidden='true'>*</span></label>
        <div className='payment-type-combobox'>
          <input
            id='edit-device'
            type='text'
            role='combobox'
            aria-autocomplete='list'
            aria-required='true'
            aria-expanded={deviceMenuOpen}
            aria-controls='edit-device-options'
            aria-activedescendant={deviceMenuOpen && activeDeviceIndex >= 0 ? `edit-device-option-${activeDeviceIndex}` : undefined}
            autoComplete='off'
            placeholder='Search device'
            value={deviceQuery}
            onFocus={() => setDeviceMenuOpen(true)}
            onBlur={() => setDeviceMenuOpen(false)}
            onKeyDown={(event) => handleComboboxKeyDown(event, filteredDevices, activeDeviceIndex, setActiveDeviceIndex, selectDevice)}
            onChange={(event) => {
              setDeviceQuery(event.target.value)
              setDevice('')
              setDeviceMenuOpen(true)
              setActiveDeviceIndex(-1)
            }}
            required
          />
          <input type='hidden' name='device' value={device} />
          {deviceMenuOpen && (
            <ul className='payment-type-options' id='edit-device-options' role='listbox' aria-label='Device options'>
              {filteredDevices.length ? filteredDevices.map((option, index) => (
                <li
                  className={index === activeDeviceIndex ? 'payment-type-option is-active' : 'payment-type-option'}
                  id={`edit-device-option-${index}`}
                  key={option}
                  role='option'
                  aria-selected={device === option}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectDevice(option)}
                >{option}</li>
              )) : <li className='payment-type-no-options' role='option' aria-selected={false} aria-disabled='true'>No matching devices</li>}
            </ul>
          )}
        </div>
      </div>
      <div className='form-field'>
        <label htmlFor='edit-date'>Payment date <span aria-hidden='true'>*</span></label>
        <input id='edit-date' name='date' type='date' max={new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())} defaultValue={payment.date} required />
      </div>
      <div className='form-field'>
        <label htmlFor='edit-time'>Payment time <span aria-hidden='true'>*</span></label>
        <input id='edit-time' name='time' type='time' defaultValue={payment.time?.slice(0, 5) ?? ''} required />
      </div>
      <div className='form-field'>
        <label htmlFor='edit-amount'>Amount <span aria-hidden='true'>*</span></label>
        <div className='input-with-prefix'>
          <span aria-hidden='true'>₱</span>
          <input
            id='edit-amount'
            name='amount'
            type='number'
            min='0.01'
            step='0.01'
            value={amount}
            placeholder='0.00'
            required
            onChange={(event) => {
              const nextAmount = event.target.value
              setAmount(nextAmount)
              if (!nextAmount) {
                setCharge('')
              } else if (paymentType && !paymentType.endsWith('Load')) {
                const calculatedCharge = calculatePaymentCharge(paymentType, Number(nextAmount))
                setCharge(calculatedCharge > 0 ? calculatedCharge.toFixed(2) : '')
              }
            }}
          />
        </div>
      </div>
      <div className='form-field'>
        <label htmlFor='edit-charge'>Charge <span aria-hidden='true'>*</span></label>
        <div className='input-with-prefix'>
          <span aria-hidden='true'>₱</span>
          <input id='edit-charge' name='charge' type='number' min='0' step='0.01' value={charge} onChange={(event) => setCharge(event.target.value)} placeholder='0.00' required />
        </div>
      </div>
      <div className='form-field'>
        <label htmlFor='edit-tran-id'>Transaction ID{transactionIdRequired && <span aria-hidden='true'> *</span>}</label>
        <input id='edit-tran-id' name='tran_id' maxLength={4} defaultValue={payment.tran_id ?? ''} placeholder={transactionIdRequired ? 'Required, up to 4 characters' : 'Optional, up to 4 characters'} required={transactionIdRequired} />
      </div>
      <div className='form-field form-field-wide'>
        <label htmlFor='edit-note'>Note</label>
        <textarea id='edit-note' name='note' maxLength={500} defaultValue={payment.note ?? ''} rows={4} placeholder='Add a note (optional)' />
      </div>
      {error && <p className='transaction-form-error' role='alert'>{error}</p>}
    </form>
  )
}
