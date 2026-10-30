import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BalanceRequiredDialog from '@/components/transactions/BalanceRequiredDialog'

describe('BalanceRequiredDialog', () => {
  it('renders required balance message when opened', () => {
    const handleClose = vi.fn()
    render(<BalanceRequiredDialog open={true} hasError={false} onClose={handleClose} />)

    expect(screen.getByRole('heading', { name: /add today's balance first/i })).toBeInTheDocument()
    expect(screen.getByText(/a balance must be added today before adding a transaction/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /add balance/i })).toHaveAttribute('href', '/balances/new')
  })

  it('renders error notice when hasError is true', () => {
    const handleClose = vi.fn()
    render(<BalanceRequiredDialog open={true} hasError={true} onClose={handleClose} />)

    expect(screen.getByText(/today’s balance could not be verified/i)).toBeInTheDocument()
  })

  it('calls onClose when back to dashboard button is clicked', () => {
    const handleClose = vi.fn()
    render(<BalanceRequiredDialog open={true} hasError={false} onClose={handleClose} />)

    const backButton = screen.getByRole('button', { name: /back to dashboard/i })
    fireEvent.click(backButton)

    expect(handleClose).toHaveBeenCalled()
  })
})
