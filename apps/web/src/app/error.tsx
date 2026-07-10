'use client';

interface ErrorPageProperties {
  readonly error: Error & {
    readonly digest?: string;
  };
  readonly unstable_retry: () => void;
}

export default function ErrorPage({ error, unstable_retry }: ErrorPageProperties) {
  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Return to NEWAX home">
          NEWAX
        </a>
        <p>The Business Infrastructure Company.</p>
      </header>

      <section className="hero" aria-labelledby="error-title">
        <p className="eyebrow">Application error</p>
        <h1 id="error-title">Something interrupted this page.</h1>
        <p className="hero-summary">
          The system could not complete this request. No action is required beyond trying the page
          again.
        </p>

        {error.digest ? <p>Reference: {error.digest}</p> : null}

        <p>
          <button type="button" onClick={unstable_retry}>
            Try again
          </button>
        </p>
      </section>
    </main>
  );
}
