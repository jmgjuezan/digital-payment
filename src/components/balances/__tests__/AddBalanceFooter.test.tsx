import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AddBalanceFooter from '@/components/balances/AddBalanceFooter'

describe('AddBalanceFooter Component', () => {
  it('renders Cancel link pointing to /balances', () => {
    render(<AddBalanceFooter pending={false} />)

    const cancelLink = screen.getByRole('link', { name: /cancel/i })
    expect(cancelLink).toBeInTheDocument()
    expect(cancelLink).toHaveAttribute('href', '/balances')
  })

  it('renders Save balance button in idle state', () => {
    render(<AddBalanceFooter pending={false} />)

    const btn = screen.getByRole('button', { name: /save balance/i })
    expect(btn).toBeInTheDocument()
    expect(btn).not.toBeDisabled()
    expect(btn).toHaveAttribute('form', 'balance-form')
  })

  it('renders saving state and disables button while pending', () => {
    render(<AddBalanceFooter pending={true} />)

    const btn = screen.getByRole('button', { name: /saving/i })
    expect(btn).toBeDisabled()
  })

  it('renders within a nav with form actions label', () => {
    render(<AddBalanceFooter pending={false} />)

    expect(screen.getByRole('navigation', { name: /form actions/i })).toBeInTheDocument()
  })
})
