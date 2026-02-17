import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Clients | CRM",
  description: "Client accounts and portfolio operations.",
};

export default async function AdminClientsPage() {
  const clients = await prisma.client.findMany({
    include: {
      _count: {
        select: {
          properties: true,
          workOrders: true,
          invoices: true,
          estimates: true,
        },
      },
    },
    orderBy: [{ companyName: "asc" }],
    take: 100,
  });

  const tierOptions = Array.from(new Set(clients.map((client) => client.tier))).map((tier) => ({
    value: tier,
    label: tier,
  }));

  return (
    <ResourceCrud
      title="Clients"
      description="Manage customer accounts, contacts, and service tiers."
      endpoint="/api/clients"
      singularName="Client"
      initialItems={clients}
      searchKeys={["companyName", "contactName", "email", "phone", "tier"]}
      filters={[{ name: "tier", label: "Tier", options: tierOptions }]}
      columns={[
        { key: "companyName", label: "Company" },
        { key: "contactName", label: "Contact" },
        { key: "tier", label: "Tier", format: "pill" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "_count.properties", label: "Properties" },
        { key: "_count.workOrders", label: "Work Orders" },
        { key: "_count.invoices", label: "Invoices" },
      ]}
      fields={[
        { name: "companyName", label: "Company Name", type: "text", required: true },
        { name: "contactName", label: "Contact Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel", required: true },
        { name: "tier", label: "Tier", type: "text", required: true },
      ]}
    />
  );
}
