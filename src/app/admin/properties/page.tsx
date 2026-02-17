import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Properties | CRM",
  description: "Managed properties and onsite manager records.",
};

export default async function AdminPropertiesPage() {
  const [properties, clients] = await Promise.all([
    prisma.property.findMany({
      include: {
        client: { select: { companyName: true } },
        _count: {
          select: {
            workOrders: true,
            estimates: true,
            scheduleItems: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 100,
    }),
    prisma.client.findMany({
      orderBy: [{ companyName: "asc" }],
      select: { id: true, companyName: true },
    }),
  ]);

  return (
    <ResourceCrud
      title="Properties"
      description="Track sites, addresses, and manager contacts across all clients."
      endpoint="/api/properties"
      singularName="Property"
      initialItems={properties}
      searchKeys={[
        "name",
        "addressLine1",
        "city",
        "state",
        "zipCode",
        "managerName",
        "managerEmail",
        "client.companyName",
      ]}
      columns={[
        { key: "name", label: "Property" },
        { key: "client.companyName", label: "Client", empty: "Unassigned" },
        { key: "city", label: "City" },
        { key: "state", label: "State" },
        { key: "managerName", label: "Manager" },
        { key: "managerEmail", label: "Manager Email" },
        { key: "_count.workOrders", label: "Work Orders" },
        { key: "_count.scheduleItems", label: "Schedule" },
      ]}
      fields={[
        { name: "name", label: "Property Name", type: "text", required: true },
        { name: "addressLine1", label: "Address", type: "text", required: true },
        { name: "city", label: "City", type: "text", required: true },
        { name: "state", label: "State", type: "text", required: true },
        { name: "zipCode", label: "ZIP Code", type: "text", required: true },
        { name: "managerName", label: "Manager Name", type: "text", required: true },
        { name: "managerEmail", label: "Manager Email", type: "email", required: true },
        { name: "managerPhone", label: "Manager Phone", type: "tel", required: true },
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
