import Link from "next/link";
import {
  capabilityPillars,
  platformModules,
  roadmapMilestones,
  serviceBlueprint,
  testimonials,
} from "@/lib/content";

export default function HomePage() {
  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Los Angeles Property Operations</p>
            <h1 className="hero-title">Reliable. Trustworthy. Confidential.</h1>
            <p className="lead">
              Envision Maintenence delivers professional maintenance and construction services for
              multifamily, retail, and commercial properties across Los Angeles, California. The
              business is built as a future-ready platform with roadmap support for payment APIs,
              SDK integrations, and mobile workforce applications.
            </p>

            <div className="action-row">
              <Link className="btn btn-gold" href="/contact">
                Request Free Estimate
              </Link>
              <Link className="btn btn-outline" href="/platform">
                Explore Platform Vision
              </Link>
            </div>

            <div className="badge-row">
              <span className="badge">Licensed and Insured</span>
              <span className="badge">Confidential and Discreet</span>
              <span className="badge">SLA-Driven Delivery</span>
              <span className="badge">Experienced Professionals</span>
            </div>
          </div>

          <aside className="hero-panel panel">
            <h2>Operational Snapshot</h2>
            <div className="stats-list">
              <div className="metric">
                <strong>&lt; 2 Hours</strong>
                <span>Emergency dispatch response target</span>
              </div>
              <div className="metric">
                <strong>24/7</strong>
                <span>Incident intake and escalation coverage</span>
              </div>
              <div className="metric">
                <strong>API + SDK Roadmap</strong>
                <span>Platform architecture planned for partner integration</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="section-label">Why Envision</p>
          <h2 className="section-title">Built for Demanding Property Portfolios</h2>
          <p className="page-lead">
            The operating model combines field reliability with platform thinking so owners and
            managers get immediate service value today without losing future scalability.
          </p>

          <div className="grid-4" style={{ marginTop: "1.2rem" }}>
            {capabilityPillars.map((pillar) => (
              <article className="card" key={pillar.title}>
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container split">
          <div>
            <p className="section-label">Service Coverage</p>
            <h2 className="section-title">Current Service Lines</h2>
            <p className="page-lead">
              Immediate service capacity spans cleaning, turn-ready operations, emergency support,
              and planned repairs. Every package follows documented scope and status checkpoints.
            </p>

            <div className="grid-2" style={{ marginTop: "1.1rem" }}>
              {serviceBlueprint.slice(0, 4).map((service) => (
                <article key={service.slug} className="service-card">
                  <h3>{service.name}</h3>
                  <p>{service.summary}</p>
                  <div className="service-meta">
                    <span>SLA: {service.responseSlaHours} hours</span>
                    <span>Coverage: {service.coverageArea}</span>
                    <span>Starting: {service.startingPrice}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="panel" style={{ padding: "1rem" }}>
            <p className="section-label">Roadmap Timeline</p>
            <h2 className="section-title">Platform Expansion Plan</h2>
            <ul className="timeline" style={{ marginTop: "0.95rem" }}>
              {roadmapMilestones.map((item) => (
                <li key={item.quarter} className="timeline-item">
                  <strong>{item.quarter}</strong>
                  <span>{item.detail}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container">
          <p className="section-label">Future Platform</p>
          <h2 className="section-title">Technology Modules for a Scalable Business</h2>
          <p className="page-lead">
            The long-term direction includes payment integrations, client portal automation,
            developer SDK support, and mobile-native experiences for field execution.
          </p>

          <div className="grid-4" style={{ marginTop: "1.2rem" }}>
            {platformModules.map((module) => (
              <article className="card" key={module.title}>
                <h3>{module.title}</h3>
                <p>{module.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="section-label">Client Perspective</p>
          <h2 className="section-title">What Operators Value Most</h2>
          <div className="grid-2" style={{ marginTop: "1rem" }}>
            {testimonials.map((item) => (
              <blockquote key={item.author} className="card" style={{ margin: 0 }}>
                <p style={{ margin: 0 }}>{item.quote}</p>
                <p style={{ marginTop: "0.75rem", fontWeight: 700, color: "#17356f" }}>{item.author}</p>
              </blockquote>
            ))}
          </div>
          <div className="action-row" style={{ marginTop: "1.2rem" }}>
            <Link className="btn btn-primary" href="/portal">
              View Operations Portal
            </Link>
            <Link className="btn btn-primary" href="/api-docs">
              View API Endpoints
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
