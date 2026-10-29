'use client'

import { useState } from 'react'
import SetBalanceForm from '@/components/balances/SetBalanceForm'
import AddBalanceFooter from '@/components/balances/AddBalanceFooter'

export default function SetBalanceFormWrapper() {
  const [pending, setPending] = useState(false)

  return (
    <>
      <SetBalanceForm onActionChange={(_, p) => setPending(p)} />
      <AddBalanceFooter pending={pending} />
    </>
  )
}
