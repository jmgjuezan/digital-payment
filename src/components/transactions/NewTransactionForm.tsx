'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { CircleHelp } from 'lucide-react'
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

function getYesterdayInPaymentTimeZone() {
  const yesterday = new Date(`${getTodayInPaymentTimeZone()}T00:00:00Z`)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  return yesterday.toISOString().slice(0, 10)
}

export default function NewTransactionForm() {
  const [state, action, pending] = useActionState(createPayment, initialState)
  const [paymentType, setPaymentType] = useState('')
  const [paymentTypeQuery, setPaymentTypeQuery] = useState('')
  const [paymentTypeMenuOpen, setPaymentTypeMenuOpen] = useState(false)
  const [activePaymentTypeIndex, setActivePaymentTypeIndex] = useState(-1)
  const [paymentTypeSelectionError, setPaymentTypeSelectionError] = useState(false)
  const [device, setDevice] = useState('')
  const [deviceQuery, setDeviceQuery] = useState('')
  const [deviceMenuOpen, setDeviceMenuOpen] = useState(false)
  const [activeDeviceIndex, setActiveDeviceIndex] = useState(-1)
  const [deviceSelectionError, setDeviceSelectionError] = useState(false)
  const [paymentDate, setPaymentDate] = useState(getTodayInPaymentTimeZone)
  const [amount, setAmount] = useState('')
  const [charge, setCharge] = useState('')
  const [showChargeHelp, setShowChargeHelp] = useState(false)
  const chargeHelpButtonRef = useRef<HTMLButtonElement>(null)
  const chargeHelpTooltipRef = useRef<HTMLSpanElement>(null)
  const transactionIdRequired = Boolean(paymentType) && !paymentType.endsWith('Load')
  const today = getTodayInPaymentTimeZone()
  const yesterday = getYesterdayInPaymentTimeZone()
  const savingDialogRef = useRef<HTMLDialogElement>(null)
  const paymentTypeInputRef = useRef<HTMLInputElement>(null)
  const deviceInputRef = useRef<HTMLInputElement>(null)
  const deviceOptions = [...Array.from({ length: 8 }, (_, index) => `CP${index + 1}`), 'ME']
  const filteredPaymentTypes = paymentTypeOptions.filter((option) =>
    option.toLowerCase().includes(paymentTypeQuery.trim().toLowerCase()),
  )
  const filteredDevices = deviceOptions.filter((option) =>
    option.toLowerCase().includes(deviceQuery.trim().toLowerCase()),
  )

  useEffect(() => {
    const dialog = savingDialogRef.current
    if (!dialog) return

    if (pending && !dialog.open) dialog.showModal()
    if (!pending && dialog.open) dialog.close()
  }, [pending])

  useEffect(() => {
    if (!showChargeHelp) return

    function closeChargeHelpOnOutsidePress(event: PointerEvent) {
      const target = event.target as Node
      const clickedButton = chargeHelpButtonRef.current?.contains(target)
      const clickedTooltip = chargeHelpTooltipRef.current?.contains(target)
      if (!clickedButton && !clickedTooltip) setShowChargeHelp(false)
    }

    document.addEventListener('pointerdown', closeChargeHelpOnOutsidePress)
    document.addEventListener('click', closeChargeHelpOnOutsidePress, true)
    return () => {
      document.removeEventListener('pointerdown', closeChargeHelpOnOutsidePress)
      document.removeEventListener('click', closeChargeHelpOnOutsidePress, true)
    }
  }, [showChargeHelp])

  function preventNegativeAmount(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === '-' || event.key === 'Subtract') event.preventDefault()
  }

  function clampAmountToZero(event: React.ChangeEvent<HTMLInputElement>) {
    if (Number(event.currentTarget.value) < 0) event.currentTarget.value = '0'
  }

  function selectPaymentType(nextType: string) {
    setPaymentType(nextType)
    setPaymentTypeQuery(nextType)
    setPaymentTypeMenuOpen(false)
    setActivePaymentTypeIndex(-1)
    setPaymentTypeSelectionError(false)

    if (!amount || nextType.endsWith('Load')) {
      setCharge('')
      return
    }

    const calculatedCharge = calculatePaymentCharge(nextType, Number(amount))
    setCharge(calculatedCharge > 0 ? calculatedCharge.toFixed(2) : '')
  }

  function handlePaymentTypeKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setPaymentTypeMenuOpen(true)
      setActivePaymentTypeIndex((index) => filteredPaymentTypes.length ? (index < 0 ? 0 : (index + 1) % filteredPaymentTypes.length) : -1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setPaymentTypeMenuOpen(true)
      setActivePaymentTypeIndex((index) => filteredPaymentTypes.length ? (index <= 0 ? filteredPaymentTypes.length - 1 : index - 1) : -1)
    } else if (event.key === 'Enter' && paymentTypeMenuOpen && filteredPaymentTypes.length > 0) {
      event.preventDefault()
      const selectedIndex = filteredPaymentTypes.findIndex((option) => option === paymentType)
      const optionIndex = activePaymentTypeIndex >= 0 ? activePaymentTypeIndex : selectedIndex >= 0 ? selectedIndex : 0
      selectPaymentType(filteredPaymentTypes[optionIndex])
    } else if (event.key === 'Escape') {
      setPaymentTypeMenuOpen(false)
      setActivePaymentTypeIndex(-1)
    }
  }

  function selectDevice(nextDevice: string) {
    setDevice(nextDevice)
    setDeviceQuery(nextDevice)
    setDeviceMenuOpen(false)
    setActiveDeviceIndex(-1)
    setDeviceSelectionError(false)
  }

  function handleDeviceKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setDeviceMenuOpen(true)
      setActiveDeviceIndex((index) => filteredDevices.length ? (index < 0 ? 0 : (index + 1) % filteredDevices.length) : -1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setDeviceMenuOpen(true)
      setActiveDeviceIndex((index) => filteredDevices.length ? (index <= 0 ? filteredDevices.length - 1 : index - 1) : -1)
    } else if (event.key === 'Enter' && deviceMenuOpen && filteredDevices.length > 0) {
      event.preventDefault()
      const selectedIndex = filteredDevices.indexOf(device)
      const optionIndex = activeDeviceIndex >= 0 ? activeDeviceIndex : selectedIndex >= 0 ? selectedIndex : 0
      selectDevice(filteredDevices[optionIndex])
    } else if (event.key === 'Escape') {
      setDeviceMenuOpen(false)
      setActiveDeviceIndex(-1)
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!paymentType) {
      event.preventDefault()
      setPaymentTypeSelectionError(true)
      paymentTypeInputRef.current?.focus()
      setPaymentTypeMenuOpen(true)
    } else if (!device) {
      event.preventDefault()
      setDeviceSelectionError(true)
      deviceInputRef.current?.focus()
      setDeviceMenuOpen(true)
    }
  }

  return (
    <>
    <form id='new-transaction-form' className='new-transaction-form' action={action} onSubmit={handleSubmit}>
      <div className='form-field'>
        <label htmlFor='type'>Payment type <span aria-hidden='true'>*</span></label>
        <div className='payment-type-combobox'>
        <input
          id='type'
          ref={paymentTypeInputRef}
          type='text'
          role='combobox'
          aria-autocomplete='list'
          aria-required='true'
          aria-expanded={paymentTypeMenuOpen}
          aria-controls='payment-type-options'
          aria-activedescendant={paymentTypeMenuOpen && activePaymentTypeIndex >= 0 ? `payment-type-option-${activePaymentTypeIndex}` : undefined}
          aria-describedby={paymentTypeSelectionError ? 'payment-type-error' : undefined}
          required
          autoComplete='off'
          placeholder='Search payment type'
          value={paymentTypeQuery}
          onFocus={() => setPaymentTypeMenuOpen(true)}
          onBlur={() => setPaymentTypeMenuOpen(false)}
          onKeyDown={handlePaymentTypeKeyDown}
          onChange={(event) => {
            setPaymentTypeQuery(event.target.value)
            setPaymentType('')
            setCharge('')
            setPaymentTypeSelectionError(false)
            setPaymentTypeMenuOpen(true)
            setActivePaymentTypeIndex(-1)
          }}
        />
        <input type='hidden' name='type' value={paymentType} />
        {paymentTypeMenuOpen && (
          <ul className='payment-type-options' id='payment-type-options' role='listbox' aria-label='Payment type options'>
            {filteredPaymentTypes.length > 0 ? filteredPaymentTypes.map((option, index) => (
              <li
                className={index === activePaymentTypeIndex ? 'payment-type-option is-active' : 'payment-type-option'}
                id={`payment-type-option-${index}`}
                key={option}
                role='option'
                aria-selected={paymentType === option}
                onMouseEnter={() => setActivePaymentTypeIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectPaymentType(option)}
              >
                {option}
              </li>
            )) : (
              <li className='payment-type-no-options' role='option' aria-disabled='true'>No matching payment types</li>
            )}
          </ul>
        )}
        </div>
        {paymentTypeSelectionError && <span className='transaction-form-error payment-type-inline-error' id='payment-type-error' role='alert'>Select a payment type from the list.</span>}
      </div>
      <div className='form-field'>
        <label htmlFor='device'>Device <span aria-hidden='true'>*</span></label>
        <div className='payment-type-combobox'>
          <input
            id='device'
            ref={deviceInputRef}
            type='text'
            role='combobox'
            aria-autocomplete='list'
            aria-required='true'
            aria-expanded={deviceMenuOpen}
            aria-controls='device-options'
            aria-activedescendant={deviceMenuOpen && activeDeviceIndex >= 0 ? `device-option-${activeDeviceIndex}` : undefined}
            aria-describedby={deviceSelectionError ? 'device-selection-error' : undefined}
            autoComplete='off'
            placeholder='Search device'
            required
            value={deviceQuery}
            onFocus={() => setDeviceMenuOpen(true)}
            onBlur={() => setDeviceMenuOpen(false)}
            onKeyDown={handleDeviceKeyDown}
            onChange={(event) => {
              setDeviceQuery(event.target.value)
              setDevice('')
              setDeviceSelectionError(false)
              setDeviceMenuOpen(true)
              setActiveDeviceIndex(-1)
            }}
          />
          <input type='hidden' name='device' value={device} />
          {deviceMenuOpen && (
            <ul className='payment-type-options' id='device-options' role='listbox' aria-label='Device options'>
              {filteredDevices.map((option, index) => (
                <li
                  className={index === activeDeviceIndex ? 'payment-type-option is-active' : 'payment-type-option'}
                  id={`device-option-${index}`}
                  key={option}
                  role='option'
                  aria-selected={device === option}
                  onMouseEnter={() => setActiveDeviceIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectDevice(option)}
                >
                  {option}
                </li>
              ))}
              {filteredDevices.length === 0 && (
                <li className='payment-type-no-options' role='option' aria-disabled='true'>No matching devices</li>
              )}
            </ul>
          )}
        </div>
        {deviceSelectionError && <span className='transaction-form-error payment-type-inline-error' id='device-selection-error' role='alert'>Select a device from the list.</span>}
      </div>
      <div className='form-field'>
        <label htmlFor='payment_date'>Payment date <span aria-hidden='true'>*</span></label>
        <input
          id='payment_date'
          name='payment_date'
          type='date'
          min={yesterday}
          max={today}
          value={paymentDate}
          onChange={(event) => {
            const selectedDate = event.target.value
            setPaymentDate(selectedDate && selectedDate < yesterday ? yesterday : selectedDate > today ? today : selectedDate)
          }}
          required
        />
      </div>
      <div className='form-field'>
        <label htmlFor='date'>Payment time <span aria-hidden='true'>*</span></label>
        <input id='date' name='date' type='time' required />
      </div>
      <div className='form-field amount-charge-field'>
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
      <div className='form-field amount-charge-field'>
        <div className={showChargeHelp ? 'charge-help-container is-open' : 'charge-help-container'}>
          <div className='field-label-row'>
            <label htmlFor='charge'>Charge <span aria-hidden='true'>*</span></label>
            <button
              className='charge-help-button'
              ref={chargeHelpButtonRef}
              type='button'
              aria-label='Charges help'
              aria-expanded={showChargeHelp}
              aria-controls='charge-help-tooltip'
              aria-describedby={showChargeHelp ? 'charge-help-tooltip' : undefined}
              onClick={() => setShowChargeHelp((open) => !open)}
            >
              <CircleHelp size={16} aria-hidden='true' />
            </button>
          </div>
          {showChargeHelp && (
            <span className='charge-help-tooltip' id='charge-help-tooltip' role='tooltip' ref={chargeHelpTooltipRef}>
              GCash and Maya charges are ₱5 for every ₱500. Bank charges are ₱5 for every ₱1,000.
            </span>
          )}
        </div>
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
    <dialog
      ref={savingDialogRef}
      className='form-saving-dialog'
      aria-labelledby='transaction-saving-title'
      onCancel={(event) => event.preventDefault()}
    >
      <span className='auth-loading-spinner' aria-hidden='true' />
      <h2 id='transaction-saving-title'>Saving transaction</h2>
      <p role='status'>Please wait while the transaction is saved.</p>
    </dialog>
    </>
  )
}
