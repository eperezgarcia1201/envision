import type { Metadata } from "next";
import { IntegrationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Integrations | CRM",
  description: "Third-party sync connectors and webhook bridge configuration.",
};

export default async function AdminIntegrationsPage() {
  const integrations = await prisma.integrationConnection.findMany({
    orderBy: [{ provider: "asc" }],
    take: 100,
  });

  const statusOptions = Object.values(IntegrationStatus).map((status) => ({
    value: status,
    label: enumLabel(status),
  }));

  return (
    <ResourceCrud
      title="Integration Connectors"
      description="Configure external systems for API sync, webhook delivery, and periodic background reconciliation."
      endpoint="/api/integrations"
      singularName="Integration"
      initialItems={integrations}
      searchKeys={["provider", "status", "webhookUrl", "notes"]}
      filters={[{ name: "status", label: "Status", options: statusOptions }]}
      defaultValues={{ status: "DISCONNECTED", syncIntervalMinutes: "15" }}
      columns={[
        { key: "provider", label: "Provider" },
        { key: "status", label: "Status", format: "pill" },
        { key: "syncIntervalMinutes", label: "Sync (min)" },
        { key: "lastSyncAt", label: "Last Sync", format: "datetime", empty: "-" },
        { key: "webhookUrl", label: "Webhook", empty: "-" },
      ]}
      fields={[
        { name: "provider", label: "Provider", type: "text", required: true },
        { name: "status", label: "Status", type: "select", required: true, options: statusOptions },
        { name: "apiKeyMasked", label: "API Key (Masked)", type: "text" },
        { name: "webhookUrl", label: "Webhook URL", type: "text" },
        {
          name: "syncIntervalMinutes",
          label: "Sync Interval Minutes",
          type: "number",
          required: true,
          valueType: "number",
        },
        { name: "lastSyncAt", label: "Last Sync", type: "datetime-local" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
