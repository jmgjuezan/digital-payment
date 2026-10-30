import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import DashboardTransactions, { type Payment } from '@/components/dashboard/DashboardTransactions'
import * as dashboardActions from '@/app/dashboard/actions'

const mockPayments: Payment[] = [
  {
    id: 1,
    created_at: '2026-10-31T01:00:00Z',
    type: 'GCash Cash-in',
    tran_id: 'TX100',
    payment_date: '2026-10-31',
    date: '10:00:00',
    charge: 10,
    amount: 1000,
    device: 'CP1',
    note: 'First note',
  },
  {
    id: 2,
    created_at: '2026-10-31T02:00:00Z',
    type: 'Maya Cash-out',
    tran_id: 'TX200',
    payment_date: '2026-10-31',
    date: '11:00:00',
    charge: 5,
    amount: 500,
    device: 'CP2',
    note: 'Second note',
  },
]

describe('DashboardTransactions Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders transactions list and calculated totals', () => {
    render(
      <DashboardTransactions
        transactions={mockPayments}
        hasError={false}
        timeZone='Asia/Manila'
        selectedDate='2026-10-31'
        userEmail='agent@example.com'
      />
    )

    expect(screen.getAllByText('GCash Cash-in').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Maya Cash-out').length).toBeGreaterThan(0)
    expect(screen.getByText('TX100')).toBeInTheDocument()
    expect(screen.getByText('TX200')).toBeInTheDocument()

    // Transaction count
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders empty transactions state message when list is empty', () => {
    render(
      <DashboardTransactions
        transactions={[]}
        hasError={false}
        timeZone='Asia/Manila'
        selectedDate='2026-10-31'
        userEmail='agent@example.com'
      />
    )

    expect(screen.getByText(/no transactions recorded on this date/i)).toBeInTheDocument()
  })

  it('renders error alert when hasError is true', () => {
    render(
      <DashboardTransactions
        transactions={[]}
        hasError={true}
        timeZone='Asia/Manila'
        selectedDate='2026-10-31'
        userEmail='agent@example.com'
      />
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/transactions could not be loaded/i)).toBeInTheDocument()
  })

  it('shows skeleton loading state during asynchronous date changes', async () => {
    type TransactionsResult = Awaited<ReturnType<typeof dashboardActions.getTransactionsForDate>>
    let resolveAction!: (val: TransactionsResult) => void
    const actionPromise = new Promise<TransactionsResult>((resolve) => {
      resolveAction = resolve
    })

    vi.spyOn(dashboardActions, 'getTransactionsForDate').mockReturnValue(actionPromise)

    const { container } = render(
      <DashboardTransactions
        transactions={mockPayments}
        hasError={false}
        timeZone='Asia/Manila'
        selectedDate='2026-10-31'
        userEmail='agent@example.com'
      />
    )

    const dateInput = container.querySelector('#dashboard-date') as HTMLInputElement
    expect(dateInput).toBeInTheDocument()

    fireEvent.change(dateInput, { target: { value: '2026-10-30' } })

    // During async transition, verify skeleton blocks are displayed
    expect(container.querySelectorAll('.dashboard-skeleton-block').length).toBeGreaterThan(0)
    expect(container.querySelector('.transactions-loading-skeleton')).toBeInTheDocument()

    // Verify no spinners exist
    expect(container.querySelector('.spinner')).not.toBeInTheDocument()

    // Resolve async call
    resolveAction!({
      transactions: [],
      hasError: false,
    })

    await waitFor(() => {
      expect(container.querySelector('.transactions-loading-skeleton')).not.toBeInTheDocument()
    })
  })

  it('switches between table and cards view modes', () => {
    render(
      <DashboardTransactions
        transactions={mockPayments}
        hasError={false}
        timeZone='Asia/Manila'
        selectedDate='2026-10-31'
        userEmail='agent@example.com'
      />
    )

    // Switch to Card view
    const cardViewButton = screen.getByRole('button', { name: /card view/i })
    fireEvent.click(cardViewButton)
    expect(screen.getAllByRole('article').length).toBe(mockPayments.length)

    // Switch back to Table view
    const tableViewButton = screen.getByRole('button', { name: /table view/i })
    fireEvent.click(tableViewButton)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('filters by type and device and opens the payment type summary', () => {
    render(<DashboardTransactions transactions={mockPayments} hasError={false} timeZone='Asia/Manila' selectedDate='2026-10-31' userEmail='' />)

    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'GCash Cash-in' } })
    fireEvent.change(screen.getByLabelText('Device'), { target: { value: 'CP1' } })
    expect(screen.getByText('1', { selector: '.dashboard-count span' })).toBeInTheDocument()
    expect(screen.getByText('TX100')).toBeInTheDocument()
    expect(screen.queryByText('TX200')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /summary by payment type/i }))
    expect(screen.getByRole('heading', { name: 'Totals by payment type' })).toBeInTheDocument()
    expect(screen.getAllByText('GCash Cash-in').length).toBeGreaterThan(0)
  })

  it('shows the consolidated total and its formula in the payment summary', () => {
    render(<DashboardTransactions transactions={mockPayments} hasError={false} timeZone='Asia/Manila' selectedDate='2026-10-31' userEmail='' />)

    fireEvent.click(screen.getByRole('button', { name: /summary by payment type/i }))

    const total = screen.getByLabelText('Summary total')
    expect(within(total).getByText('Total')).toBeInTheDocument()
    expect(within(total).getByText('₱515.00')).toBeInTheDocument()
    expect(within(total).getByText('Formula: Cash-in and load + charges − cash-out')).toBeInTheDocument()
    expect(within(total).getByText('₱1,000.00 + ₱15.00 − ₱500.00')).toBeInTheDocument()
  })

  it('shows filter-specific empty state and supports card view', () => {
    render(<DashboardTransactions transactions={mockPayments} hasError={false} timeZone='Asia/Manila' selectedDate='2026-10-31' userEmail='' />)

    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'GCash Cash-in' } })
    fireEvent.change(screen.getByLabelText('Device'), { target: { value: 'CP2' } })
    expect(screen.getByText(/no transactions match these filters/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Type'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Device'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Card view' }))
    expect(screen.getAllByRole('article')).toHaveLength(mockPayments.length)
  })

  it('shows an error when an asynchronous date request rejects', async () => {
    vi.spyOn(dashboardActions, 'getTransactionsForDate').mockRejectedValue(new Error('network error'))
    const { container } = render(<DashboardTransactions transactions={mockPayments} hasError={false} timeZone='Asia/Manila' selectedDate='2026-10-31' userEmail='' />)

    fireEvent.change(container.querySelector('#dashboard-date') as HTMLInputElement, { target: { value: '2026-10-30' } })

    expect(await screen.findByRole('alert')).toHaveTextContent(/transactions could not be loaded/i)
  })
})
