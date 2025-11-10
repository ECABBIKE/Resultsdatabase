export default function Home() {
  return (
    <div className="gs-container" style={{ marginTop: 'var(--gs-space-2xl)' }}>
      <div className="gs-hero gs-text-center">
        <h1 className="gs-h1 gs-text-white" style={{ marginBottom: 'var(--gs-space-lg)' }}>
          🏔️ GravitySeries
        </h1>
        <p className="gs-text-lg gs-text-white" style={{ opacity: 0.9 }}>
          Välkommen till GravitySeries resultatplattform. Välj serie i menyn för att se resultat och poängställningar.
        </p>
      </div>
    </div>
  );
}