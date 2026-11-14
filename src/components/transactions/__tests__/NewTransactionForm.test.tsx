import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NewTransactionForm from '@/components/transactions/NewTransactionForm'

vi.mock('@/app/transactions/new/actions', () => ({
  createPayment: vi.fn(),
}))

vi.mock('@/app/actions/server-time', () => ({
  getCurrentServerTime: vi.fn().mockResolvedValue('2026-11-09T16:47:00.000Z'),
}))

const initialServerTime = '2026-11-09T16:47:00.000Z'

describe('NewTransactionForm Component', () => {
  it('autofocuses the device field', () => {
    render(<NewTransactionForm initialServerTime={initialServerTime} />)

    expect(screen.getByRole('combobox', { name: /device/i })).toHaveFocus()
  })

  it('renders all required form inputs and submit button', () => {
    render(<NewTransactionForm initialServerTime={initialServerTime} />)

    expect(screen.getByRole('combobox', { name: /device/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /payment type/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/payment date/i)).toHaveAttribute('name', 'date')
    expect(screen.getByLabelText(/payment time/i)).toHaveAttribute('name', 'time')
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: /charge/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save transaction/i })).toBeInTheDocument()
  })

  it('automatically calculates charge when amount is entered after selecting payment type', () => {
    render(<NewTransactionForm initialServerTime={initialServerTime} />)

    // Select device first (required before payment type becomes available)
    const deviceInput = screen.getByRole('combobox', { name: /device/i })
    fireEvent.focus(deviceInput)
    fireEvent.click(screen.getByRole('option', { name: 'ME' }))

    // Focus and select GCash Cash-in
    const typeInput = screen.getByRole('combobox', { name: /payment type/i })
    fireEvent.focus(typeInput)

    const option = screen.getByRole('option', { name: 'GCash Cash-in' })
    fireEvent.click(option)

    // Enter Amount 1000
    const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement
    fireEvent.change(amountInput, { target: { value: '1000' } })

    // Charge for GCash 1000 should automatically be 10.00 (2 slabs of 500 * 5)
    const chargeInput = screen.getByRole('spinbutton', { name: /charge/i }) as HTMLInputElement
    expect(chargeInput.value).toBe('10.00')
  })

  it('updates payment date value when changed', () => {
    render(<NewTransactionForm initialServerTime={initialServerTime} />)

    const dateInput = screen.getByLabelText(/payment date/i) as HTMLInputElement
    expect(dateInput.type).toBe('date')

    fireEvent.change(dateInput, { target: { value: dateInput.min } })
    expect(dateInput.value).toBe(dateInput.min)
  })

  it('defaults payment time to the current server time and keeps minutes editable', () => {
    const { unmount } = render(<NewTransactionForm initialServerTime={initialServerTime} />)

    try {
      const paymentTime = screen.getByLabelText(/payment time/i) as HTMLInputElement
      expect(paymentTime).toHaveValue('00:47')
      fireEvent.change(paymentTime, { target: { value: '00:35' } })
      expect(paymentTime).toHaveValue('00:35')
      fireEvent.focus(paymentTime)
    } finally {
      unmount()
    }
  })

  it('shows charge guidance and closes it on button toggle or outside press', () => {
    render(<NewTransactionForm initialServerTime={initialServerTime} />)

    const helpButton = screen.getByRole('button', { name: 'Charges help' })
    expect(helpButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    fireEvent.click(helpButton)

    expect(helpButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('tooltip')).toHaveTextContent('GCash and Maya charges are ₱5 for every ₱500. Bank charges are ₱5 for every ₱1,000.')

    fireEvent.pointerDown(screen.getByRole('tooltip'))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.pointerDown(screen.getByRole('tooltip').parentElement!)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    fireEvent.click(helpButton)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText(/^amount/i))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    fireEvent.click(helpButton)
    fireEvent.click(helpButton)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
