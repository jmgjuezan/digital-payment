import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AuthForm from '@/components/auth/AuthForm'

export default async function LoginPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (supabaseUrl && supabasePublishableKey) {
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
    if (user) redirect('/dashboard')
  }

  return (
    <main className='login-shell'>
      <section className='brand-panel' aria-label='Digital Payment'>
        <div className='brand-mark'>
          <span className='brand-symbol' aria-hidden='true'>↗</span>
          <span>Digital Payment</span>
        </div>
        <div className='brand-copy'>
          <span className='brand-eyebrow'>Your money, in motion</span>
          <h1>Make every payment feel simple.</h1>
          <p>One clear view for the transfers and payments that keep your day moving.</p>
        </div>
        <div className='brand-foot'>
          <span>Digital payments, made clear.</span>
          <span>Secure access</span>
        </div>
      </section>
      <section className='login-panel' aria-labelledby='login-title'>
        <div className='login-content'>
          <span className='form-eyebrow'>Welcome back</span>
          <h2 id='login-title'>Sign in to Digital Payment</h2>
          <p className='login-subtitle'>Access your payment activity and pick up right where you left off.</p>
          <AuthForm supabaseUrl={supabaseUrl} supabasePublishableKey={supabasePublishableKey} />
          <p className='login-legal'>
            By continuing, you agree to our <a href='/terms'>Terms</a> and <a href='/privacy'>Privacy Policy</a>.
          </p>
        </div>
      </section>
    </main>
  )
}