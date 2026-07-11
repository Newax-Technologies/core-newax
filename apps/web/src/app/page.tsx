const capabilities = [
  {
    title: 'Enterprise Software',
    description:
      'Business operating systems, custom applications, portals, and platforms built around how your organization works.',
  },
  {
    title: 'Intelligent Automation',
    description:
      'Connected workflows and decision support that remove repetitive work and improve operational visibility.',
  },
  {
    title: 'Connected Infrastructure',
    description:
      'Telemetry, smart facilities, and real-time operational intelligence that connect physical operations with the systems managing them.',
  },
] as const;

export default function HomePage() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="NEWAX home">
          NEWAX
        </a>
        <p>The Business Infrastructure Company.</p>
      </header>

      <section id="top" className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">
          Enterprise Software. Intelligent Automation. Connected Infrastructure.
        </p>
        <h1 id="hero-title">We build the systems modern organizations depend on.</h1>
        <p className="hero-summary">
          NEWAX designs, builds, integrates, and supports the business infrastructure that helps
          organizations operate with greater simplicity, visibility, reliability, and control.
        </p>
      </section>

      <section className="capabilities" aria-labelledby="capabilities-title">
        <div className="section-heading">
          <p className="eyebrow">Core capabilities</p>
          <h2 id="capabilities-title">Infrastructure designed around your operations.</h2>
        </div>

        <div className="capability-grid">
          {capabilities.map((capability) => (
            <article key={capability.title} className="capability-card">
              <h3>{capability.title}</h3>
              <p>{capability.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ownership" aria-labelledby="ownership-title">
        <p className="eyebrow">Built for long-term ownership</p>
        <h2 id="ownership-title">Own the infrastructure that powers your operations.</h2>
        <p>
          Systems should fit the organization, not force the organization to fit the system. NEWAX
          builds dependable infrastructure that gives teams greater control over their processes,
          data, integrations, and future growth.
        </p>
      </section>
    </main>
  );
}
