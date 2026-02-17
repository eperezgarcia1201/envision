import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Plans | CRM",
  description: "Plan tiers, feature entitlements, and export job history.",
};

export default async function AdminPlansPage() {
  const [plans, exports] = await Promise.all([
    prisma.planTier.findMany({
      orderBy: [{ monthlyPriceCents: "asc" }],
      take: 100,
    }),
    prisma.exportJob.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    }),
  ]);

  return (
    <div className="crm-stack">
      <ResourceCrud
        title="Plan Tiers"
        description="Define platform packages and enable API/mobile/automation capabilities per tier."
        endpoint="/api/plans"
        singularName="Plan Tier"
        initialItems={plans}
        searchKeys={["code", "name"]}
        defaultValues={{ apiAccess: "false", mobileAccess: "false", automationAccess: "false" }}
        columns={[
          { key: "code", label: "Code" },
          { key: "name", label: "Name" },
          { key: "monthlyPriceCents", label: "Monthly", format: "currency" },
          { key: "maxUsers", label: "Max Users" },
          { key: "maxClients", label: "Max Clients" },
          { key: "maxProperties", label: "Max Properties" },
          { key: "apiAccess", label: "API", format: "boolean" },
          { key: "mobileAccess", label: "Mobile", format: "boolean" },
          { key: "automationAccess", label: "Automation", format: "boolean" },
        ]}
        fields={[
          { name: "code", label: "Code", type: "text", required: true },
          { name: "name", label: "Name", type: "text", required: true },
          {
            name: "monthlyPriceCents",
            label: "Monthly Price (Cents)",
            type: "number",
            required: true,
            valueType: "number",
          },
          { name: "maxUsers", label: "Max Users", type: "number", required: true, valueType: "number" },
          { name: "maxClients", label: "Max Clients", type: "number", required: true, valueType: "number" },
          {
            name: "maxProperties",
            label: "Max Properties",
            type: "number",
            required: true,
            valueType: "number",
          },
          {
            name: "apiAccess",
            label: "API Access",
            type: "select",
            required: true,
            valueType: "boolean",
            options: [
              { value: "false", label: "No" },
              { value: "true", label: "Yes" },
            ],
          },
          {
            name: "mobileAccess",
            label: "Mobile Access",
            type: "select",
            required: true,
            valueType: "boolean",
            options: [
              { value: "false", label: "No" },
              { value: "true", label: "Yes" },
            ],
          },
          {
            name: "automationAccess",
            label: "Automation Access",
            type: "select",
            required: true,
            valueType: "boolean",
            options: [
              { value: "false", label: "No" },
              { value: "true", label: "Yes" },
            ],
          },
        ]}
      />

      <ResourceCrud
        title="Export Jobs"
        description="Audit report export history and monitor status of generated datasets."
        endpoint="/api/export-jobs"
        singularName="Export Job"
        initialItems={exports}
        searchKeys={["resource", "status", "requestedBy", "notes"]}
        defaultValues={{ format: "csv", status: "QUEUED" }}
        allowDelete={false}
        columns={[
          { key: "resource", label: "Resource" },
          { key: "format", label: "Format" },
          { key: "status", label: "Status", format: "pill" },
          { key: "requestedBy", label: "Requested By", empty: "-" },
          { key: "createdAt", label: "Created", format: "datetime" },
          { key: "completedAt", label: "Completed", format: "datetime", empty: "-" },
        ]}
        fields={[
          { name: "resource", label: "Resource", type: "text", required: true },
          { name: "format", label: "Format", type: "text", required: true },
          {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: [
              { value: "QUEUED", label: "Queued" },
              { value: "COMPLETED", label: "Completed" },
              { value: "FAILED", label: "Failed" },
            ],
          },
          { name: "requestedBy", label: "Requested By", type: "text" },
          { name: "downloadUrl", label: "Download URL", type: "text" },
          { name: "completedAt", label: "Completed At", type: "datetime-local" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
