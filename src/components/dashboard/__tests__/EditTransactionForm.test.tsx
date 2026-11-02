import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditTransactionForm from '@/components/dashboard/EditTransactionForm'
import type { Payment } from '@/components/dashboard/DashboardTransactions'
import { updatePayment } from '@/app/dashboard/actions'

const { mockRouterPush } = vi.hoisted(() => ({ mockRouterPush: vi.fn() }))

vi.mock('@/app/dashboard/actions', () => ({ updatePayment: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockRouterPush, refresh: vi.fn() }) }))

const payment: Payment = {
  id: 21,
  created_at: '2026-11-02T03:30:00Z',
  type: 'GCash Cash-in',
  tran_id: '1234',
  date: '2026-11-02',
  time: '10:30:00',
  charge: 5,
  amount: 500,
  device: 'CP1',
  created_by: 'user@example.com',
  note: null,
}

describe('EditTransactionForm', () => {
  it('uses searchable payment type and device comboboxes', () => {
    render(<EditTransactionForm payment={payment} />)

    expect(screen.getByRole('combobox', { name: /payment type/i })).toHaveValue('GCash Cash-in')
    expect(screen.getByRole('combobox', { name: /device/i })).toHaveValue('CP1')

    const deviceInput = screen.getByRole('combobox', { name: /device/i })
    fireEvent.change(deviceInput, { target: { value: '' } })
    fireEvent.focus(deviceInput)
    expect(screen.getByRole('option', { name: 'CP1' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'ME' })).toBeInTheDocument()
  })

  it('shows required markers for required fields', () => {
    render(<EditTransactionForm payment={payment} />)

    expect(screen.getByText('Payment type').parentElement).toHaveTextContent('*')
    expect(screen.getByText('Device').parentElement).toHaveTextContent('*')
    expect(screen.getByText('Payment date').parentElement).toHaveTextContent('*')
    expect(screen.getByText('Payment time').parentElement).toHaveTextContent('*')
    expect(screen.getByText('Amount').parentElement).toHaveTextContent('*')
    expect(screen.getByText('Charge').parentElement).toHaveTextContent('*')
    expect(screen.getByText('Transaction ID').parentElement).toHaveTextContent('*')
  })

  it('uses the same placeholders as Add transaction', () => {
    render(<EditTransactionForm payment={payment} />)

    expect(screen.getByRole('combobox', { name: /payment type/i })).toHaveAttribute('placeholder', 'Search payment type')
    expect(screen.getByRole('combobox', { name: /device/i })).toHaveAttribute('placeholder', 'Search device')
    expect(screen.getByRole('spinbutton', { name: /amount/i })).toHaveAttribute('placeholder', '0.00')
    expect(screen.getByRole('spinbutton', { name: /charge/i })).toHaveAttribute('placeholder', '0.00')
    expect(screen.getByRole('textbox', { name: /transaction id/i })).toHaveAttribute('placeholder', 'Required, up to 4 characters')
    expect(screen.getByLabelText('Note')).toHaveAttribute('placeholder', 'Add a note (optional)')
  })

  it('makes transaction ID optional when a Load payment type is selected', () => {
    render(<EditTransactionForm payment={payment} />)

    fireEvent.change(screen.getByRole('combobox', { name: /payment type/i }), { target: { value: 'GCash Load' } })

    expect(screen.getByLabelText('Transaction ID')).not.toBeRequired()
    expect(screen.getByText('Transaction ID').parentElement).not.toHaveTextContent('*')
  })

  it('recalculates the charge when the amount changes', () => {
    render(<EditTransactionForm payment={payment} />)

    fireEvent.change(screen.getByRole('spinbutton', { name: /amount/i }), { target: { value: '1000' } })

    expect(screen.getByRole('spinbutton', { name: /charge/i })).toHaveValue(10)
  })

  it('recalculates the charge when the payment type changes and keeps it editable', () => {
    render(<EditTransactionForm payment={payment} />)

    fireEvent.change(screen.getByRole('spinbutton', { name: /amount/i }), { target: { value: '1000' } })
    expect(screen.getByRole('spinbutton', { name: /charge/i })).toHaveValue(10)

    const typeInput = screen.getByRole('combobox', { name: /payment type/i })
    fireEvent.change(typeInput, { target: { value: 'BPI Cash-in' } })
    fireEvent.click(screen.getByRole('option', { name: 'BPI Cash-in' }))
    expect(screen.getByRole('spinbutton', { name: /charge/i })).toHaveValue(5)

    fireEvent.change(screen.getByRole('spinbutton', { name: /charge/i }), { target: { value: '12' } })
    expect(screen.getByRole('spinbutton', { name: /charge/i })).toHaveValue(12)
  })

  it('clears the charge when a Load payment type is selected', () => {
    render(<EditTransactionForm payment={payment} />)

    const typeInput = screen.getByRole('combobox', { name: /payment type/i })
    fireEvent.change(typeInput, { target: { value: 'GCash Load' } })
    fireEvent.click(screen.getByRole('option', { name: 'GCash Load' }))

    expect(screen.getByRole('spinbutton', { name: /charge/i })).toHaveValue(null)
  })

  it('passes the return date to the update action and navigates to it after saving', async () => {
    vi.mocked(updatePayment).mockResolvedValue({ success: true, redirectTo: '/dashboard?date=2026-11-01' })
    mockRouterPush.mockClear()

    render(<EditTransactionForm payment={payment} returnDate='2026-11-01' />)
    fireEvent.submit(screen.getByRole('combobox', { name: /payment type/i }).closest('form')!)

    await waitFor(() => {
      expect(updatePayment).toHaveBeenCalledWith(21, expect.any(FormData), '2026-11-01')
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard?date=2026-11-01')
    })
  })
})
