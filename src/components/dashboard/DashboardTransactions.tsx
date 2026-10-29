'use client'

import { useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, CalendarDays, LayoutGrid, List, LogOut, ReceiptText, X } from 'lucide-react'
import AppActionFooter from '@/components/layout/AppActionFooter'

export type Payment = {
  id: number
  created_at: string
  type: string
  tran_id: string | null
  payment_date: string
  date: string | null
  charge: number
  amount: number
  device: string
  note: string | null
}

type SortField = keyof Payment
type SortDirection = 'asc' | 'desc'
type ViewMode = 'table' | 'cards'

const paymentFields: { value: SortField; label: string }[] = [
  { value: 'payment_date', label: 'Payment date' },
  { value: 'date', label: 'Payment time' },
  { value: 'type', label: 'Type' },
  { value: 'tran_id', label: 'Transaction ID' },
  { value: 'charge', label: 'Charge' },
  { value: 'amount', label: 'Amount' },
  { value: 'device', label: 'Device' },
  { value: 'created_at', label: 'Created date' },
  { value: 'note', label: 'Note' },
]

const sortFields = paymentFields.filter(
  (field) => field.value !== 'note',
)

const currency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
})

function displayValue(field: SortField, payment: Payment, timeZone: string) {
  const value = payment[field]

  if (value === null || value === '') return '—'
  if (field === 'amount' || field === 'charge') return currency.format(Number(value))
  if (field === 'created_at') {
    return new Intl.DateTimeFormat('en-PH', {
      timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(String(value)))
  }
  if (field === 'date') {
    const [hours, minutes, seconds = 0] = String(value).split(':').map(Number)
    const paymentTime = new Date(2000, 0, 1, hours, minutes, seconds)

    return new Intl.DateTimeFormat('en-PH', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(paymentTime)
  }

  return String(value)
}

function comparePayments(first: Payment, second: Payment, field: SortField, direction: SortDirection) {
  const firstValue = first[field]
  const secondValue = second[field]

  if (firstValue === null || firstValue === '') return secondValue === null || secondValue === '' ? 0 : 1
  if (secondValue === null || secondValue === '') return -1

  const comparison = typeof firstValue === 'number' && typeof secondValue === 'number'
    ? firstValue - secondValue
    : String(firstValue).localeCompare(String(secondValue), undefined, { numeric: true, sensitivity: 'base' })

  return direction === 'asc' ? comparison : -comparison
}

function formatSelectedDate(date: string, timeZone: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('en-PH', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)))
}

