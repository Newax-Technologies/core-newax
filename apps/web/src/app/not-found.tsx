import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Return to NEWAX home">
          NEWAX
        </Link>
        <p>The Business Infrastructure Company.</p>
      </header>

      <section className="hero" aria-labelledby="not-found-title">
        <p className="eyebrow">404 · Page not found</p>
        <h1 id="not-found-title">This route does not exist.</h1>
        <p className="hero-summary">
          The page may have moved, the address may be incomplete, or the route may not be available
          in this deployment.
        </p>
        <p>
          <Link href="/">Return to the NEWAX home page</Link>
        </p>
      </section>
    </main>
  );
}
