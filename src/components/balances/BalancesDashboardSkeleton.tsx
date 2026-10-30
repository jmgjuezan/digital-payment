function SkeletonBlock({ className = '' }: { className?: string }) {
  return <span className={`dashboard-skeleton-block ${className}`} aria-hidden='true' />
}

function SkeletonTable({ columns }: { columns: number }) {
  return (
    <div className='transactions-table-scroll dashboard-skeleton-table' aria-hidden='true'>
      {Array.from({ length: 6 }, (_, row) => (
        <div className='dashboard-skeleton-row' key={row}>
          {Array.from({ length: columns }, (_, cell) => <SkeletonBlock key={cell} />)}
        </div>
      ))}
    </div>
  )
}

export default function BalancesDashboardSkeleton({ selectedDate }: { selectedDate: string }) {
  return (
    <div className='balances-initial-skeleton' aria-busy='true' aria-label='Loading balances'>
      <div className='dashboard-heading-row'>
        <div>
          <SkeletonBlock className='dashboard-skeleton-eyebrow' />
          <SkeletonBlock className='dashboard-skeleton-title' />
          <h1 id='balances-title' className='sr-only'>Balances</h1>
          <SkeletonBlock className='balances-skeleton-date' />
        </div>
        <SkeletonBlock className='transactions-loading-count' />
      </div>
      <div className='dashboard-summary'>
        <div className='summary-item'>
          <SkeletonBlock className='transactions-loading-label' />
          <SkeletonBlock className='transactions-loading-total' />
        </div>
        <SkeletonBlock className='balances-skeleton-note' />
      </div>
      <section className='computed-balances-section'>
        <div className='balances-toolbar'>
          <div>
            <h2>Computed balances</h2>
            <p>Starting balance minus cash-ins and loads, plus cash-outs, through today.</p>
          </div>
        </div>
        <SkeletonTable columns={6} />
      </section>
      <div className='balances-toolbar'>
        <SkeletonBlock className='dashboard-skeleton-toolbar-title' />
        <SkeletonBlock className='dashboard-skeleton-controls' />
      </div>
      <SkeletonTable columns={3} />
      <span className='sr-only'>Loading balances for {selectedDate}</span>
    </div>
  )
}
