import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SetBalanceFormWrapper from '@/components/balances/SetBalanceFormWrapper'

vi.mock('@/app/balances/new/actions', () => ({
  saveBalance: vi.fn(),
}))

describe('SetBalanceFormWrapper Component', () => {
  it('renders the balance form and footer together', () => {
    render(<SetBalanceFormWrapper />)

    // Form field from SetBalanceForm
    expect(screen.getByLabelText(/balance type/i)).toBeInTheDocument()
    // Footer from AddBalanceFooter
    expect(screen.getByRole('button', { name: /save balance/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /cancel/i })).toBeInTheDocument()
  })

  it('shows idle Save balance button initially (not pending)', () => {
    render(<SetBalanceFormWrapper />)

    const btn = screen.getByRole('button', { name: /save balance/i })
    expect(btn).not.toBeDisabled()
  })
})
