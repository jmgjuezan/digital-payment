import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ReceiptText } from 'lucide-react'
import NewTransactionForm from '@/components/transactions/NewTransactionForm'

export const metadata: Metadata = {
  title: 'Add transaction | Digital Payment',
}

export default function NewTransactionPage() {
  return (
    <main className='dashboard-shell'>
      <header className='dashboard-header'>
        <a className='dashboard-brand' href='/dashboard' aria-label='Digital Payment dashboard'>
          <span className='dashboard-brand-mark' aria-hidden='true'>↗</span>
          <span>Digital Payment</span>
        </a>
        <Link className='transaction-back-link' href='/dashboard'>
          <ArrowLeft size={16} aria-hidden='true' />
          <span>Back to dashboard</span>
        </Link>
      </header>

      <section className='new-transaction-content' aria-labelledby='new-transaction-title'>
        <div className='new-transaction-heading'>
          <span className='new-transaction-icon'><ReceiptText size={19} aria-hidden='true' /></span>
          <div>
            <p className='dashboard-eyebrow'>Payment records</p>
            <h1 id='new-transaction-title'>Add transaction</h1>
            <p>Enter the details for this payment.</p>
          </div>
        </div>
        <NewTransactionForm />
      </section>
    </main>
  )
}