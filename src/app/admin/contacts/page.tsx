import type { Metadata } from "next";
import { ContactStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Contacts | CRM",
  description: "Client contact roster and communication preferences.",
};

export default async function AdminContactsPage() {
  const [contacts, clients] = await Promise.all([
    prisma.contactPerson.findMany({
      include: {
        client: { select: { companyName: true } },
      },
      orderBy: [{ isPrimary: "desc" }, { fullName: "asc" }],
      take: 100,
    }),
    prisma.client.findMany({
      orderBy: [{ companyName: "asc" }],
      select: { id: true, companyName: true },
    }),
  ]);

  const statusOptions = Object.values(ContactStatus).map((status) => ({
    value: status,
    label: enumLabel(status),
  }));

  return (
    <ResourceCrud
      title="Client Contacts"
      description="Maintain primary, billing, and operational contacts with lifecycle status controls."
      endpoint="/api/contacts"
      singularName="Contact"
      initialItems={contacts}
      searchKeys={["fullName", "email", "phone", "title", "client.companyName"]}
      filters={[{ name: "status", label: "Status", options: statusOptions }]}
      defaultValues={{ status: "ACTIVE", isPrimary: "false", isBilling: "false" }}
      columns={[
        { key: "fullName", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone", empty: "-" },
        { key: "client.companyName", label: "Client" },
        { key: "title", label: "Title", empty: "-" },
        { key: "status", label: "Status", format: "pill" },
        { key: "isPrimary", label: "Primary", format: "boolean" },
        { key: "isBilling", label: "Billing", format: "boolean" },
      ]}
      fields={[
        { name: "fullName", label: "Full Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel" },
        { name: "title", label: "Title", type: "text" },
        { name: "status", label: "Status", type: "select", required: true, options: statusOptions },
        {
          name: "isPrimary",
          label: "Primary Contact",
          type: "select",
          required: true,
          valueType: "boolean",
          options: [
            { value: "false", label: "No" },
            { value: "true", label: "Yes" },
          ],
        },
        {
          name: "isBilling",
          label: "Billing Contact",
          type: "select",
          required: true,
          valueType: "boolean",
          options: [
            { value: "false", label: "No" },
            { value: "true", label: "Yes" },
          ],
        },
        { name: "notes", label: "Notes", type: "textarea" },
        {
          name: "clientId",
          label: "Client",
          type: "select",
          required: true,
          options: clients.map((client) => ({ value: client.id, label: client.companyName })),
        },
      ]}
    />
  );
}
