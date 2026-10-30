function SkeletonBlock({ className = '' }: { className?: string }) {
  return <span className={`dashboard-skeleton-block ${className}`} aria-hidden='true' />
}

export default function DashboardTransactionsSkeleton() {
  return (
    <main className='dashboard-shell has-action-footer dashboard-skeleton' aria-busy='true' aria-label='Loading transactions'>
      <header className='dashboard-header'>
        <div className='dashboard-brand'>
          <SkeletonBlock className='dashboard-skeleton-mark' />
          <SkeletonBlock className='dashboard-skeleton-brand' />
        </div>
        <div className='dashboard-header-actions'>
          <SkeletonBlock className='dashboard-skeleton-email' />
          <SkeletonBlock className='dashboard-skeleton-logout' />
        </div>
      </header>
      <section className='dashboard-content'>
        <div className='dashboard-heading-row'>
          <div>
            <SkeletonBlock className='dashboard-skeleton-eyebrow' />
            <SkeletonBlock className='dashboard-skeleton-title' />
          </div>
        </div>
        <div className='dashboard-summary'>
          <SkeletonBlock className='dashboard-skeleton-summary' />
          <SkeletonBlock className='dashboard-skeleton-summary' />
          <SkeletonBlock className='dashboard-skeleton-summary dashboard-skeleton-summary-short' />
        </div>
        <div className='transaction-toolbar'>
          <SkeletonBlock className='dashboard-skeleton-toolbar-title' />
          <SkeletonBlock className='dashboard-skeleton-controls' />
        </div>
        <div className='dashboard-skeleton-table' aria-hidden='true'>
          {Array.from({ length: 6 }, (_, index) => (
            <div className='dashboard-skeleton-row' key={index}>
              {Array.from({ length: 5 }, (_, cell) => <SkeletonBlock key={cell} />)}
            </div>
          ))}
        </div>
      </section>
      <div className='app-action-footer dashboard-skeleton-footer' aria-hidden='true'>
        <div className='app-action-footer-inner'>
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      </div>
    </main>
  )
}
