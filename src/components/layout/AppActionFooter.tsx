'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, ReceiptText, WalletCards } from 'lucide-react'
import { checkTodayBalance } from '@/app/dashboard/actions'
import BalanceRequiredDialog from '@/components/transactions/BalanceRequiredDialog'

export default function AppActionFooter({
  current,
}: {
  current: 'transactions' | 'balances'
}) {
  const [isCheckingBalance, startBalanceCheck] = useTransition()
  const [showBalanceRequired, setShowBalanceRequired] = useState(false)
  const [balanceCheckError, setBalanceCheckError] = useState(false)
  const router = useRouter()

  function handleAddTransaction() {
    startBalanceCheck(async () => {
      const result = await checkTodayBalance()
      if (result.hasBalance) {
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
