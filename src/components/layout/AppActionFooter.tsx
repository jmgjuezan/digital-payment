'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, ReceiptText, WalletCards } from 'lucide-react'
import { checkTodayBalance } from '@/app/dashboard/actions'
import BalanceRequiredDialog from '@/components/transactions/BalanceRequiredDialog'

const daysWithBalance = new Set<string>()
const balanceCachePrefix = 'digital-payment:has-balance:'

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

function hasCachedBalance(cacheKey: string) {
  if (daysWithBalance.has(cacheKey)) return true

  try {
    return window.sessionStorage.getItem(`${balanceCachePrefix}${cacheKey}`) === 'true'
  } catch {
    return false
  }
}

function cacheBalance(cacheKey: string) {
  daysWithBalance.add(cacheKey)

  try {
    window.sessionStorage.setItem(`${balanceCachePrefix}${cacheKey}`, 'true')
  } catch {
    // Keep the in-memory cache if browser storage is unavailable.
  }
}

export default function AppActionFooter({
  current,
  userKey,
}: {
  current: 'transactions' | 'balances'
  userKey?: string
}) {
  const [isCheckingBalance, startBalanceCheck] = useTransition()
  const [showBalanceRequired, setShowBalanceRequired] = useState(false)
  const [balanceCheckError, setBalanceCheckError] = useState(false)
  const router = useRouter()

  function handleAddTransaction() {
    const cacheKey = `${userKey ?? 'user'}:${getTodayInPaymentTimeZone()}`
    if (hasCachedBalance(cacheKey)) {
      router.push('/transactions/new')
      return
    }

    startBalanceCheck(async () => {
      const result = await checkTodayBalance()
      if (result.hasBalance) {
        cacheBalance(cacheKey)
        router.push('/transactions/new')
        return
      }

      setBalanceCheckError(result.hasError)
      setShowBalanceRequired(true)
    })
  }

  return (
    <>
      <nav className='app-action-footer' aria-label='Primary actions'>
        <div className='app-action-footer-inner'>
          {current === 'transactions' && (
            <button
              className='add-transaction-button'
              type='button'
              onClick={handleAddTransaction}
              disabled={isCheckingBalance}
            >
              <Plus size={18} aria-hidden='true' />
              <span>{isCheckingBalance ? 'Checking…' : 'Add transaction'}</span>
            </button>
          )}
          {current === 'balances' && (
            <Link className='add-transaction-button' href='/balances/new'>
              <Plus size={18} aria-hidden='true' />
              <span>Add balance</span>
            </Link>
          )}
          {current === 'transactions' ? (
            <a
              className='set-balance-button'
              href='/balances'
            >
              <WalletCards size={18} aria-hidden='true' />
              <span>Balances</span>
            </a>
          ) : (
            <a
              className='set-balance-button'
              href='/dashboard'
            >
              <ReceiptText size={18} aria-hidden='true' />
              <span>Transactions</span>
            </a>
          )}
        </div>
      </nav>
      <BalanceRequiredDialog
        open={showBalanceRequired}
        hasError={balanceCheckError}
        onClose={() => setShowBalanceRequired(false)}
      />
    </>
  )
}
