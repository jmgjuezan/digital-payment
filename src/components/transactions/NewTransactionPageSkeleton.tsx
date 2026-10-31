function SkeletonBlock({ className = '' }: { className?: string }) {
  return <span className={`dashboard-skeleton-block ${className}`} aria-hidden='true' />
}

export default function NewTransactionPageSkeleton() {
  return (
    <main className='dashboard-shell has-action-footer' aria-busy='true' aria-label='Loading add transaction'>
      <header className='dashboard-header'>
        <div className='dashboard-brand' aria-hidden='true'>
          <SkeletonBlock className='dashboard-skeleton-mark' />
          <SkeletonBlock className='dashboard-skeleton-brand' />
        </div>
        <div className='dashboard-header-actions' aria-hidden='true'>
          <SkeletonBlock className='dashboard-skeleton-email' />
          <SkeletonBlock className='dashboard-skeleton-logout' />
        </div>
      </header>
      <section className='new-transaction-content' aria-hidden='true'>
        <h1 className='sr-only'>Add transaction</h1>
        <div className='new-transaction-heading'>
          <SkeletonBlock className='transaction-entry-skeleton-icon' />
          <div className='transaction-entry-skeleton-heading'>
            <SkeletonBlock className='dashboard-skeleton-eyebrow' />
            <SkeletonBlock className='dashboard-skeleton-title' />
            <SkeletonBlock className='transaction-entry-skeleton-description' />
          </div>
        </div>
        <div className='transaction-entry-skeleton-fields'>
          {Array.from({ length: 7 }, (_, index) => (
            <div className='transaction-entry-skeleton-field' key={index}>
              <SkeletonBlock className='transaction-entry-skeleton-label' />
              <SkeletonBlock className='transaction-entry-skeleton-input' />
            </div>
          ))}
          <div className='transaction-entry-skeleton-field transaction-entry-skeleton-note'>
            <SkeletonBlock className='transaction-entry-skeleton-label' />
            <SkeletonBlock className='transaction-entry-skeleton-textarea' />
          </div>
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
