import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Request estimates and project consultations with Envision Maintenence.",
};

export default function ContactPage() {
  return (
    <>
      <section className="page-banner">
        <div className="container">
          <p className="section-label">Contact</p>
          <h1 className="page-title">Request a Walkthrough or Project Estimate</h1>
          <p className="page-lead">
            Submit your details and service needs. This form is connected to the backend lead
            pipeline so requests appear immediately in operations records.
          </p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container contact-grid">
          <article className="panel" style={{ padding: "1rem" }}>
            <p className="section-label">Service Request Form</p>
            <h2 className="section-title">Tell Us What You Need</h2>
            <p className="page-lead">
              Placeholder routing is active now. Production integrations can connect this to CRM,
              phone systems, and outbound messaging tools.
            </p>
            <ContactForm />
          </article>

          <aside className="panel" style={{ padding: "1rem" }}>
            <p className="section-label">Office and Dispatch</p>
            <h2 className="section-title">Envision Maintenence</h2>
            <div className="info-list">
              <p>Los Angeles, California</p>
              <p>(323) 555-0187</p>
              <p>info@envisionmaintenence.com</p>
              <p>Mon - Sat: 7:00 AM to 6:00 PM</p>
              <p>After-hours incident intake available for contracted clients.</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