export default function DashboardTransactions({
  transactions,
  hasError,
  timeZone,
  selectedDate,
  userEmail,
}: {
  transactions: Payment[]
  hasError: boolean
  timeZone: string
  selectedDate: string
  userEmail: string
}) {
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const summaryDialogRef = useRef<HTMLDialogElement>(null)

  const sortedTransactions = useMemo(
    () => [...transactions].sort((first, second) => comparePayments(first, second, sortField, sortDirection)),
    [transactions, sortField, sortDirection],
  )
  const totalAmount = transactions.reduce((total, payment) => total + Number(payment.amount || 0), 0)
  const totalCharges = transactions.reduce((total, payment) => total + Number(payment.charge || 0), 0)
  const totalsByType = useMemo(() => {
    const totals = new Map<string, { count: number; amount: number; charge: number }>()

    for (const payment of transactions) {
      const type = payment.type || 'Unspecified'
      const current = totals.get(type) ?? { count: 0, amount: 0, charge: 0 }
      totals.set(type, {
        count: current.count + 1,
        amount: current.amount + Number(payment.amount || 0),
        charge: current.charge + Number(payment.charge || 0),
      })
    }

    return [...totals.entries()].sort(([first], [second]) => first.localeCompare(second))
  }, [transactions])
  const consolidatedCashInLoad = transactions
    .filter((payment) => /cash-in|load/i.test(payment.type))
    .reduce((total, payment) => total + Number(payment.amount || 0), 0)
  const consolidatedCashOut = transactions
    .filter((payment) => /cash-out/i.test(payment.type))
    .reduce((total, payment) => total + Number(payment.amount || 0), 0)

  return (
    <main className='dashboard-shell has-action-footer'>
      <header className='dashboard-header'>
        <a className='dashboard-brand' href='/dashboard' aria-label='Digital Payment dashboard'>
          <span className='dashboard-brand-mark' aria-hidden='true'>↗</span>
          <span>Digital Payment</span>
        </a>
        <div className='dashboard-header-actions'>
          {userEmail && <span className='dashboard-user-email' title={userEmail}>{userEmail}</span>}
          <form action='/auth/signout' method='post'>
            <button className='dashboard-logout' type='submit'>
              <LogOut size={15} aria-hidden='true' />
              <span>Log out</span>
            </button>
          </form>
        </div>
      </header>

      <section className='dashboard-content' aria-labelledby='dashboard-title'>
        <div className='dashboard-heading-row'>
          <div>
            <p className='dashboard-eyebrow'>Daily activity</p>
            <h1 id='dashboard-title'>Transactions</h1>
            <p className='dashboard-date'><CalendarDays size={16} aria-hidden='true' />{formatSelectedDate(selectedDate, timeZone)}</p>
          </div>
          <div className='dashboard-count' aria-live='polite'>
            <span>{transactions.length}</span>
            <small>{transactions.length === 1 ? 'transaction' : 'transactions'}</small>
          </div>
        </div>

        <div className='dashboard-summary' aria-label='Today totals'>
          <div className='summary-item'>
            <span className='summary-label'>Total amount</span>
            <strong>{currency.format(totalAmount)}</strong>
          </div>
          <div className='summary-divider' />
          <div className='summary-item'>
            <span className='summary-label'>Total charges</span>
            <strong>{currency.format(totalCharges)}</strong>
          </div>
          <div className='summary-note'>Across payments on this date</div>
        </div>

        <button
          className='type-summary-toggle'
          type='button'
          onClick={() => summaryDialogRef.current?.showModal()}
        >
          <ReceiptText size={16} aria-hidden='true' />
          <span>Summary by payment type</span>
        </button>

        <dialog className='type-summary-dialog' ref={summaryDialogRef} aria-labelledby='payment-type-summary-title'>
          <div className='type-summary-dialog-header'>
            <div>
              <p className='dashboard-eyebrow'>Payment summary</p>
              <h2 id='payment-type-summary-title'>Totals by payment type</h2>
              <p>{formatSelectedDate(selectedDate, timeZone)}</p>
            </div>
            <button
              className='type-summary-close'
              type='button'
              aria-label='Close payment summary'
              onClick={() => summaryDialogRef.current?.close()}
            >
              <X size={18} />
            </button>
          </div>
          {totalsByType.length === 0 ? (
            <p className='type-summary-empty'>No payment types for this date.</p>
          ) : (
            <div className='type-summary-panel'>
              <table className='type-summary-table'>
                <thead>
                  <tr>
                    <th scope='col'>Payment type</th>
                    <th scope='col'>Transactions</th>
                    <th scope='col'>Total amount</th>
                    <th scope='col'>Total charges</th>
                  </tr>
                </thead>
                <tbody>
                  {totalsByType.map(([type, totals]) => (
                    <tr key={type}>
                      <th scope='row'>{type}</th>
                      <td>{totals.count}</td>
                      <td>{currency.format(totals.amount)}</td>
                      <td>{currency.format(totals.charge)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className='type-summary-dialog-footer'>
            <span>{transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}</span>
            <div className='type-summary-footer-totals'>
              <span>Amount <strong>{currency.format(totalAmount)}</strong></span>
              <span>Charges <strong>{currency.format(totalCharges)}</strong></span>
            </div>
            <div className='type-summary-consolidated'>
              <div>
                <span>Cash-in and load</span>
                <strong>{currency.format(consolidatedCashInLoad)}</strong>
              </div>
              <div>
                <span>Cash-out</span>
                <strong>{currency.format(consolidatedCashOut)}</strong>
              </div>
            </div>
          </div>
        </dialog>

        <div className='transaction-toolbar'>
          <div className='transaction-toolbar-title'>
            <ReceiptText size={18} aria-hidden='true' />
            <h2>Payment records</h2>
          </div>
          <div className='transaction-controls'>
            <form className='dashboard-date-filter' action='/dashboard' method='get'>
              <label htmlFor='dashboard-date'>Date</label>
              <input id='dashboard-date' type='date' name='date' value={selectedDate} onChange={(event) => event.currentTarget.form?.requestSubmit()} />
            </form>
            <label className='sort-control'>
              <span>Sort by</span>
              <select value={sortField} onChange={(event) => setSortField(event.target.value as SortField)}>
                {sortFields.map((field) => <option key={field.value} value={field.value}>{field.label}</option>)}
              </select>
            </label>
            <button
              className='icon-control'
              type='button'
              aria-label={`Sort ${sortDirection === 'desc' ? 'ascending' : 'descending'}`}
              title={`Sort ${sortDirection === 'desc' ? 'ascending' : 'descending'}`}
              onClick={() => setSortDirection((direction) => direction === 'desc' ? 'asc' : 'desc')}
            >
              {sortDirection === 'desc' ? <ArrowDown size={17} /> : <ArrowUp size={17} />}
            </button>
            <div className='view-toggle' role='group' aria-label='Transaction display mode'>
              <button
                type='button'
                className={viewMode === 'table' ? 'view-toggle-button is-active' : 'view-toggle-button'}
                aria-label='Table view'
                aria-pressed={viewMode === 'table'}
                onClick={() => setViewMode('table')}
              >
                <List size={17} />
              </button>
              <button
                type='button'
                className={viewMode === 'cards' ? 'view-toggle-button is-active' : 'view-toggle-button'}
                aria-label='Card view'
                aria-pressed={viewMode === 'cards'}
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid size={17} />
              </button>
            </div>
          </div>
        </div>

        {hasError ? (
          <div className='transactions-message' role='alert'>
            <strong>Transactions could not be loaded.</strong>
            <span>Check the payments table access policy and try again.</span>
          </div>
        ) : sortedTransactions.length === 0 ? (
          <div className='transactions-empty'>
            <span className='empty-icon'><ReceiptText size={22} aria-hidden='true' /></span>
            <strong>No transactions recorded on this date</strong>
            <span>Payments recorded for this date will appear here.</span>
          </div>
        ) : viewMode === 'table' ? (
          <div className='transactions-table-scroll'>
            <table className='transactions-table'>
              <thead>
                <tr>
                  {paymentFields.map((field) => <th key={field.value} scope='col'>{field.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((payment) => (
                  <tr key={payment.id}>
                    {paymentFields.map((field) => (
                      <td key={field.value} className={field.value === 'amount' ? 'amount-cell' : undefined}>
                        {displayValue(field.value, payment, timeZone)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='transactions-card-grid'>
            {sortedTransactions.map((payment) => (
              <article className='transaction-card' key={payment.id}>
                <div className='transaction-card-top'>
                  <div>
                    <span className='transaction-type'>{payment.type || 'Payment'}</span>
                  </div>
                  <strong className='transaction-amount'>{currency.format(Number(payment.amount || 0))}</strong>
                </div>
                <dl className='transaction-details'>
                  {paymentFields.filter((field) => field.value !== 'type' && field.value !== 'amount').map((field) => (
                    <div className='transaction-detail' key={field.value}>
                      <dt>{field.label}</dt>
                      <dd>{displayValue(field.value, payment, timeZone)}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
      <AppActionFooter current='transactions' />
    </main>
  )
}