import type { Metadata } from "next";
import { enumLabel, getReportsData } from "@/lib/crm";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Reports | CRM",
  description: "Quarterly financial and operational reporting summaries.",
};

export default async function AdminReportsPage() {
  const reports = await getReportsData();

  return (
    <div className="crm-stack">
      <section className="crm-panel">
        <div className="crm-section-head compact">
          <h1>Reports</h1>
          <p>Quarterly summary since {formatDate(reports.quarterStart)}.</p>
        </div>
        <div className="crm-kpi-grid" style={{ marginTop: "0.8rem" }}>
          <article className="crm-kpi-card">
            <p>Total Invoiced</p>
            <strong>{formatCurrencyFromCents(reports.invoiceAgg._sum.amountCents ?? 0)}</strong>
            <span>{reports.invoiceAgg._count.id} invoices</span>
          </article>
          <article className="crm-kpi-card">
            <p>Total Paid</p>
            <strong>{formatCurrencyFromCents(reports.paidAgg._sum.amountCents ?? 0)}</strong>
            <span>{reports.paidAgg._count.id} paid invoices</span>
          </article>
          <article className="crm-kpi-card">
            <p>Overdue Invoices</p>
            <strong>{reports.overdueCount}</strong>
            <span>Action required</span>
          </article>
        </div>
      </section>

      <section className="crm-main-columns" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <article className="crm-panel">
          <div className="crm-section-head compact">
            <h2>Estimate Breakdown</h2>
            <p>By status and value</p>
          </div>
          <div className="crm-activity-list">
            {reports.estimates.map((item) => (
              <article key={item.status} className="crm-client-row">
                <span>{enumLabel(item.status)}</span>
                <strong>{item._count.id}</strong>
                <small>{formatCurrencyFromCents(item._sum.amountCents ?? 0)}</small>
              </article>
            ))}
          </div>
        </article>

        <article className="crm-panel">
          <div className="crm-section-head compact">
            <h2>Lead Breakdown</h2>
            <p>By lifecycle stage</p>
          </div>
          <div className="crm-activity-list">
            {reports.leads.map((item) => (
              <article key={item.status} className="crm-client-row">
                <span>{enumLabel(item.status)}</span>
                <strong>{item._count.id}</strong>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="crm-panel">
        <div className="crm-section-head compact">
          <h2>Work Order Status Mix</h2>
          <p>Operational workload distribution</p>
        </div>
        <div className="crm-pipeline-row" style={{ marginTop: "0.8rem" }}>
          {reports.workOrders.map((item) => (
            <div key={item.status} className="crm-pipeline-pill">
              <span>{enumLabel(item.status)}</span>
              <strong>{item._count.id}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
