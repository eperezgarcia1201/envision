import type { Metadata } from "next";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Payments | CRM",
  description: "Collections, processor setup, and settlement tracking.",
};

export default async function AdminPaymentsPage() {
  const [payments, processors, invoices] = await Promise.all([
    prisma.paymentRecord.findMany({
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            client: { select: { companyName: true } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    }),
    prisma.paymentProcessor.findMany({
      orderBy: [{ name: "asc" }],
      take: 100,
    }),
    prisma.invoice.findMany({
      include: {
        client: { select: { companyName: true } },
      },
      orderBy: [{ dueDate: "asc" }],
      take: 200,
    }),
  ]);

  const statusOptions = Object.values(PaymentStatus).map((status) => ({
    value: status,
    label: enumLabel(status),
  }));

  const processorOptions = processors.length
    ? processors.map((processor) => ({ value: processor.name, label: processor.name }))
    : [
        { value: "Stripe", label: "Stripe" },
        { value: "Square", label: "Square" },
      ];

  return (
    <div className="crm-stack">
      <ResourceCrud
        title="Payment Records"
        description="Track payment attempts, settlements, and references against each invoice."
        endpoint="/api/payments"
        singularName="Payment"
        initialItems={payments}
        searchKeys={["invoice.invoiceNumber", "invoice.client.companyName", "processor", "externalReference"]}
        filters={[{ name: "status", label: "Status", options: statusOptions }]}
        defaultValues={{ status: "SETTLED" }}
        columns={[
          { key: "invoice.invoiceNumber", label: "Invoice #" },
          { key: "invoice.client.companyName", label: "Client" },
          { key: "amountCents", label: "Amount", format: "currency" },
          { key: "processor", label: "Processor" },
          { key: "status", label: "Status", format: "pill" },
          { key: "paidAt", label: "Paid At", format: "date", empty: "-" },
          { key: "externalReference", label: "Reference", empty: "-" },
        ]}
        fields={[
          {
            name: "invoiceId",
            label: "Invoice",
            type: "select",
            required: true,
            options: invoices.map((invoice) => ({
              value: invoice.id,
              label: `${invoice.invoiceNumber} - ${invoice.client.companyName}`,
            })),
          },
          { name: "amountCents", label: "Amount (Cents)", type: "number", required: true, valueType: "number" },
          { name: "processor", label: "Processor", type: "select", required: true, options: processorOptions },
          { name: "externalReference", label: "External Reference", type: "text" },
          { name: "status", label: "Status", type: "select", required: true, options: statusOptions },
          { name: "paidAt", label: "Paid At", type: "date" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />

      <ResourceCrud
        title="Payment Processors"
        description="Configure payment providers and webhook targets for future payment SDK integrations."
        endpoint="/api/payment-processors"
        singularName="Payment Processor"
        initialItems={processors}
        searchKeys={["name", "publishableKeyMasked", "webhookUrl"]}
        defaultValues={{ enabled: "false", sandboxMode: "true" }}
        columns={[
          { key: "name", label: "Name" },
          { key: "enabled", label: "Enabled", format: "boolean" },
          { key: "sandboxMode", label: "Sandbox", format: "boolean" },
          { key: "publishableKeyMasked", label: "API Key", empty: "-" },
          { key: "webhookUrl", label: "Webhook", empty: "-" },
        ]}
        fields={[
          { name: "name", label: "Name", type: "text", required: true },
          {
            name: "enabled",
            label: "Enabled",
            type: "select",
            required: true,
            valueType: "boolean",
            options: [
              { value: "false", label: "No" },
              { value: "true", label: "Yes" },
            ],
          },
          {
            name: "sandboxMode",
            label: "Sandbox Mode",
            type: "select",
            required: true,
            valueType: "boolean",
            options: [
              { value: "false", label: "No" },
              { value: "true", label: "Yes" },
            ],
          },
          { name: "publishableKeyMasked", label: "Publishable Key (Masked)", type: "text" },
          { name: "webhookUrl", label: "Webhook URL", type: "text" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
