import type { Metadata } from "next";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Bookings | CRM",
  description: "Booking intake forms, quote flow, and conversion tracking.",
};

export default async function AdminBookingsPage() {
  const [bookings, leads, clients] = await Promise.all([
    prisma.bookingRequest.findMany({
      include: {
        convertedLead: { select: { name: true } },
        client: { select: { companyName: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    }),
    prisma.lead.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: { id: true, name: true, email: true },
      take: 100,
    }),
    prisma.client.findMany({
      orderBy: [{ companyName: "asc" }],
      select: { id: true, companyName: true },
    }),
  ]);

  const statusOptions = Object.values(BookingStatus).map((status) => ({
    value: status,
    label: enumLabel(status),
  }));

  return (
    <ResourceCrud
      title="Booking Requests"
      description="Capture website bookings, triage requests, and route to lead + estimate workflows."
      endpoint="/api/bookings"
      singularName="Booking Request"
      initialItems={bookings}
      searchKeys={["name", "email", "company", "serviceType", "source", "status"]}
      filters={[{ name: "status", label: "Status", options: statusOptions }]}
      defaultValues={{ status: "NEW", source: "website-booking" }}
      columns={[
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "company", label: "Company", empty: "-" },
        { key: "serviceType", label: "Service" },
        { key: "status", label: "Status", format: "pill" },
        { key: "source", label: "Source" },
        { key: "preferredDate", label: "Preferred", format: "date", empty: "-" },
        { key: "convertedLead.name", label: "Lead", empty: "Auto" },
      ]}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel" },
        { name: "company", label: "Company", type: "text" },
        { name: "address", label: "Service Address", type: "text" },
        { name: "serviceType", label: "Service Type", type: "text", required: true },
        { name: "frequency", label: "Frequency", type: "text" },
        { name: "preferredDate", label: "Preferred Date", type: "date" },
        { name: "source", label: "Source", type: "text", required: true },
        { name: "status", label: "Status", type: "select", required: true, options: statusOptions },
        { name: "notes", label: "Notes", type: "textarea" },
        {
          name: "convertedLeadId",
          label: "Linked Lead",
          type: "select",
          options: leads.map((lead) => ({ value: lead.id, label: `${lead.name} (${lead.email})` })),
        },
        {
          name: "clientId",
          label: "Client",
          type: "select",
          options: clients.map((client) => ({ value: client.id, label: client.companyName })),
        },
      ]}
    />
  );
}
