import type { Metadata } from 'next'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import UpdatePasswordForm from '@/components/auth/UpdatePasswordForm'

export const metadata: Metadata = {
  title: 'Update password | Digital Payment',
}

export default async function UpdatePasswordPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabasePublishableKey) redirect('/login')

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Middleware refreshes cookies when server components cannot write them.
        }
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?error=recovery-link-invalid')

  return (
    <main className='login-shell'>
      <section className='brand-panel' aria-label='Digital Payment'>
        <div className='brand-mark'>
          <span className='brand-symbol' aria-hidden='true'>↗</span>
          <span>Digital Payment</span>
        </div>
        <div className='brand-copy'>
          <span className='brand-eyebrow'>Account security</span>
          <h1>Choose a new password.</h1>
          <p>Update your password to secure your account, then return to your payment activity.</p>
        </div>
        <div className='brand-foot'>
          <span>Digital payments, made clear.</span>
          <span>Secure access</span>
        </div>
      </section>
      <section className='login-panel' aria-labelledby='update-password-title'>
        <div className='login-content'>
          <span className='form-eyebrow'>Password reset</span>
          <h2 id='update-password-title'>Set a new password</h2>
          <p className='login-subtitle'>Choose a password you have not used on other sites.</p>
          <UpdatePasswordForm supabaseUrl={supabaseUrl} supabasePublishableKey={supabasePublishableKey} />
        </div>
      </section>
    </main>
  )
}
