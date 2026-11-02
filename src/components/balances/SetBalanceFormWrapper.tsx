'use client'

import { useCallback, useState } from 'react'
import SetBalanceForm from '@/components/balances/SetBalanceForm'
import AddBalanceFooter from '@/components/balances/AddBalanceFooter'

export default function SetBalanceFormWrapper({ returnDate }: { returnDate?: string }) {
  const [pending, setPending] = useState(false)
  const handleActionChange = useCallback((_: () => void, isPending: boolean) => {
    setPending(isPending)
  }, [])

  return (
    <>
      <SetBalanceForm onActionChange={handleActionChange} returnDate={returnDate} />
      <AddBalanceFooter pending={pending} returnDate={returnDate} />
    </>
  )
}
