import type { Metadata } from "next";
import { capabilityPillars, roadmapMilestones } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Envision Maintenence, our operating standards, and platform roadmap.",
};

export default function AboutPage() {
  return (
    <>
      <section className="page-banner">
        <div className="container">
          <p className="section-label">About Envision Maintenence</p>
          <h1 className="page-title">Operational Discipline with Long-Term Platform Vision</h1>
          <p className="page-lead">
            Based in Los Angeles, Envision Maintenence was built to serve properties that require
            speed, quality, and confidentiality. The company combines practical field execution
            with scalable systems planning.
          </p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container split">
          <article className="panel" style={{ padding: "1rem" }}>
            <p className="section-label">Mission</p>
            <h2 className="section-title">Deliver Reliable Service Without Operational Noise</h2>
            <p className="page-lead">
              Every request follows a controlled process: intake, scope confirmation, execution,
              QA, and documented closeout. This creates predictable outcomes for owners and
              managers running large or sensitive portfolios.
            </p>
            <p className="page-lead">
              We are intentionally designing this system to evolve into a digital platform where
              APIs, SDKs, and mobile workflows extend the same standards across partners.
            </p>
          </article>

          <article className="panel" style={{ padding: "1rem" }}>
            <p className="section-label">Roadmap</p>
            <h2 className="section-title">Where the Business is Going</h2>
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

      <section className="section">
        <div className="container">
          <p className="section-label">Core Principles</p>
          <h2 className="section-title">How We Operate Day to Day</h2>
          <div className="grid-4" style={{ marginTop: "1rem" }}>
            {capabilityPillars.map((pillar) => (
              <article className="card" key={pillar.title}>
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
