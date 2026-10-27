'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { WalletCards } from 'lucide-react'

export default function BalanceRequiredDialog({
  open,
  hasError,
  onClose,
}: {
  open: boolean
  hasError: boolean
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const router = useRouter()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      className='type-summary-dialog balance-required-dialog'
      ref={dialogRef}
      aria-labelledby='balance-required-title'
      onClose={onClose}
    >
      <div className='balance-required-content'>
        <span className='new-transaction-icon'><WalletCards size={20} aria-hidden='true' /></span>
        <h2 id='balance-required-title'>Set today&apos;s balance first</h2>
        <p>
          {hasError
            ? 'Today’s balance could not be verified. Set the balance before adding a transaction.'
            : 'A balance must be set today before adding a transaction.'}
        </p>
        <div className='balance-required-actions'>
          <Link className='add-transaction-button' href='/balances/new'>
            Set balance
          </Link>
          <button
            className='balance-cancel-button'
            type='button'
            onClick={() => {
              dialogRef.current?.close()
              onClose()
              router.push('/dashboard')
            }}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </dialog>
  )
}