import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Invoices | CRM",
  description: "Invoice lifecycle and receivable visibility.",
};

export default async function AdminInvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    include: {
      client: { select: { companyName: true } },
      workOrder: { select: { code: true } },
    },
    orderBy: [{ dueDate: "asc" }],
    take: 80,
  });

  return (
    <div className="crm-stack">
      <section className="crm-panel">
        <div className="crm-section-head compact">
          <h1>Invoices</h1>
          <p>Billing pipeline, due dates, and payment status.</p>
        </div>
      </section>

      <section className="crm-panel">
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Paid</th>
                <th>Work Order</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>{invoice.client.companyName}</td>
                  <td>
                    <span className="pill">{enumLabel(invoice.status)}</span>
                  </td>
                  <td>{formatCurrencyFromCents(invoice.amountCents)}</td>
                  <td>{formatDate(invoice.issuedAt)}</td>
                  <td>{formatDate(invoice.dueDate)}</td>
                  <td>{formatDate(invoice.paidAt)}</td>
                  <td>{invoice.workOrder?.code ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
