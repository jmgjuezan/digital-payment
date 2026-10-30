import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardTransactionsSkeleton from '@/components/dashboard/DashboardTransactionsSkeleton'

describe('DashboardTransactionsSkeleton', () => {
  it('renders the skeleton layout with accessible loading state', () => {
    const { container } = render(<DashboardTransactionsSkeleton />)

    const main = screen.getByRole('main', { name: /loading transactions/i })
    expect(main).toHaveAttribute('aria-busy', 'true')

    const skeletonBlocks = container.querySelectorAll('.dashboard-skeleton-block')
    expect(skeletonBlocks.length).toBeGreaterThan(10)

    // Verify no spinners or text loading spinners exist
    expect(container.querySelector('.spinner')).not.toBeInTheDocument()
    expect(container.querySelector('svg.animate-spin')).not.toBeInTheDocument()
  })
})
