import type { Metadata } from "next";
import { apiEndpointsPreview, platformModules, roadmapMilestones } from "@/lib/content";

export const metadata: Metadata = {
  title: "Platform",
  description: "Future platform architecture: APIs, SDKs, and client operations tooling.",
};

export default function PlatformPage() {
  return (
    <>
      <section className="page-banner">
        <div className="container">
          <p className="section-label">Platform Roadmap</p>
          <h1 className="page-title">From Service Team to Scalable Business Platform</h1>
          <p className="page-lead">
            The platform strategy is designed to support future payment integrations, SDK-based
            partner development, and mobile-first field operations.
          </p>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container">
          <p className="section-label">Core Modules</p>
          <h2 className="section-title">Architecture Direction</h2>
          <div className="grid-4" style={{ marginTop: "1.1rem" }}>
            {platformModules.map((module) => (
              <article className="card" key={module.title}>
                <h3>{module.title}</h3>
                <p>{module.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container split">
          <article className="panel" style={{ padding: "1rem" }}>
            <p className="section-label">API Foundation</p>
            <h2 className="section-title">Available Placeholder Endpoints</h2>
            <div className="api-grid">
              {apiEndpointsPreview.map((endpoint) => (
                <article key={`${endpoint.method}-${endpoint.path}`} className="endpoint-card">
                  <code>{endpoint.method}</code>
                  <h3>{endpoint.path}</h3>
                  <p>{endpoint.description}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="panel" style={{ padding: "1rem" }}>
            <p className="section-label">Release Path</p>
            <h2 className="section-title">Milestones Toward APIs and SDKs</h2>
            <ul className="timeline" style={{ marginTop: "1rem" }}>
              {roadmapMilestones.map((milestone) => (
                <li key={milestone.quarter} className="timeline-item">
                  <strong>{milestone.quarter}</strong>
                  <span>{milestone.detail}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </>
  );
}
