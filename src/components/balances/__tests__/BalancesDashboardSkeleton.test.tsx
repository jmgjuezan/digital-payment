import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import BalancesDashboardSkeleton from '@/components/balances/BalancesDashboardSkeleton'

describe('BalancesDashboardSkeleton', () => {
  it('renders skeleton blocks for balances table and summary', () => {
    const { container } = render(<BalancesDashboardSkeleton selectedDate='2026-10-31' />)

    expect(container.querySelector('.balances-initial-skeleton')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText(/loading balances for 2026-10-31/i)).toBeInTheDocument()

    const skeletonBlocks = container.querySelectorAll('.dashboard-skeleton-block')
    expect(skeletonBlocks.length).toBeGreaterThan(10)

    // No spinners rendered
    expect(container.querySelector('.spinner')).not.toBeInTheDocument()
  })
})
