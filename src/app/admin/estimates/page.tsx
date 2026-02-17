import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Estimates | CRM",
  description: "Estimate pipeline and proposal conversion tracking.",
};

export default async function AdminEstimatesPage() {
  const estimates = await prisma.estimate.findMany({
    include: {
      client: { select: { companyName: true } },
      property: { select: { name: true } },
      lead: { select: { name: true } },
      convertedWorkOrder: { select: { code: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 80,
  });

  return (
    <div className="crm-stack">
      <section className="crm-panel">
        <div className="crm-section-head compact">
          <h1>Estimates</h1>
          <p>Proposal status, value, and conversion visibility.</p>
        </div>
      </section>

      <section className="crm-panel">
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Estimate</th>
                <th>Title</th>
                <th>Client</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Valid Until</th>
                <th>Converted WO</th>
              </tr>
            </thead>
            <tbody>
              {estimates.map((estimate) => (
                <tr key={estimate.id}>
                  <td>{estimate.estimateNumber}</td>
                  <td>{estimate.title}</td>
                  <td>{estimate.client?.companyName ?? estimate.lead?.name ?? "Unassigned"}</td>
                  <td>
                    <span className="pill">{enumLabel(estimate.status)}</span>
                  </td>
                  <td>{formatCurrencyFromCents(estimate.amountCents)}</td>
                  <td>{formatDate(estimate.validUntil)}</td>
                  <td>{estimate.convertedWorkOrder?.code ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
