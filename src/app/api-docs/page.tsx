import type { Metadata } from "next";
import { apiEndpointsPreview } from "@/lib/content";

export const metadata: Metadata = {
  title: "API Docs",
  description: "Developer-facing API preview for Envision Maintenence platform endpoints.",
};

const samplePayload = `{
  "name": "Jordan Blake",
  "email": "jordan@example.com",
  "phone": "(310) 555-1000",
  "company": "Example Property Group",
  "serviceNeeded": "Emergency Service Response",
  "message": "Need response coverage for 5 buildings.",
  "source": "website-contact"
}`;

export default function ApiDocsPage() {
  return (
    <>
      <section className="page-banner">
        <div className="container">
          <p className="section-label">Developer Center</p>
          <h1 className="page-title">API Surface (Preview)</h1>
          <p className="page-lead">
            These endpoints provide placeholder operational access while the full authentication and
            partner onboarding layer is being designed.
          </p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="api-grid">
            {apiEndpointsPreview.map((endpoint) => (
              <article className="endpoint-card" key={`${endpoint.method}-${endpoint.path}`}>
                <code>{endpoint.method}</code>
                <h3>{endpoint.path}</h3>
                <p>{endpoint.description}</p>
              </article>
            ))}
          </div>

          <article className="panel" style={{ marginTop: "1rem", padding: "1rem" }}>
            <p className="section-label">Sample Request</p>
            <h2 className="section-title">POST /api/leads</h2>
            <pre className="code-block">
              <code>{samplePayload}</code>
            </pre>
          </article>
        </div>
      </section>
    </>
  );
}
