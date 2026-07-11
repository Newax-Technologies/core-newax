import Link from 'next/link';

export default function LoadingPage() {
  return (
    <main className="site-shell" aria-busy="true">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Return to NEWAX home">
          NEWAX
        </Link>
        <p>The Business Infrastructure Company.</p>
      </header>

      <section className="hero" aria-labelledby="loading-title">
        <p className="eyebrow">Loading</p>
        <h1 id="loading-title">Preparing this page.</h1>
        <p className="hero-summary" role="status" aria-live="polite">
          The requested information is being assembled. This should only take a moment.
        </p>
      </section>
    </main>
  );
}
