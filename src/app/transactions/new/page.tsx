import type { Metadata } from 'next'
import { Suspense } from 'react'
import NewTransactionPageContent from '@/components/transactions/NewTransactionPageContent'
import NewTransactionPageSkeleton from '@/components/transactions/NewTransactionPageSkeleton'

export const metadata: Metadata = {
  title: 'Add transaction | Digital Payment',
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<NewTransactionPageSkeleton />}>
      <NewTransactionPageContent />
    </Suspense>
  )
}
