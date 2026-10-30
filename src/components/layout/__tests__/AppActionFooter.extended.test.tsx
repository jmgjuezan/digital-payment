import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AppActionFooter from '@/components/layout/AppActionFooter'

const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, refresh: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/app/dashboard/actions', () => ({
  checkTodayBalance: vi.fn(),
}))

import * as dashboardActions from '@/app/dashboard/actions'

describe('AppActionFooter — extended coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('balances view', () => {
    it('renders Add balance link and Transactions navigation link', () => {
      render(<AppActionFooter current='balances' />)

      expect(screen.getByRole('link', { name: /add balance/i })).toHaveAttribute('href', '/balances/new')
      expect(screen.getByRole('link', { name: /transactions/i })).toHaveAttribute('href', '/dashboard')
    })

    it('does not render Add transaction button on balances view', () => {
      render(<AppActionFooter current='balances' />)

      expect(screen.queryByRole('button', { name: /add transaction/i })).not.toBeInTheDocument()
    })
  })

  describe('transactions view — balance check flow', () => {
    it('navigates directly when balance is already cached in-memory', async () => {
      // checkTodayBalance will not be called because we use the module-level Set cache;
      // however after a successful check the Set is populated. Test the initial path
      // by making checkTodayBalance return hasBalance: true first (to seed cache)
      vi.mocked(dashboardActions.checkTodayBalance).mockResolvedValueOnce({
        hasBalance: true,
        hasError: false,
      })

      const { unmount } = render(<AppActionFooter current='transactions' userKey='cached-user' />)
      fireEvent.click(screen.getByRole('button', { name: /add transaction/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/transactions/new')
      })

      unmount()

      // Second render — same userKey/date should be cached in the module-level Set
      vi.mocked(dashboardActions.checkTodayBalance).mockClear()
      render(<AppActionFooter current='transactions' userKey='cached-user' />)
      fireEvent.click(screen.getByRole('button', { name: /add transaction/i }))

      // Should navigate immediately without calling checkTodayBalance again
      expect(mockPush).toHaveBeenCalledWith('/transactions/new')
      expect(dashboardActions.checkTodayBalance).not.toHaveBeenCalled()
    })

    it('shows balance required dialog when no balance exists', async () => {
      vi.mocked(dashboardActions.checkTodayBalance).mockResolvedValue({
        hasBalance: false,
        hasError: false,
      })

      render(<AppActionFooter current='transactions' userKey='no-balance-user' />)
      fireEvent.click(screen.getByRole('button', { name: /add transaction/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /add today's balance first/i, hidden: true })).toBeInTheDocument()
      })
    })

    it('shows balance required dialog with error flag when check fails', async () => {
      vi.mocked(dashboardActions.checkTodayBalance).mockResolvedValue({
        hasBalance: false,
        hasError: true,
      })

      render(<AppActionFooter current='transactions' userKey='error-user' />)
      fireEvent.click(screen.getByRole('button', { name: /add transaction/i }))

      await waitFor(() => {
        // Dialog opens — heading visible in modal
        expect(screen.getByRole('heading', { name: /add today's balance first/i, hidden: true })).toBeInTheDocument()
      })
    })

    it('renders Balances navigation link on transactions view', () => {
      render(<AppActionFooter current='transactions' />)

      expect(screen.getByRole('link', { name: /balances/i })).toHaveAttribute('href', '/balances')
    })
  })
})
