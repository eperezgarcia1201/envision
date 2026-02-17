"use client";

import { FormEvent, useState } from "react";

type BookingFormValues = {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  serviceType: string;
  frequency: string;
  preferredDate: string;
  notes: string;
};

const initialValues: BookingFormValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  serviceType: "",
  frequency: "",
  preferredDate: "",
  notes: "",
};

export function BookingForm() {
  const [values, setValues] = useState<BookingFormValues>(initialValues);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setFeedback("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          preferredDate: values.preferredDate ? new Date(`${values.preferredDate}T00:00:00`).toISOString() : null,
          source: "website-booking",
          status: "NEW",
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Request failed");
      }

      setStatus("success");
      setFeedback("Booking request received. We will confirm your scheduling window shortly.");
      setValues(initialValues);
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : "Unable to submit booking request.");
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
            autoComplete="tel"
          />
        </label>

        <label>
          Company
          <input
            value={values.company}
            onChange={(event) => setValues((current) => ({ ...current, company: event.target.value }))}
            autoComplete="organization"
          />
        </label>
      </div>

      <label>
        Service Address
        <input
          value={values.address}
          onChange={(event) => setValues((current) => ({ ...current, address: event.target.value }))}
          autoComplete="street-address"
        />
      </label>

      <div className="field-grid two">
        <label>
          Service Type
          <select
            value={values.serviceType}
            onChange={(event) => setValues((current) => ({ ...current, serviceType: event.target.value }))}
            required
          >
            <option value="">Select a service</option>
            <option value="Commercial Cleaning">Commercial Cleaning</option>
            <option value="Property Turnover">Property Turnover</option>
            <option value="Emergency Service Response">Emergency Service Response</option>
            <option value="Post-Construction Cleanup">Post-Construction Cleanup</option>
            <option value="Remodeling and Repairs">Remodeling and Repairs</option>
            <option value="Preventive Maintenance">Preventive Maintenance</option>
          </select>
        </label>

        <label>
          Frequency
          <select
            value={values.frequency}
            onChange={(event) => setValues((current) => ({ ...current, frequency: event.target.value }))}
          >
            <option value="">Select frequency</option>
            <option value="One-Time">One-Time</option>
            <option value="Weekly">Weekly</option>
            <option value="Bi-Weekly">Bi-Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Custom">Custom</option>
          </select>
        </label>
      </div>

      <label>
        Preferred Date
        <input
          type="date"
          value={values.preferredDate}
          onChange={(event) => setValues((current) => ({ ...current, preferredDate: event.target.value }))}
        />
      </label>

      <label>
        Notes
        <textarea
          rows={4}
          value={values.notes}
          onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))}
          placeholder="Any gate access details, preferred time window, or special requirements"
        />
      </label>

      <button type="submit" className="btn btn-primary" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting..." : "Request Booking"}
      </button>

      {feedback && <p className={`status-message ${status === "success" ? "success" : "error"}`}>{feedback}</p>}
    </form>
  );
}
