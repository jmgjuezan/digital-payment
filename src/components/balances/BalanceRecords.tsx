'use client'

import { useMemo, useState } from 'react'

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

const currency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
})

export default function BalanceRecords({
  balances,
  payments,
  hasError,
  hasPaymentError,
}: {
  balances: Balance[]
  payments: BalancePayment[]
  hasError: boolean
  hasPaymentError: boolean
}) {
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
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
  const totalComputedBalance = balancesWithActivity.reduce((sum, balance) => sum + balance.computedAmount, 0)

  if (hasError) {
    return (
      <div className='transactions-message' role='alert'>
        <strong>Balances could not be loaded.</strong>
        <span>Check the balances table access policy and try again.</span>
      </div>
    )
  }

  if (balances.length === 0) {
    return (
      <div className='transactions-empty'>
        <strong>No balances recorded for this date</strong>
        <span>Saved balances will appear here.</span>
      </div>
    )
  }

  return (
    <>
      <div className='dashboard-summary' aria-label='Balance total'>
        <div className='summary-item'>
          <span className='summary-label'>Total balance</span>
          <strong>{currency.format(totalBalance)}</strong>
        </div>
        <div className='summary-note'>Across balances recorded for this date</div>
      </div>
      <section className='computed-balances-section' aria-labelledby='computed-balances-title'>
        <div className='balances-toolbar'>
          <div>
            <h2 id='computed-balances-title'>Computed balances</h2>
            <p>Starting balance minus cash-ins and loads, plus cash-outs, through today.</p>
          </div>
          <strong className='computed-balance-total'>{currency.format(totalComputedBalance)}</strong>
        </div>
        {hasPaymentError && (
          <p className='computed-balance-warning' role='status'>Payment activity could not be loaded, so computed balances may be incomplete.</p>
        )}
        {balancesWithActivity.length === 0 ? (
          <div className='transactions-empty'>
            <strong>No balances to calculate</strong>
            <span>Set a balance to see the computed amount.</span>
          </div>
        ) : <div className='transactions-table-scroll'>
          <table className='transactions-table'>
            <thead>
              <tr>
                <th scope='col'>Type</th>
                <th scope='col'>Device</th>
                <th scope='col'>Starting balance</th>
                <th scope='col'>Cash-in and load</th>
                <th scope='col'>Cash-out</th>
                <th scope='col'>Computed balance</th>
              </tr>
            </thead>
            <tbody>
              {sortedBalances.map((balance) => (
                <tr key={`computed-${balance.id}`}>
                  <td>{balance.type}</td>
                  <td>{balance.device}</td>
                  <td>{currency.format(Number(balance.amount))}</td>
                  <td>{currency.format(balance.cashIn)}</td>
                  <td>{currency.format(balance.cashOut)}</td>
                  <td className='amount-cell'>{currency.format(balance.computedAmount)}</td>
                </tr>
              ))}
              <tr className='computed-balance-total-row'>
                <th scope='row' colSpan={5}>Total computed balance</th>
                <td>{currency.format(totalComputedBalance)}</td>
              </tr>
            </tbody>
          </table>
        </div>}
      </section>
      <div className='balances-toolbar'>
        <h2>Balance records</h2>
        <label className='sort-control'>
          <span>Sort by type and device</span>
          <select value={sortDirection} onChange={(event) => setSortDirection(event.target.value as 'asc' | 'desc')}>
            <option value='asc'>A to Z</option>
            <option value='desc'>Z to A</option>
          </select>
        </label>
      </div>
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
    </>
  )
}