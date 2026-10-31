'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import { saveBalance, type SaveBalanceState } from '@/app/balances/new/actions'

const initialState: SaveBalanceState = {}
const balanceTypes = ['GCash', 'Maya']
const balanceDevices = Array.from({ length: 8 }, (_, index) => `CP${index + 1}`)

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
  onActionChange: (submit: () => void, pending: boolean) => void
}) {
  const [state, action, pending] = useActionState(saveBalance, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const savingDialogRef = useRef<HTMLDialogElement>(null)
  const formErrorRef = useRef<HTMLParagraphElement>(null)
  const typeInputRef = useRef<HTMLInputElement>(null)
  const deviceInputRef = useRef<HTMLInputElement>(null)
  const submitForm = useCallback(() => formRef.current?.requestSubmit(), [])
  const today = getTodayInPaymentTimeZone()
  const [amount, setAmount] = useState('')
  const [balanceType, setBalanceType] = useState('')
  const [balanceTypeQuery, setBalanceTypeQuery] = useState('')
  const [balanceTypeMenuOpen, setBalanceTypeMenuOpen] = useState(false)
  const [activeBalanceTypeIndex, setActiveBalanceTypeIndex] = useState(-1)
  const [balanceTypeError, setBalanceTypeError] = useState(false)
  const [device, setDevice] = useState('')
  const [deviceQuery, setDeviceQuery] = useState('')
  const [deviceMenuOpen, setDeviceMenuOpen] = useState(false)
  const [activeDeviceIndex, setActiveDeviceIndex] = useState(-1)
  const [deviceError, setDeviceError] = useState(false)
  const [dismissedErrorState, setDismissedErrorState] = useState<SaveBalanceState | null>(null)
  const filteredBalanceTypes = balanceTypes.filter((option) => option.toLowerCase().includes(balanceTypeQuery.trim().toLowerCase()))
  const filteredDevices = balanceDevices.filter((option) => option.toLowerCase().includes(deviceQuery.trim().toLowerCase()))

  useEffect(() => {
    onActionChange(submitForm, pending)
  }, [action, pending, onActionChange, submitForm])

  useEffect(() => {
    const dialog = savingDialogRef.current
    if (!dialog) return

    if (pending && !dialog.open) dialog.showModal()
    if (!pending && dialog.open) dialog.close()
  }, [pending])

  useEffect(() => {
    if (!state.error || dismissedErrorState === state) return

    formErrorRef.current?.focus()
    formErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [state, dismissedErrorState])

  function selectBalanceType(option: string) {
    setBalanceType(option)
    setBalanceTypeQuery(option)
    setBalanceTypeMenuOpen(false)
    setActiveBalanceTypeIndex(-1)
    setBalanceTypeError(false)
  }

  function selectDevice(option: string) {
    setDevice(option)
    setDeviceQuery(option)
    setDeviceMenuOpen(false)
    setActiveDeviceIndex(-1)
    setDeviceError(false)
  }

  function handleTypeKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setBalanceTypeMenuOpen(true)
      setActiveBalanceTypeIndex((index) => filteredBalanceTypes.length ? (index < 0 ? 0 : (index + 1) % filteredBalanceTypes.length) : -1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setBalanceTypeMenuOpen(true)
      setActiveBalanceTypeIndex((index) => filteredBalanceTypes.length ? (index <= 0 ? filteredBalanceTypes.length - 1 : index - 1) : -1)
    } else if (event.key === 'Enter' && balanceTypeMenuOpen && filteredBalanceTypes.length > 0) {
      event.preventDefault()
      const selectedIndex = filteredBalanceTypes.indexOf(balanceType)
      const optionIndex = activeBalanceTypeIndex >= 0 ? activeBalanceTypeIndex : selectedIndex >= 0 ? selectedIndex : 0
      selectBalanceType(filteredBalanceTypes[optionIndex])
    } else if (event.key === 'Escape') {
      setBalanceTypeMenuOpen(false)
      setActiveBalanceTypeIndex(-1)
    }
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
    setDismissedErrorState(state)

    if (!balanceType) {
      event.preventDefault()
      setBalanceTypeError(true)
      typeInputRef.current?.focus()
      setBalanceTypeMenuOpen(true)
    } else if (!device) {
      event.preventDefault()
      setDeviceError(true)
      deviceInputRef.current?.focus()
      setDeviceMenuOpen(true)
    }
  }

  return (
    <>
    <form
      ref={formRef}
      className='new-transaction-form'
      id='balance-form'
      action={action}
      onSubmit={handleSubmit}
    >
      <div className='form-field'>
        <label htmlFor='balance-type'>Balance type <span aria-hidden='true'>*</span></label>
        <div className='payment-type-combobox'>
          <input
            id='balance-type'
            ref={typeInputRef}
            tabIndex={3}
            type='text'
            role='combobox'
            aria-autocomplete='list'
            aria-required='true'
            aria-expanded={balanceTypeMenuOpen}
            aria-controls='balance-type-options'
            aria-activedescendant={balanceTypeMenuOpen && activeBalanceTypeIndex >= 0 ? `balance-type-option-${activeBalanceTypeIndex}` : undefined}
            aria-describedby={balanceTypeError ? 'balance-type-error' : undefined}
            autoComplete='off'
            placeholder='Search balance type'
            required
            value={balanceTypeQuery}
            onFocus={() => setBalanceTypeMenuOpen(true)}
            onBlur={() => setBalanceTypeMenuOpen(false)}
            onKeyDown={handleTypeKeyDown}
            onChange={(event) => {
              setBalanceTypeQuery(event.target.value)
              setBalanceType('')
              setBalanceTypeError(false)
              setBalanceTypeMenuOpen(true)
              setActiveBalanceTypeIndex(-1)
            }}
          />
          <input type='hidden' name='type' value={balanceType} />
          {balanceTypeMenuOpen && (
            <ul className='payment-type-options' id='balance-type-options' role='listbox' aria-label='Balance type options'>
              {filteredBalanceTypes.length > 0 ? filteredBalanceTypes.map((option, index) => (
                <li
                  className={index === activeBalanceTypeIndex ? 'payment-type-option is-active' : 'payment-type-option'}
                  id={`balance-type-option-${index}`}
                  key={option}
                  role='option'
                  aria-selected={balanceType === option}
                  onMouseEnter={() => setActiveBalanceTypeIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectBalanceType(option)}
                >
                  {option}
                </li>
              )) : <li className='payment-type-no-options' role='option' aria-selected={false} aria-disabled='true'>No matching balance types</li>}
            </ul>
          )}
        </div>
        {balanceTypeError && <span className='transaction-form-error payment-type-inline-error' id='balance-type-error' role='alert'>Select GCash or Maya from the list.</span>}
      </div>
      <div className='form-field'>
        <label htmlFor='balance-device'>Device <span aria-hidden='true'>*</span></label>
        <div className='payment-type-combobox'>
          <input
            id='balance-device'
            ref={deviceInputRef}
            tabIndex={4}
            type='text'
            role='combobox'
            aria-autocomplete='list'
            aria-required='true'
            aria-expanded={deviceMenuOpen}
            aria-controls='balance-device-options'
            aria-activedescendant={deviceMenuOpen && activeDeviceIndex >= 0 ? `balance-device-option-${activeDeviceIndex}` : undefined}
            aria-describedby={deviceError ? 'balance-device-error' : undefined}
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
              setDeviceError(false)
              setDeviceMenuOpen(true)
              setActiveDeviceIndex(-1)
            }}
          />
          <input type='hidden' name='device' value={device} />
          {deviceMenuOpen && (
            <ul className='payment-type-options' id='balance-device-options' role='listbox' aria-label='Device options'>
              {filteredDevices.map((option, index) => (
                <li
                  className={index === activeDeviceIndex ? 'payment-type-option is-active' : 'payment-type-option'}
                  id={`balance-device-option-${index}`}
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
              {filteredDevices.length === 0 && <li className='payment-type-no-options' role='option' aria-selected={false} aria-disabled='true'>No matching devices</li>}
            </ul>
          )}
        </div>
        {deviceError && <span className='transaction-form-error payment-type-inline-error' id='balance-device-error' role='alert'>Select a device from the list.</span>}
      </div>
      <div className='form-field'>
        <label htmlFor='balance-date-display'>Date</label>
        <input id='balance-date-display' type='text' tabIndex={6} value={today} readOnly aria-readonly='true' />
        <input type='hidden' name='date' value={today} />
      </div>
      <div className='form-field'>
        <label htmlFor='balance-amount'>Amount <span aria-hidden='true'>*</span></label>
        <div className='input-with-prefix'>
          <span aria-hidden='true'>₱</span>
          <input
            id='balance-amount'
            name='amount'
            type='number'
            tabIndex={5}
            min='0'
            step='0.01'
            required
            placeholder='0.00'
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
      </div>

      {state.error && dismissedErrorState !== state && <p className='transaction-form-error' role='alert' tabIndex={-1} ref={formErrorRef}>{state.error}</p>}
    </form>
    <dialog
      ref={savingDialogRef}
      className='form-saving-dialog'
      aria-labelledby='balance-saving-title'
      onCancel={(event) => event.preventDefault()}
    >
      <span className='auth-loading-spinner' aria-hidden='true' />
      <h2 id='balance-saving-title'>Saving balance</h2>
      <p role='status'>Please wait while the balance is saved.</p>
    </dialog>
    </>
  )
}
