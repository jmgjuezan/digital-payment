import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Digital Payment',
  description: 'Learn what information Digital Payment stores and how it is used.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className='privacy-page'>
      <article className='privacy-document'>
        <Link className='privacy-back-link' href='/login'>Back to sign in</Link>
        <p className='privacy-eyebrow'>Digital Payment</p>
        <h1>Privacy Policy</h1>
        <p className='privacy-updated'>Effective date: October 31, 2026</p>

        <p>
          This policy explains what information is handled when you use Digital Payment, a tool for recording and reviewing payment and balance activity.
        </p>

        <h2>Information handled by the app</h2>
        <ul>
          <li><strong>Account information:</strong> your email address and account identifier. Supabase Auth handles password authentication; Digital Payment does not receive or store your plain-text password.</li>
          <li><strong>Payment records:</strong> payment type, transaction ID when provided, payment date and time, amount, charge, device, and optional note.</li>
          <li><strong>Balance records:</strong> balance type, device, date, and amount.</li>
          <li><strong>Session information:</strong> authentication cookies and session data needed to keep you signed in and protect account pages.</li>
        </ul>

        <h2>How information is used</h2>
        <p>
          The app uses this information to authenticate users, save and display payment and balance records, calculate dashboard totals, and protect access to app features.
        </p>

        <h2>Who can access records</h2>
        <p>
          Any authenticated user in this Supabase project can currently read the project&apos;s payment and balance records. Records are not isolated by user in the current database access policies. Only use this deployment with data and users appropriate for that shared access model.
        </p>

        <h2>Service providers</h2>
        <p>
          Supabase provides authentication and database services, and Vercel hosts the app. These providers process information as needed to provide their services and under their own terms and privacy notices:
        </p>
        <ul>
          <li><a href='https://supabase.com/privacy' rel='noreferrer' target='_blank'>Supabase Privacy Policy</a></li>
          <li><a href='https://vercel.com/legal/privacy-notice' rel='noreferrer' target='_blank'>Vercel Privacy Notice</a></li>
        </ul>
        <p>The app does not currently include a dedicated advertising or analytics integration.</p>

        <h2>Retention and security</h2>
        <p>
          Records remain in the project database until the project administrator removes them or applies the project&apos;s data-retention settings. The app does not currently provide a self-service record deletion feature. Sign-in and database access controls help protect the service, but no internet service can guarantee absolute security.
        </p>

        <h2>Your choices and requests</h2>
        <p>
          You may ask the administrator who issued your account to help access, correct, or remove information associated with your account. Rights and procedures depend on applicable privacy law. For information about data-subject rights in the Philippines, see the <a href='https://privacy.gov.ph/data-subject-rights/' rel='noreferrer' target='_blank'>National Privacy Commission guidance</a>.
        </p>

        <h2>Contact and updates</h2>
        <p>
          For privacy questions or requests, contact the administrator who provided your account access. This policy may be updated when the app&apos;s data practices change; the effective date above will be revised when that happens.
        </p>
      </article>
    </main>
  )
}
