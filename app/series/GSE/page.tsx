export default function GSE() {
  return (
    <div className="gs-container">
      <div className="gs-card" style={{ marginBottom: 'var(--gs-space-xl)' }}>
        <div className="gs-card-header">
          <h1 className="gs-h2" style={{ color: 'var(--gs-primary)', margin: 0 }}>
            🏔️ GravitySeries Enduro
          </h1>
        </div>
        <div className="gs-card-content">
          <p className="gs-text-lg" style={{ marginBottom: 'var(--gs-space-lg)', color: 'var(--gs-text-secondary)' }}>
            Här kommer totalställning, deltävlingar och teamranking.
          </p>

          <div className="gs-grid gs-grid-cols-3 gs-gap-lg">
            <div className="gs-card" style={{ textAlign: 'center', padding: 'var(--gs-space-lg)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--gs-space-sm)' }}>📊</div>
              <h3 className="gs-h4" style={{ marginBottom: 'var(--gs-space-sm)', color: 'var(--gs-primary)' }}>Poängställning</h3>
              <p className="gs-text-sm" style={{ color: 'var(--gs-text-secondary)' }}>Se totalställningen</p>
            </div>

            <div className="gs-card" style={{ textAlign: 'center', padding: 'var(--gs-space-lg)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--gs-space-sm)' }}>🏁</div>
              <h3 className="gs-h4" style={{ marginBottom: 'var(--gs-space-sm)', color: 'var(--gs-success)' }}>Deltävlingar</h3>
              <p className="gs-text-sm" style={{ color: 'var(--gs-text-secondary)' }}>Resultat per event</p>
            </div>

            <div className="gs-card" style={{ textAlign: 'center', padding: 'var(--gs-space-lg)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--gs-space-sm)' }}>👥</div>
              <h3 className="gs-h4" style={{ marginBottom: 'var(--gs-space-sm)', color: 'var(--gs-accent)' }}>Team-ranking</h3>
              <p className="gs-text-sm" style={{ color: 'var(--gs-text-secondary)' }}>Lagpoängställning</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}