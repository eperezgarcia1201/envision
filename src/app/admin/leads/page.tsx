import type { Metadata } from "next";
import { LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Leads | CRM",
  description: "Lead intake pipeline and lifecycle management.",
};

export default async function AdminLeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });

  const statusOptions = Object.values(LeadStatus).map((status) => ({
    value: status,
    label: enumLabel(status),
  }));

  return (
    <ResourceCrud
      title="Leads"
      description="Capture, qualify, and update every inbound opportunity."
      endpoint="/api/leads"
      singularName="Lead"
      initialItems={leads}
      searchKeys={["name", "email", "company", "serviceNeeded", "message", "source"]}
      filters={[{ name: "status", label: "Status", options: statusOptions }]}
      defaultValues={{ status: "NEW", source: "website" }}
      columns={[
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "company", label: "Company", empty: "N/A" },
        { key: "serviceNeeded", label: "Service", empty: "General" },
        { key: "status", label: "Status", format: "pill" },
        { key: "source", label: "Source" },
        { key: "createdAt", label: "Created", format: "date" },
      ]}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel" },
        { name: "company", label: "Company", type: "text" },
        { name: "serviceNeeded", label: "Service Needed", type: "text" },
        { name: "source", label: "Source", type: "text", required: true },
        { name: "status", label: "Status", type: "select", required: true, options: statusOptions },
        { name: "message", label: "Message", type: "textarea", required: true },
      ]}
    />
  );
}
