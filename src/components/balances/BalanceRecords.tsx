'use client'

import { useMemo, useRef, useState } from 'react'
import { CalendarDays, LayoutGrid, List, WalletCards } from 'lucide-react'
import { getBalancesForDate } from '@/app/balances/actions'

export type Balance = {
  id: number
  created_at: string
  type: string
  device: string
  date: string
  amount: number
}

type BalancePayment = {
  type: string
  device: string
  amount: number
  date: string
}

type BalanceWithActivity = Balance & {
  cashIn: number
  cashOut: number
  computedAmount: number
}

type ViewMode = 'table' | 'cards'

const currency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
})

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

function BalanceDataSkeleton({ viewMode, columns }: { viewMode: ViewMode; columns: number }) {
  if (viewMode === 'cards') {
    return (
      <div className='transactions-card-grid transactions-loading-skeleton' role='status' aria-label='Loading balances'>
        {Array.from({ length: 6 }, (_, index) => (
          <div className='transaction-card' key={index} aria-hidden='true'>
            <span className='dashboard-skeleton-block transactions-loading-card-title' />
            <div className='transactions-loading-card-details'>
              {Array.from({ length: 4 }, (_, cell) => <span className='dashboard-skeleton-block' key={cell} />)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className='transactions-table-scroll transactions-loading-skeleton' role='status' aria-label='Loading balances'>
      <table className='transactions-table' aria-hidden='true'>
        <thead>
          <tr>{Array.from({ length: columns }, (_, index) => <th key={index}><span className='dashboard-skeleton-block transactions-loading-cell' /></th>)}</tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }, (_, cell) => <td key={cell}><span className='dashboard-skeleton-block transactions-loading-cell' /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function BalanceRecords({
  balances: initialBalances,
  payments: initialPayments,
  hasError: initialHasError,
  hasPaymentError: initialHasPaymentError,
  selectedDate: initialSelectedDate,
}: {
  balances: Balance[]
  payments: BalancePayment[]
  hasError: boolean
  hasPaymentError: boolean
  selectedDate: string
}) {
  const [balances, setBalances] = useState(initialBalances)
  const [payments, setPayments] = useState(initialPayments)
  const [hasError, setHasError] = useState(initialHasError)
  const [hasPaymentError, setHasPaymentError] = useState(initialHasPaymentError)
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate)
  const [isDateLoading, setIsDateLoading] = useState(false)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const dateRequestId = useRef(0)
  const today = getTodayInPaymentTimeZone()

  async function handleDateChange(date: string) {
    if (!date || date > today || date === selectedDate) return

    setSelectedDate(date)
    setIsDateLoading(true)
    setHasError(false)
    setHasPaymentError(false)
    const requestId = ++dateRequestId.current
    window.history.replaceState(null, '', `/balances?date=${encodeURIComponent(date)}`)

    try {
      const result = await getBalancesForDate(date)
      if (requestId !== dateRequestId.current) return

      setBalances(result.balances as Balance[])
      setPayments(result.payments as BalancePayment[])
      setHasError(result.hasError)
      setHasPaymentError(result.hasPaymentError)
    } catch {
      if (requestId === dateRequestId.current) {
        setHasError(true)
        setHasPaymentError(true)
      }
    } finally {
      if (requestId === dateRequestId.current) setIsDateLoading(false)
    }
  }

  const balancesWithActivity = useMemo<BalanceWithActivity[]>(() => balances.map((balance) => {
    const matchingPayments = payments.filter((payment) => payment.device === balance.device
      && payment.type.toLowerCase().startsWith(balance.type.toLowerCase())
      && payment.date >= balance.date)
    const cashIn = matchingPayments
      .filter((payment) => /cash-in|load/i.test(payment.type))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const cashOut = matchingPayments
      .filter((payment) => /cash-out/i.test(payment.type))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

    return {
      ...balance,
      cashIn,
      cashOut,
      computedAmount: Number(balance.amount) - cashIn + cashOut,
    }
  }), [balances, payments])
  const sortedBalances = useMemo(() => {
    return [...balancesWithActivity].sort((first, second) => {
      const byType = first.type.localeCompare(second.type)
      const byDevice = first.device.localeCompare(second.device, undefined, { numeric: true })
      const comparison = byType || byDevice
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [balancesWithActivity, sortDirection])
  const totalBalance = balances.reduce((sum, balance) => sum + Number(balance.amount || 0), 0)

  return (
    <>
      <div className='dashboard-heading-row'>
        <div>
          <p className='dashboard-eyebrow'>Account records</p>
          <h1 id='balances-title'>Balances</h1>
          <p className='dashboard-date'><CalendarDays size={16} aria-hidden='true' />Balances recorded for {selectedDate}</p>
        </div>
        <div className='dashboard-count' aria-live='polite'>
          {isDateLoading ? <span className='dashboard-skeleton-block transactions-loading-count' aria-label='Loading balance count' /> : (
            <>
              <span>{balances.length}</span>
              <small>{balances.length === 1 ? 'balance' : 'balances'}</small>
            </>
          )}
        </div>
      </div>
      <div className='dashboard-summary' aria-label='Balance total'>
        <div className='summary-item'>
          <span className='summary-label'>Total balance</span>
          {isDateLoading ? <span className='dashboard-skeleton-block transactions-loading-total' /> : <strong>{currency.format(totalBalance)}</strong>}
        </div>
        <div className='summary-note'>Across balances recorded for this date</div>
      </div>
      <section className='computed-balances-section' aria-labelledby='computed-balances-title'>
        <div className='balances-toolbar'>
          <div>
            <h2 id='computed-balances-title'>Computed balances</h2>
            <p>Starting balance minus cash-ins and loads, plus cash-outs, through today.</p>
          </div>
        </div>
        {hasPaymentError && (
          <p className='computed-balance-warning' role='status'>Payment activity could not be loaded, so computed balances may be incomplete.</p>
        )}
        {isDateLoading ? (
          <BalanceDataSkeleton viewMode={viewMode} columns={6} />
        ) : hasError ? (
          <div className='transactions-message' role='alert'>
            <strong>Balances could not be loaded.</strong>
            <span>Check the balances table access policy and try again.</span>
          </div>
        ) : balancesWithActivity.length === 0 ? (
          <div className='transactions-empty'>
            <strong>No balances to calculate</strong>
            <span>Set a balance to see the computed amount.</span>
          </div>
        ) : viewMode === 'table' ? (
          <div className='transactions-table-scroll'>
            <table className='transactions-table'>
              <thead>
                <tr>
                  <th scope='col'>Starting balance</th>
                  <th scope='col'>Cash-in and load</th>
                  <th scope='col'>Cash-out</th>
                  <th scope='col'>Type</th>
                  <th scope='col'>Device</th>
                  <th scope='col'>Computed balance</th>
                </tr>
              </thead>
              <tbody>
                {sortedBalances.map((balance) => (
                  <tr key={`computed-${balance.id}`}>
                    <td>{currency.format(Number(balance.amount))}</td>
                    <td>{currency.format(balance.cashIn)}</td>
                    <td>{currency.format(balance.cashOut)}</td>
                    <td>{balance.type}</td>
                    <td>{balance.device}</td>
                    <td className='amount-cell'>{currency.format(balance.computedAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='transactions-card-grid'>
            {sortedBalances.map((balance) => (
              <article className='transaction-card' key={`computed-${balance.id}`}>
                <div className='transaction-card-top'>
                  <div>
                    <span className='transaction-type'>{balance.type}</span>
                    <span className='transaction-device'>{balance.device}</span>
                  </div>
                  <strong className='transaction-amount'>{currency.format(balance.computedAmount)}</strong>
                </div>
                <dl className='transaction-details'>
                  <div className='transaction-detail'>
                    <dt>Starting balance</dt>
                    <dd>{currency.format(Number(balance.amount))}</dd>
                  </div>
                  <div className='transaction-detail'>
                    <dt>Cash-in and load</dt>
                    <dd>{currency.format(balance.cashIn)}</dd>
                  </div>
                  <div className='transaction-detail'>
                    <dt>Cash-out</dt>
                    <dd>{currency.format(balance.cashOut)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
      <div className='balances-toolbar'>
        <div className='transaction-toolbar-title'>
          <WalletCards size={18} aria-hidden='true' />
          <h2>Balance records</h2>
        </div>
        <div className='transaction-controls'>
          <div className='dashboard-date-filter'>
            <label htmlFor='balances-date'>Date</label>
            <input id='balances-date' type='date' name='date' max={today} value={selectedDate} onChange={(event) => void handleDateChange(event.target.value)} />
          </div>
          <label className='sort-control'>
            <span>Sort by type and device</span>
            <select value={sortDirection} onChange={(event) => setSortDirection(event.target.value as 'asc' | 'desc')}>
              <option value='asc'>A to Z</option>
              <option value='desc'>Z to A</option>
            </select>
          </label>
          <div className='view-toggle' role='group' aria-label='Balance display mode'>
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
        <BalanceDataSkeleton viewMode={viewMode} columns={3} />
      ) : hasError ? (
        <div className='transactions-message' role='alert'>
          <strong>Balances could not be loaded.</strong>
          <span>Check the balances table access policy and try again.</span>
        </div>
      ) : balances.length === 0 ? (
        <div className='transactions-empty'>
          <strong>No balances recorded for this date</strong>
          <span>Saved balances will appear here.</span>
        </div>
      ) : viewMode === 'table' ? (
        <div className='transactions-table-scroll'>
          <table className='transactions-table'>
            <thead>
              <tr>
                <th scope='col'>Device</th>
                <th scope='col'>Balance type</th>
                <th scope='col'>Amount</th>
              </tr>
            </thead>
            <tbody>
              {sortedBalances.map((balance) => (
                <tr key={balance.id}>
                  <td>{balance.device}</td>
                  <td>{balance.type}</td>
                  <td className='amount-cell'>{currency.format(Number(balance.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className='transactions-card-grid'>
          {sortedBalances.map((balance) => (
            <article className='transaction-card' key={balance.id}>
              <div className='transaction-card-top'>
                <div>
                  <span className='transaction-type'>{balance.type}</span>
                  <span className='transaction-device'>{balance.device}</span>
                </div>
                <strong className='transaction-amount'>{currency.format(Number(balance.amount))}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
