'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, ReceiptText, WalletCards } from 'lucide-react'
import { checkTodayBalance } from '@/app/dashboard/actions'
import BalanceRequiredDialog from '@/components/transactions/BalanceRequiredDialog'

const daysWithBalance = new Set<string>()
const balanceCachePrefix = 'digital-payment:has-balance:'

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

function getDateFromURL(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('date')
}

export default function AppActionFooter({
  current,
  userKey,
  canManageBalances = false,
  canAddTransactions = false,
  selectedDate,
  today,
}: {
  current: 'transactions' | 'balances'
  userKey?: string
  canManageBalances?: boolean
  canAddTransactions?: boolean
  selectedDate?: string
  today?: string
}) {
  const [isCheckingBalance, startBalanceCheck] = useTransition()
  const [showBalanceRequired, setShowBalanceRequired] = useState(false)
  const [balanceCheckError, setBalanceCheckError] = useState(false)
  const [currentDate, setCurrentDate] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
    setCurrentDate(getDateFromURL() || selectedDate || null)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    const handlePopState = () => setCurrentDate(getDateFromURL() || selectedDate || null)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isMounted, selectedDate])

  useEffect(() => {
    if (!isMounted) return
    setCurrentDate(getDateFromURL() || selectedDate || null)
  }, [selectedDate, isMounted])

  useEffect(() => {
    if (!isMounted) return
    const handleDateChange = (event: CustomEvent<{ date: string }>) => {
      setCurrentDate(event.detail.date)
    }
    window.addEventListener('datechange', handleDateChange as EventListener)
    return () => window.removeEventListener('datechange', handleDateChange as EventListener)
  }, [isMounted])

  function handleAddTransaction() {
    const date = currentDate || selectedDate || today
    const cacheKey = `${userKey ?? 'user'}:${today ?? date ?? ''}`
    if (hasCachedBalance(cacheKey)) {
      router.push(`/transactions/new${date ? `?date=${encodeURIComponent(date)}` : ''}`)
      return
    }

    startBalanceCheck(async () => {
      const result = await checkTodayBalance()
      if (result.hasBalance) {
        cacheBalance(cacheKey)
        router.push(`/transactions/new${date ? `?date=${encodeURIComponent(date)}` : ''}`)
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
          {current === 'transactions' && canAddTransactions && (
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
          {current === 'balances' && canManageBalances && (
            <Link
              className='add-transaction-button'
              href={currentDate ? `/balances/new?date=${encodeURIComponent(currentDate)}` : '/balances/new'}
            >
              <Plus size={18} aria-hidden='true' />
              <span>Add balance</span>
            </Link>
          )}
          {current === 'transactions' && canManageBalances && (
            <a
              className='set-balance-button'
              href={currentDate ? `/balances?date=${encodeURIComponent(currentDate)}` : '/balances'}
            >
              <WalletCards size={18} aria-hidden='true' />
              <span>Balances</span>
            </a>
          )}
          {current === 'balances' && (
            <a
              className='set-balance-button'
              href={currentDate ? `/dashboard?date=${encodeURIComponent(currentDate)}` : '/dashboard'}
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
        canManageBalances={canManageBalances}
        onClose={() => setShowBalanceRequired(false)}
      />
    </>
  )
}
