import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AppActionFooter from '@/components/layout/AppActionFooter'
import * as dashboardActions from '@/app/dashboard/actions'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('@/app/dashboard/actions', () => ({
  checkTodayBalance: vi.fn(),
}))

describe('AppActionFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.sessionStorage.clear()
  })

  it('renders navigation link and add transaction button on transactions view', () => {
    render(<AppActionFooter current='transactions' userKey='footer-nav-tx' />)

    expect(screen.getByRole('link', { name: /balances/i })).toHaveAttribute('href', '/balances')
    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument()
  })

  it('renders navigation link and add balance button on balances view', () => {
    render(<AppActionFooter current='balances' userKey='footer-nav-bal' />)

    expect(screen.getByRole('link', { name: /transactions/i })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: /add balance/i })).toHaveAttribute('href', '/balances/new')
  })

  it('navigates directly to /transactions/new if balance check succeeds', async () => {
    vi.mocked(dashboardActions.checkTodayBalance).mockResolvedValue({
      hasBalance: true,
      hasError: false,
    })

    render(<AppActionFooter current='transactions' userKey='footer-has-balance' />)

    const addButton = screen.getByRole('button', { name: /add transaction/i })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/transactions/new')
    })
  })

  it('opens balance required dialog if today balance is missing', async () => {
    vi.mocked(dashboardActions.checkTodayBalance).mockResolvedValue({
      hasBalance: false,
      hasError: false,
    })

    render(<AppActionFooter current='transactions' userKey='footer-missing-balance' />)

    const addButton = screen.getByRole('button', { name: /add transaction/i })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /add today's balance first/i })).toBeInTheDocument()
    })
  })
})
