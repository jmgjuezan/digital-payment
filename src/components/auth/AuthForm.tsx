'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createBrowserClient } from '@supabase/ssr'

type AuthFormProps = {
  supabaseUrl?: string
  supabasePublishableKey?: string
}

export default function AuthForm({ supabaseUrl, supabasePublishableKey }: AuthFormProps) {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [authFormKey, setAuthFormKey] = useState(0)
  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabasePublishableKey) return null
    return createBrowserClient(supabaseUrl, supabasePublishableKey)
  }, [supabaseUrl, supabasePublishableKey])

  useEffect(() => {
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event as string) === 'SIGNED_UP') {
        setAuthFormKey((key) => key + 1)
      }

      if (event === 'SIGNED_IN' && session) {
        setIsRedirecting(true)
        router.replace('/dashboard')
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  if (!supabaseUrl || !supabasePublishableKey) {
    return (
      <div className='auth-not-configured' role='status'>
        <strong>Sign-in is not configured yet</strong>
        Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to your local environment to enable authentication.
      </div>
    )
  }

  if (!supabase) return null

  if (isRedirecting) {
    return (
      <div className='auth-redirect-loading' role='status' aria-live='polite'>
        <span className='auth-loading-spinner' aria-hidden='true' />
        <strong>Signing you in</strong>
        <span>Opening your dashboard…</span>
      </div>
    )
  }

  return (
    <div className='auth-frame'>
      <Auth
        key={authFormKey}
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#1f6b4e',
                brandAccent: '#174f3a',
                inputBackground: '#ffffff',
                inputBorder: '#dce4dc',
                inputText: '#172c25',
              },
              radii: {
                borderRadiusButton: '6px',
                buttonBorderRadius: '6px',
                inputBorderRadius: '6px',
              },
            },
          },
        }}
        providers={[]}
        magicLink={false}
        showLinks={true}
        view='sign_in'
        redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`}
        onlyThirdPartyProviders={false}
        localization={{
          variables: {
            sign_in: {
              email_label: 'Email address',
              email_input_placeholder: 'Enter your email address',
              password_label: 'Password',
              password_input_placeholder: 'Enter your password',
              loading_button_label: 'Signing in…',
            },
            sign_up: {
              loading_button_label: 'Creating account…',
            },
            forgotten_password: {
              loading_button_label: 'Sending reset link…',
            },
          },
        }}
      />
    </div>
  )
}