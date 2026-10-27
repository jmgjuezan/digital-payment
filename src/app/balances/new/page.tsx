import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, WalletCards } from 'lucide-react'
import SetBalanceForm from '@/components/balances/SetBalanceForm'

export const metadata: Metadata = {
  title: 'Set balance | Digital Payment',
}

export default function NewBalancePage() {
  return (
    <main className='dashboard-shell'>
      <header className='dashboard-header'>
        <a className='dashboard-brand' href='/dashboard' aria-label='Digital Payment dashboard'>
          <span className='dashboard-brand-mark' aria-hidden='true'>↗</span>
          <span>Digital Payment</span>
        </a>
        <Link className='transaction-back-link' href='/balances'>
          <ArrowLeft size={16} aria-hidden='true' />
          <span>Back to balances</span>
        </Link>
      </header>

      <section className='new-transaction-content' aria-labelledby='set-balance-title'>
        <div className='new-transaction-heading'>
          <span className='new-transaction-icon'><WalletCards size={19} aria-hidden='true' /></span>
          <div>
            <p className='dashboard-eyebrow'>Account records</p>
            <h1 id='set-balance-title'>Set balance</h1>
            <p>Record a GCash or Maya balance for a device today.</p>
          </div>
        </div>
        <SetBalanceForm />
      </section>
    </main>
  )
}