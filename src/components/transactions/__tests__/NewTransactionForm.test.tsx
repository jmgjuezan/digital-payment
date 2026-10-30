import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NewTransactionForm from '@/components/transactions/NewTransactionForm'

vi.mock('@/app/transactions/new/actions', () => ({
  createPayment: vi.fn(),
}))

describe('NewTransactionForm Component', () => {
  it('renders all required form inputs and submit button', () => {
    render(<NewTransactionForm />)

    expect(screen.getByLabelText(/payment type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/device/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: /charge/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save transaction/i })).toBeInTheDocument()
  })

  it('automatically calculates charge when amount is entered after selecting payment type', () => {
    render(<NewTransactionForm />)

    // Focus and select GCash Cash-in
    const typeInput = screen.getByLabelText(/payment type/i)
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
    render(<NewTransactionForm />)

    const dateInput = screen.getByLabelText(/payment date/i) as HTMLInputElement
    expect(dateInput.type).toBe('date')

    fireEvent.change(dateInput, { target: { value: dateInput.min } })
    expect(dateInput.value).toBe(dateInput.min)
  })

  it('shows charge guidance and closes it on button toggle or outside press', () => {
    render(<NewTransactionForm />)

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
