import type { Metadata } from "next";
import { BookingForm } from "@/components/forms/booking-form";

export const metadata: Metadata = {
  title: "Book Service",
  description: "Schedule maintenance and cleaning service intake directly into Envision CRM.",
};

export default function BookPage() {
  return (
    <>
      <section className="page-banner">
        <div className="container">
          <p className="section-label">Book Service</p>
          <h1 className="page-title">Request and Schedule Service in Minutes</h1>
          <p className="page-lead">
            This booking flow feeds directly into operations for triage, quoting, dispatch, and follow-up automation.
          </p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container contact-grid">
          <article className="panel" style={{ padding: "1rem" }}>
            <p className="section-label">Online Booking</p>
            <h2 className="section-title">Get on the Schedule</h2>
            <p className="page-lead">
              Submit one-time or recurring service needs with preferred timing. Our team converts requests into estimates
              and dispatch-ready work orders.
            </p>
            <BookingForm />
          </article>

          <aside className="panel" style={{ padding: "1rem" }}>
            <p className="section-label">How It Works</p>
            <h2 className="section-title">From Request to Completion</h2>
            <div className="info-list">
              <p>1. Submit booking request and property details.</p>
              <p>2. Operations team reviews scope and confirms service window.</p>
              <p>3. Estimate + work order are created automatically for dispatch.</p>
              <p>4. You receive reminders, status updates, and invoice follow-up.</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
