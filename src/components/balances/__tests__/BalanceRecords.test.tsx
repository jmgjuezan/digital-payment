import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BalanceRecords, { type Balance } from '@/components/balances/BalanceRecords'
import * as balanceActions from '@/app/balances/actions'

type BalancesResult = Awaited<ReturnType<typeof balanceActions.getBalancesForDate>>

const mockBalances: Balance[] = [
  {
    id: 1,
    created_at: '2026-10-31T00:00:00Z',
    type: 'GCash',
    device: 'CP1',
    date: '2026-10-31',
    amount: 25000,
  },
]

describe('BalanceRecords Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders balance list and summary metrics', () => {
    render(
      <BalanceRecords
        balances={mockBalances}
        payments={[]}
        hasError={false}
        hasPaymentError={false}
        selectedDate='2026-10-31'
      />
    )

    expect(screen.getAllByText('CP1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('GCash').length).toBeGreaterThan(0)
  })

  it('renders skeleton indicators during async date transitions', async () => {
    let resolveAction!: (val: BalancesResult) => void
    const actionPromise = new Promise<BalancesResult>((resolve) => {
      resolveAction = resolve
    })

    vi.spyOn(balanceActions, 'getBalancesForDate').mockReturnValue(actionPromise)

    const { container } = render(
      <BalanceRecords
        balances={mockBalances}
        payments={[]}
        hasError={false}
        hasPaymentError={false}
        selectedDate='2026-10-31'
      />
    )

    const dateInput = container.querySelector('#balances-date') as HTMLInputElement
    expect(dateInput).toBeInTheDocument()

    fireEvent.change(dateInput, { target: { value: '2026-10-30' } })

    // Verify skeleton placeholders are rendered
    expect(container.querySelectorAll('.dashboard-skeleton-block').length).toBeGreaterThan(0)

    // Verify no spinners
    expect(container.querySelector('.spinner')).not.toBeInTheDocument()

    // Resolve promise
    resolveAction({
      balances: [],
      payments: [],
      hasError: false,
      hasPaymentError: false,
    })

    await waitFor(() => {
      expect(container.querySelector('.transactions-loading-count')).not.toBeInTheDocument()
    })
  })

  it('displays error notice when balances cannot be loaded', () => {
    render(
      <BalanceRecords
        balances={[]}
        payments={[]}
        hasError={true}
        hasPaymentError={false}
        selectedDate='2026-10-31'
      />
    )

    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/balances could not be loaded/i).length).toBeGreaterThan(0)
  })

  it('renders computed activity in table view and reports payment activity errors', () => {
    render(
      <BalanceRecords
        balances={mockBalances}
        payments={[{ type: 'GCash Cash-in', device: 'CP1', amount: 100, date: '2026-10-31' }]}
        hasError={false}
        hasPaymentError
        selectedDate='2026-10-31'
      />
    )

    expect(screen.getByRole('status')).toHaveTextContent(/payment activity could not be loaded/i)
    fireEvent.click(screen.getByRole('button', { name: 'Table view' }))
    expect(screen.getAllByRole('table')).toHaveLength(2)
    expect(screen.getByText('Cash-in and load')).toBeInTheDocument()
  })

  it('shows the empty state when there are no balances', () => {
    render(<BalanceRecords balances={[]} payments={[]} hasError={false} hasPaymentError={false} selectedDate='2026-10-31' />)

    expect(screen.getByText('No balances to calculate')).toBeInTheDocument()
    expect(screen.getByText('No balances recorded for this date')).toBeInTheDocument()
  })

  it('marks both panels as failed when the date request rejects', async () => {
    vi.spyOn(balanceActions, 'getBalancesForDate').mockRejectedValue(new Error('network error'))
    const { container } = render(<BalanceRecords balances={mockBalances} payments={[]} hasError={false} hasPaymentError={false} selectedDate='2026-10-31' />)

    fireEvent.change(container.querySelector('#balances-date') as HTMLInputElement, { target: { value: '2026-10-30' } })

    expect(await screen.findAllByRole('alert')).toHaveLength(2)
  })

  it('ignores future dates and the currently selected date', () => {
    const getBalances = vi.spyOn(balanceActions, 'getBalancesForDate')
    const { container } = render(<BalanceRecords balances={mockBalances} payments={[]} hasError={false} hasPaymentError={false} selectedDate='2026-10-31' />)
    const dateInput = container.querySelector('#balances-date') as HTMLInputElement

    fireEvent.change(dateInput, { target: { value: '2026-10-31' } })
    fireEvent.change(dateInput, { target: { value: '2999-01-01' } })

    expect(getBalances).not.toHaveBeenCalled()
  })
})
