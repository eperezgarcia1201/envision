import type { Metadata } from "next";
import { EstimateStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Estimates | CRM",
  description: "Proposal lifecycle from draft to conversion.",
};

export default async function AdminEstimatesPage() {
  const [estimates, clients, properties, leads, workOrders] = await Promise.all([
    prisma.estimate.findMany({
      include: {
        client: { select: { companyName: true } },
        property: { select: { name: true } },
        lead: { select: { name: true, company: true } },
        convertedWorkOrder: { select: { code: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 100,
    }),
    prisma.client.findMany({
      orderBy: [{ companyName: "asc" }],
      select: { id: true, companyName: true },
    }),
    prisma.property.findMany({
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.lead.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: { id: true, name: true, company: true },
      take: 100,
    }),
    prisma.workOrder.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: { id: true, code: true },
      take: 100,
    }),
  ]);

  const statusOptions = Object.values(EstimateStatus).map((status) => ({
    value: status,
    label: enumLabel(status),
  }));

  return (
    <ResourceCrud
      title="Estimates"
      description="Create and update proposals with full conversion context."
      endpoint="/api/estimates"
      singularName="Estimate"
      initialItems={estimates}
      searchKeys={["estimateNumber", "title", "description", "client.companyName", "lead.name", "preparedBy"]}
      filters={[{ name: "status", label: "Status", options: statusOptions }]}
      defaultValues={{ status: "DRAFT" }}
      extraActions={[
        {
          label: "PDF",
          href: (item) => `/api/estimates/${item.id}/pdf`,
          openInNewTab: true,
        },
        {
          label: "Convert",
          href: (item) => `/api/estimates/${item.id}/convert`,
          openInNewTab: true,
        },
      ]}
      columns={[
        { key: "estimateNumber", label: "Estimate #" },
        { key: "title", label: "Title" },
        { key: "status", label: "Status", format: "pill" },
        { key: "amountCents", label: "Amount", format: "currency" },
        { key: "client.companyName", label: "Client", empty: "Unassigned" },
        { key: "validUntil", label: "Valid Until", format: "date", empty: "-" },
        { key: "convertedWorkOrder.code", label: "WO", empty: "-" },
      ]}
      fields={[
        { name: "estimateNumber", label: "Estimate Number", type: "text" },
        { name: "title", label: "Title", type: "text", required: true },
        { name: "description", label: "Description", type: "textarea", required: true },
        { name: "amountCents", label: "Amount (Cents)", type: "number", required: true, valueType: "number" },
        { name: "status", label: "Status", type: "select", required: true, options: statusOptions },
        { name: "validUntil", label: "Valid Until", type: "date" },
        { name: "preparedBy", label: "Prepared By", type: "text" },
        { name: "notes", label: "Notes", type: "textarea" },
        {
          name: "clientId",
          label: "Client",
          type: "select",
          options: clients.map((client) => ({ value: client.id, label: client.companyName })),
        },
        {
          name: "propertyId",
          label: "Property",
          type: "select",
          options: properties.map((property) => ({ value: property.id, label: property.name })),
        },
        {
          name: "leadId",
          label: "Lead",
          type: "select",
          options: leads.map((lead) => ({
            value: lead.id,
            label: `${lead.name}${lead.company ? ` (${lead.company})` : ""}`,
          })),
        },
        {
          name: "convertedWorkOrderId",
          label: "Converted Work Order",
          type: "select",
          options: workOrders.map((workOrder) => ({ value: workOrder.id, label: workOrder.code })),
        },
      ]}
    />
  );
}
