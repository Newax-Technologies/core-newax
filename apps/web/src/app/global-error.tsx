'use client';

import type { CSSProperties } from 'react';

interface GlobalErrorPageProperties {
  readonly error: Error & {
    readonly digest?: string;
  };
  readonly unstable_retry: () => void;
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  margin: 0,
  background: '#f4f6f8',
  color: '#0e1a24',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shellStyle: CSSProperties = {
  width: 'min(100%, 1180px)',
  margin: '0 auto',
  padding: 'clamp(1.25rem, 4vw, 4rem)',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  minHeight: '96px',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid #cfd8df',
  gap: '2rem',
};

const brandStyle: CSSProperties = {
  color: '#0e1a24',
  fontSize: '1.15rem',
  fontWeight: 800,
  letterSpacing: '0.2em',
  textDecoration: 'none',
};

const heroStyle: CSSProperties = {
  display: 'grid',
  minHeight: 'calc(100vh - 160px)',
  alignContent: 'center',
  padding: 'clamp(5rem, 12vw, 10rem) 0',
};

const titleStyle: CSSProperties = {
  maxWidth: '15ch',
  margin: '0 0 1.75rem',
  fontSize: 'clamp(3rem, 8vw, 6.5rem)',
  fontWeight: 650,
  letterSpacing: '-0.035em',
  lineHeight: 1.08,
};

const summaryStyle: CSSProperties = {
  maxWidth: '720px',
  margin: 0,
  color: '#52616e',
  fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
  lineHeight: 1.65,
};

const buttonStyle: CSSProperties = {
  minHeight: '48px',
  marginTop: '2rem',
  padding: '0.75rem 1.25rem',
  border: '1px solid #173f5f',
  borderRadius: '999px',
  background: '#173f5f',
  color: '#ffffff',
  font: 'inherit',
  fontWeight: 700,
  cursor: 'pointer',
};

export default function GlobalErrorPage({ error, unstable_retry }: GlobalErrorPageProperties) {
  return (
    <html lang="en">
      <body style={pageStyle}>
        <title>Application Error | NEWAX</title>
        <main style={shellStyle}>
          <header style={headerStyle}>
            <a href="/" style={brandStyle} aria-label="Return to NEWAX home">
              NEWAX
            </a>
            <p style={{ margin: 0, color: '#52616e' }}>The Business Infrastructure Company.</p>
          </header>

          <section style={heroStyle} aria-labelledby="global-error-title">
            <p
              style={{
                margin: '0 0 1.5rem',
                color: '#173f5f',
                fontSize: '0.75rem',
                fontWeight: 750,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              System error
            </p>
            <h1 id="global-error-title" style={titleStyle}>
              The application could not complete this request.
            </h1>
            <p style={summaryStyle}>
              A core part of the interface was interrupted. Try loading it again. No technical
              action is required from you.
            </p>

            {error.digest ? (
              <p style={{ margin: '1.25rem 0 0', color: '#52616e' }}>Reference: {error.digest}</p>
            ) : null}

            <div>
              <button type="button" style={buttonStyle} onClick={unstable_retry}>
                Try again
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
