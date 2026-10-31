'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, CalendarDays, Check, Copy, LayoutGrid, List, LogOut, ReceiptText, X } from 'lucide-react'
import { getTransactionsForDate } from '@/app/dashboard/actions'
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
  { value: 'device', label: 'Device' },
  { value: 'amount', label: 'Amount' },
  { value: 'charge', label: 'Charge' },
  { value: 'tran_id', label: 'Transaction ID' },
  { value: 'created_at', label: 'Created date/time' },
  { value: 'note', label: 'Note' },
]

const sortFields = paymentFields.filter(
  (field) => field.value !== 'note',
)
const cardFieldOrder: SortField[] = ['payment_date', 'date', 'amount', 'charge', 'device', 'tran_id', 'created_at', 'note']
const cardFields = paymentFields
  .filter((field) => field.value !== 'type')
  .sort((first, second) => cardFieldOrder.indexOf(first.value) - cardFieldOrder.indexOf(second.value))

const currency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
})

function TransactionsLoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'cards') {
    return (
      <div className='transactions-card-grid transactions-loading-skeleton' role='status' aria-label='Loading transactions'>
        {Array.from({ length: 6 }, (_, index) => (
          <div className='transaction-card' key={index} aria-hidden='true'>
            <span className='dashboard-skeleton-block transactions-loading-card-title' />
            <div className='transactions-loading-card-details'>
              {Array.from({ length: 6 }, (_, cell) => <span className='dashboard-skeleton-block' key={cell} />)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className='transactions-table-scroll transactions-loading-skeleton' role='status' aria-label='Loading transactions'>
      <table className='transactions-table' aria-hidden='true'>
        <thead>
          <tr>{paymentFields.map((field) => <th key={field.value}>{field.label}</th>)}</tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, row) => (
            <tr key={row}>
              {paymentFields.map((field) => (
                <td key={field.value}><span className='dashboard-skeleton-block transactions-loading-cell' /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

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
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
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

function getTodayInTimeZone(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${values.year}-${values.month}-${values.day}`
}

export default function DashboardTransactions({
  transactions: initialTransactions,
  hasError: initialHasError,
  timeZone,
  selectedDate: initialSelectedDate,
  userEmail,
}: {
  transactions: Payment[]
  hasError: boolean
  timeZone: string
  selectedDate: string
  userEmail: string
}) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [hasError, setHasError] = useState(initialHasError)
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate)
  const [isDateLoading, setIsDateLoading] = useState(false)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [typeFilter, setTypeFilter] = useState('')
  const [deviceFilter, setDeviceFilter] = useState('')
  const [totalCopyStatus, setTotalCopyStatus] = useState<'copied' | 'failed' | ''>('')
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false)
  const summaryDialogRef = useRef<HTMLDialogElement>(null)
  const dateRequestId = useRef(0)
  const today = getTodayInTimeZone(timeZone)

  useEffect(() => {
    if (!isSummaryDialogOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isSummaryDialogOpen])

  const paymentTypes = useMemo(
    () => [...new Set(transactions.map((payment) => payment.type).filter(Boolean))].sort((first, second) => first.localeCompare(second)),
    [transactions],
  )
  const devices = useMemo(
    () => [...new Set(transactions.map((payment) => payment.device).filter(Boolean))].sort((first, second) => first.localeCompare(second, undefined, { numeric: true })),
    [transactions],
  )
  const filteredTransactions = useMemo(
    () => transactions.filter((payment) => (!typeFilter || payment.type === typeFilter) && (!deviceFilter || payment.device === deviceFilter)),
    [transactions, typeFilter, deviceFilter],
  )

  async function handleDateChange(date: string) {
    if (!date || date > today || date === selectedDate) return

    setSelectedDate(date)
    setIsDateLoading(true)
    setHasError(false)
    setTypeFilter('')
    setDeviceFilter('')
    summaryDialogRef.current?.close()
    const requestId = ++dateRequestId.current
    window.history.replaceState(null, '', `/dashboard?date=${encodeURIComponent(date)}`)

    try {
      const result = await getTransactionsForDate(date)
      if (requestId !== dateRequestId.current) return

      setTransactions(result.transactions as Payment[])
      setHasError(result.hasError)
    } catch {
      if (requestId === dateRequestId.current) setHasError(true)
    } finally {
      if (requestId === dateRequestId.current) setIsDateLoading(false)
    }
  }

  const sortedTransactions = useMemo(
    () => [...filteredTransactions].sort((first, second) => comparePayments(first, second, sortField, sortDirection)),
    [filteredTransactions, sortField, sortDirection],
  )
  const totalAmount = filteredTransactions.reduce((total, payment) => total + Number(payment.amount || 0), 0)
  const totalCharges = filteredTransactions.reduce((total, payment) => total + Number(payment.charge || 0), 0)
  const totalsByType = useMemo(() => {
    const totals = new Map<string, { count: number; amount: number; charge: number }>()

    for (const payment of filteredTransactions) {
      const type = payment.type || 'Unspecified'
      const current = totals.get(type) ?? { count: 0, amount: 0, charge: 0 }
      totals.set(type, {
        count: current.count + 1,
        amount: current.amount + Number(payment.amount || 0),
        charge: current.charge + Number(payment.charge || 0),
      })
    }

    return [...totals.entries()].sort(([first], [second]) => first.localeCompare(second))
  }, [filteredTransactions])
  const consolidatedCashInLoad = filteredTransactions
    .filter((payment) => /cash-in|load/i.test(payment.type))
    .reduce((total, payment) => total + Number(payment.amount || 0), 0)
  const consolidatedCashOut = filteredTransactions
    .filter((payment) => /cash-out/i.test(payment.type))
    .reduce((total, payment) => total + Number(payment.amount || 0), 0)
  const consolidatedTotal = consolidatedCashInLoad + totalCharges - consolidatedCashOut

  async function copyConsolidatedTotal() {
    try {
      await navigator.clipboard.writeText(consolidatedTotal.toFixed(2))
      setTotalCopyStatus('copied')
    } catch {
      setTotalCopyStatus('failed')
    }
  }

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
            {isDateLoading ? (
              <span className='dashboard-skeleton-block transactions-loading-count' aria-label='Loading transaction count' />
            ) : (
              <>
                <span>{filteredTransactions.length}</span>
                <small>{filteredTransactions.length === 1 ? 'transaction' : 'transactions'}</small>
              </>
            )}
          </div>
        </div>

        <div className='dashboard-summary' aria-label='Today totals'>
          {isDateLoading ? (
            <>
              <div className='summary-item transactions-loading-summary-item'>
                <span className='dashboard-skeleton-block' />
                <span className='dashboard-skeleton-block' />
              </div>
              <div className='summary-divider' />
              <div className='summary-item transactions-loading-summary-item'>
                <span className='dashboard-skeleton-block' />
                <span className='dashboard-skeleton-block' />
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        <button
          className='type-summary-toggle'
          type='button'
          disabled={isDateLoading}
          onClick={() => {
            setTotalCopyStatus('')
            summaryDialogRef.current?.showModal()
            setIsSummaryDialogOpen(true)
          }}
        >
          <ReceiptText size={16} aria-hidden='true' />
          <span>Summary by payment type</span>
        </button>

        <dialog
          className='type-summary-dialog'
          ref={summaryDialogRef}
          aria-labelledby='payment-type-summary-title'
          onClose={() => setIsSummaryDialogOpen(false)}
        >
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
            <span>{filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}</span>
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
            <div className='type-summary-total' role='group' aria-label='Summary total'>
              <div>
                <span>Total</span>
                <div className='type-summary-total-value'>
                  <strong>{currency.format(consolidatedTotal)}</strong>
                  <button
                    className='type-summary-copy-button'
                    type='button'
                    aria-label={totalCopyStatus === 'copied' ? 'Total copied' : 'Copy total amount without peso sign or commas'}
                    title='Copy amount without peso sign or commas'
                    onClick={() => void copyConsolidatedTotal()}
                  >
                    {totalCopyStatus === 'copied' ? <Check size={16} aria-hidden='true' /> : <Copy size={16} aria-hidden='true' />}
                  </button>
                </div>
              </div>
              <span className='sr-only' role='status' aria-live='polite'>
                {totalCopyStatus === 'copied' ? 'Total amount copied.' : totalCopyStatus === 'failed' ? 'Could not copy total amount.' : ''}
              </span>
              <p>Formula: Cash-in and load + charges − cash-out</p>
              <small>
                {currency.format(consolidatedCashInLoad)} + {currency.format(totalCharges)} − {currency.format(consolidatedCashOut)}
              </small>
            </div>
          </div>
        </dialog>

        <div className='transaction-toolbar'>
          <div className='transaction-toolbar-title'>
            <ReceiptText size={18} aria-hidden='true' />
            <h2>Payment records</h2>
          </div>
          <div className='transaction-controls'>
            <div className='dashboard-date-filter'>
              <label htmlFor='dashboard-date'>Date</label>
              <input id='dashboard-date' type='date' name='date' max={today} value={selectedDate} onChange={(event) => void handleDateChange(event.target.value)} />
            </div>
            <label className='transaction-filter-control'>
              <span>Type</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} disabled={isDateLoading}>
                <option value=''>All types</option>
                {paymentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className='transaction-filter-control'>
              <span>Device</span>
              <select value={deviceFilter} onChange={(event) => setDeviceFilter(event.target.value)} disabled={isDateLoading}>
                <option value=''>All devices</option>
                {devices.map((device) => <option key={device} value={device}>{device}</option>)}
              </select>
            </label>
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

        {isDateLoading ? (
          <TransactionsLoadingSkeleton viewMode={viewMode} />
        ) : hasError ? (
          <div className='transactions-message' role='alert'>
            <strong>Transactions could not be loaded.</strong>
            <span>Check the payments table access policy and try again.</span>
          </div>
        ) : sortedTransactions.length === 0 ? (
          <div className='transactions-empty'>
            <span className='empty-icon'><ReceiptText size={22} aria-hidden='true' /></span>
            <strong>{typeFilter || deviceFilter ? 'No transactions match these filters' : 'No transactions recorded on this date'}</strong>
            <span>{typeFilter || deviceFilter ? 'Choose a different payment type or device.' : 'Payments recorded for this date will appear here.'}</span>
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
                </div>
                <dl className='transaction-details'>
                  {cardFields.map((field) => (
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
      <AppActionFooter current='transactions' userKey={userEmail} />
    </main>
  )
}
