'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type UpdatePasswordFormProps = {
  supabaseUrl?: string
  supabasePublishableKey?: string
}

export default function UpdatePasswordForm({ supabaseUrl, supabasePublishableKey }: UpdatePasswordFormProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabasePublishableKey) return null
    return createBrowserClient(supabaseUrl, supabasePublishableKey)
  }, [supabaseUrl, supabasePublishableKey])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password.length < 12) {
      setError('Use at least 12 characters for your new password.')
      return
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }
    if (!supabase) {
      setError('Password reset is not configured.')
      return
    }

    setIsSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError('Could not update the password. Request a new reset link and try again.')
      setIsSaving(false)
      return
    }

    await supabase.auth.signOut()
    router.replace('/login?password-updated=true')
    router.refresh()
  }

  return (
    <form className='auth-password-form' onSubmit={(event) => void handleSubmit(event)}>
      <label className='form-field' htmlFor='new-password'>New password</label>
      <input
        id='new-password'
        name='new-password'
        type='password'
        autoComplete='new-password'
        minLength={12}
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <label className='form-field' htmlFor='confirm-password'>Confirm new password</label>
      <input
        id='confirm-password'
        name='confirm-password'
        type='password'
        autoComplete='new-password'
        minLength={12}
        required
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />
      {error && <p className='auth-form-error' role='alert'>{error}</p>}
      <button className='auth-submit-button' type='submit' disabled={isSaving}>
        {isSaving ? 'Updating password…' : 'Update password'}
      </button>
    </form>
  )
}
