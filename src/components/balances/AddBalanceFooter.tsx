'use client'

import Link from 'next/link'

export default function AddBalanceFooter({
  pending,
  returnDate,
}: {
  pending: boolean
  returnDate?: string
}) {
  return (
    <nav className='app-action-footer' aria-label='Form actions'>
      <div className='app-action-footer-inner'>
        <Link className='set-balance-button' href={returnDate ? `/balances?date=${encodeURIComponent(returnDate)}` : '/balances'}>
          Cancel
        </Link>
        <button className='add-transaction-button' type='submit' form='balance-form' disabled={pending}>
          {pending ? 'Saving…' : 'Save balance'}
        </button>
      </div>
    </nav>
  )
}
