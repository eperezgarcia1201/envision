import type { Metadata } from "next";
import { InvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Invoices | CRM",
  description: "Billing lifecycle and receivables operations.",
};

export default async function AdminInvoicesPage() {
  const [invoices, clients, workOrders] = await Promise.all([
    prisma.invoice.findMany({
      include: {
        client: { select: { companyName: true } },
        workOrder: { select: { code: true } },
      },
      orderBy: [{ dueDate: "asc" }],
      take: 100,
    }),
    prisma.client.findMany({
      orderBy: [{ companyName: "asc" }],
      select: { id: true, companyName: true },
    }),
    prisma.workOrder.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: { id: true, code: true },
      take: 100,
    }),
  ]);

  const statusOptions = Object.values(InvoiceStatus).map((status) => ({
    value: status,
    label: enumLabel(status),
  }));

  return (
    <ResourceCrud
      title="Invoices"
      description="Create, update, and settle invoices with linked work orders."
      endpoint="/api/invoices"
      singularName="Invoice"
      initialItems={invoices}
      searchKeys={["invoiceNumber", "client.companyName", "workOrder.code", "notes"]}
      filters={[{ name: "status", label: "Status", options: statusOptions }]}
      defaultValues={{ status: "DRAFT" }}
      extraActions={[
        {
          label: "PDF",
          hrefTemplate: "/api/invoices/{id}/pdf",
          openInNewTab: true,
        },
        {
          label: "Apply Payment",
          hrefTemplate: "/api/invoices/{id}/payment",
          openInNewTab: true,
        },
      ]}
      columns={[
        { key: "invoiceNumber", label: "Invoice #" },
        { key: "client.companyName", label: "Client" },
        { key: "status", label: "Status", format: "pill" },
        { key: "amountCents", label: "Amount", format: "currency" },
        { key: "issuedAt", label: "Issued", format: "date" },
        { key: "dueDate", label: "Due", format: "date" },
        { key: "paidAt", label: "Paid", format: "date", empty: "-" },
        { key: "workOrder.code", label: "WO", empty: "-" },
      ]}
      fields={[
        { name: "invoiceNumber", label: "Invoice Number", type: "text" },
        { name: "amountCents", label: "Amount (Cents)", type: "number", required: true, valueType: "number" },
        { name: "status", label: "Status", type: "select", required: true, options: statusOptions },
        { name: "issuedAt", label: "Issued At", type: "date" },
        { name: "dueDate", label: "Due Date", type: "date", required: true },
        { name: "paidAt", label: "Paid At", type: "date" },
        { name: "notes", label: "Notes", type: "textarea" },
        {
          name: "clientId",
          label: "Client",
          type: "select",
          required: true,
          options: clients.map((client) => ({ value: client.id, label: client.companyName })),
        },
        {
          name: "workOrderId",
          label: "Work Order",
          type: "select",
          options: workOrders.map((workOrder) => ({ value: workOrder.id, label: workOrder.code })),
        },
      ]}
    />
  );
}
