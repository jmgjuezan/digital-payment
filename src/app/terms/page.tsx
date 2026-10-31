import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Use | Digital Payment',
  description: 'Terms for using the Digital Payment record-keeping app.',
}

export default function TermsPage() {
  return (
    <main className='privacy-page'>
      <article className='privacy-document'>
        <Link className='privacy-back-link' href='/login'>Back to sign in</Link>
        <p className='privacy-eyebrow'>Digital Payment</p>
        <h1>Terms of Use</h1>
        <p className='privacy-updated'>Effective date: October 31, 2026</p>

        <p>
          These terms apply when you access or use Digital Payment. By using the app, you agree to follow these terms and applicable laws.
        </p>

        <h2>What the app does</h2>
        <p>
          Digital Payment is a record-keeping tool for payment activity and wallet or bank balances. It records information entered by users and displays summaries and calculations. It does not initiate, process, authorize, or settle payments, and its records are not a confirmation from a bank, wallet provider, or payment network.
        </p>

        <h2>Account access</h2>
        <p>
          Accounts are provided by the app administrator; public account registration is not offered in the app. You are responsible for protecting your sign-in credentials and for activity performed through your account. Notify the administrator who provided your account if you believe someone has accessed it without permission.
        </p>

        <h2>Acceptable use and records</h2>
        <ul>
          <li>Use the app only if you are authorized to access the account and records.</li>
          <li>Enter accurate information and correct discrepancies against the relevant bank, wallet, or payment provider.</li>
          <li>Do not use the app for unlawful activity, attempt to bypass access controls, or interfere with the service.</li>
          <li>Do not enter information about another person unless you have authority to do so.</li>
        </ul>

        <h2>Shared record access</h2>
        <p>
          Under the current database access policies, any authenticated user in this Supabase project can read all payment and balance records. Do not treat records as private to your individual account, and do not use the app for a deployment where that shared access is inappropriate.
        </p>

        <h2>Calculations and data availability</h2>
        <p>
          Dashboard totals and computed balances are provided for convenience and may depend on the records entered and the configured calculation rules. Check important amounts independently before relying on them. The app does not currently provide a self-service deletion or export feature. Records may be changed or removed by the project administrator.
        </p>

        <h2>Availability and changes</h2>
        <p>
          The app may be changed, suspended, or become unavailable while it is maintained or when its hosting or database services are unavailable. The administrator may update these terms when the service or its practices change. The effective date above will be updated when these terms are revised.
        </p>

        <h2>Third-party services and privacy</h2>
        <p>
          The app relies on Supabase for authentication and database services and Vercel for hosting. Their services are subject to their own terms. See our <Link href='/privacy'>Privacy Policy</Link> for information about data handled by the app.
        </p>

        <h2>Contact</h2>
        <p>
          For questions about these terms or your account, contact the administrator who provided your account access.
        </p>
      </article>
    </main>
  )
}
