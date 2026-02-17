"use client";

import { FormEvent, useState } from "react";

type ContactFormValues = {
  name: string;
  email: string;
  phone: string;
  company: string;
  serviceNeeded: string;
  message: string;
};

const initialValues: ContactFormValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  serviceNeeded: "",
  message: "",
};

export function ContactForm() {
  const [values, setValues] = useState<ContactFormValues>(initialValues);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setFeedback("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          message: values.message.trim(),
          source: "website-contact",
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Request failed");
      }

      setStatus("success");
      setFeedback("Thanks. Your request was received. Our team will contact you shortly.");
      setValues(initialValues);
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : "Unable to submit request.");
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="field-grid two">
        <label>
          Name
          <input
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            name="name"
            autoComplete="name"
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={values.email}
            onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
            name="email"
            autoComplete="email"
            required
          />
        </label>
      </div>

      <div className="field-grid two">
        <label>
          Phone
          <input
            value={values.phone}
            onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))}
            name="phone"
            autoComplete="tel"
          />
        </label>

        <label>
          Company
          <input
            value={values.company}
            onChange={(event) => setValues((current) => ({ ...current, company: event.target.value }))}
            name="company"
            autoComplete="organization"
          />
        </label>
      </div>

      <label>
        Service Needed
        <select
          value={values.serviceNeeded}
          onChange={(event) => setValues((current) => ({ ...current, serviceNeeded: event.target.value }))}
          name="serviceNeeded"
        >
          <option value="">Select an option</option>
          <option value="Commercial Cleaning">Commercial Cleaning</option>
          <option value="Post-Construction Cleanup">Post-Construction Cleanup</option>
          <option value="Emergency Service Response">Emergency Service Response</option>
          <option value="Property Turnover">Property Turnover</option>
          <option value="Remodeling and Repairs">Remodeling and Repairs</option>
          <option value="Preventive Maintenance">Preventive Maintenance</option>
        </select>
      </label>

      <label>
        Project Details
        <textarea
          value={values.message}
          onChange={(event) => setValues((current) => ({ ...current, message: event.target.value }))}
          name="message"
          rows={5}
          required
        />
      </label>

      <button type="submit" className="btn btn-primary" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting..." : "Submit Request"}
      </button>

      {feedback && (
        <p className={`status-message ${status === "success" ? "success" : "error"}`}>{feedback}</p>
      )}
    </form>
  );
}
