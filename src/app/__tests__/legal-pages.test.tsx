import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrivacyPolicyPage from '@/app/privacy/page'
import TermsPage from '@/app/terms/page'

describe('public legal pages', () => {
  it('renders the privacy policy and its shared-record access disclosure', () => {
    render(<PrivacyPolicyPage />)

    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument()
    expect(screen.getByText(/any authenticated user in this Supabase project can currently read/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/login')
  })

  it('renders the terms of use and links to the privacy policy', () => {
    render(<TermsPage />)

    expect(screen.getByRole('heading', { name: 'Terms of Use' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
    expect(screen.getByText(/does not initiate, process, authorize, or settle payments/i)).toBeInTheDocument()
  })
})
