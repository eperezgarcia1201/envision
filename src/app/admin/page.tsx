import type { Metadata } from "next";
import { formatCurrencyFromCents, formatDate, formatTime } from "@/lib/format";
import { enumLabel, getCrmDashboardData, severityClassName } from "@/lib/crm";

export const metadata: Metadata = {
  title: "CRM Dashboard",
  description: "Operations command center for Envision Maintenence.",
};

function revenueBarHeight(amountCents: number, max: number) {
  if (max <= 0) {
    return 12;
  }

  return Math.max(12, Math.round((amountCents / max) * 100));
}

export default async function AdminDashboardPage() {
  const data = await getCrmDashboardData();
  const maxRevenue = Math.max(...data.revenueSeries.map((point) => point.amountCents), 1);

  return (
    <div className="crm-stack">
      <section className="crm-panel">
        <div className="crm-section-head">
          <h1>Company Dashboard</h1>
          <p>Live metrics for leads, delivery, billing, and field operations.</p>
        </div>

        <div className="crm-kpi-grid">
          <article className="crm-kpi-card">
            <p>New Leads</p>
            <strong>{data.metrics.newLeads}</strong>
            <span>Pipeline intake today</span>
          </article>
          <article className="crm-kpi-card">
            <p>In Estimates</p>
            <strong>{formatCurrencyFromCents(data.metrics.estimateValueCents)}</strong>
            <span>{data.metrics.activeEstimateCount} active estimates</span>
          </article>
          <article className="crm-kpi-card">
            <p>Open Work Orders</p>
            <strong>{data.metrics.openWorkOrdersCount}</strong>
            <span>Backlog + in progress</span>
          </article>
          <article className="crm-kpi-card">
            <p>Overdue Invoices</p>
            <strong>{data.metrics.overdueCount}</strong>
            <span>{formatCurrencyFromCents(data.metrics.overdueAmountCents)} overdue</span>
          </article>
        </div>
      </section>

      <section className="crm-main-columns">
        <div className="crm-stack">
          <article className="crm-panel">
            <div className="crm-section-head compact">
              <h2>Lead Pipeline</h2>
              <p>Current conversion stages</p>
            </div>
            <div className="crm-pipeline-row">
              {data.leadPipeline.map((item) => (
                <div key={item.status} className="crm-pipeline-pill">
                  <span>{enumLabel(item.status)}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="crm-panel">
            <div className="crm-section-head compact">
              <h2>Work Orders</h2>
              <p>Latest operational queue</p>
            </div>
            <div className="table-wrap" style={{ marginTop: "0.5rem" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Client / Property</th>
                    <th>Status</th>
                    <th>Technician</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {data.workOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.code}</td>
                      <td>{order.property?.name ?? order.client?.companyName ?? "Unassigned"}</td>
                      <td>
                        <span className="pill">{enumLabel(order.status)}</span>
                      </td>
                      <td>{order.assignedEmployee?.fullName ?? order.assignee ?? "Unassigned"}</td>
                      <td>{formatDate(order.scheduledFor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="crm-panel">
            <div className="crm-section-head compact">
              <h2>Company Activity</h2>
              <p>Most recent CRM events</p>
            </div>
            <div className="crm-activity-list">
              {data.activity.map((item) => (
                <article key={item.id} className="crm-activity-item">
                  <div>
                    <p>
                      <strong>{item.actorName}</strong> {item.action}
                    </p>
                    <small>{item.description}</small>
                  </div>
                  <div className="crm-activity-meta">
                    <span className={severityClassName(item.severity)}>{enumLabel(item.severity)}</span>
                    <small>{formatDate(item.createdAt)}</small>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>

        <div className="crm-stack">
          <article className="crm-panel">
            <div className="crm-section-head compact">
              <h2>Revenue (6 Months)</h2>
              <p>Paid invoice trend</p>
            </div>
            <div className="crm-revenue-chart">
              {data.revenueSeries.map((point) => (
                <div key={point.label} className="crm-revenue-col">
                  <div
                    className="crm-revenue-bar"
                    style={{ height: `${revenueBarHeight(point.amountCents, maxRevenue)}%` }}
                    title={`${point.label}: ${formatCurrencyFromCents(point.amountCents)}`}
                  />
                  <span>{point.label}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="crm-panel">
            <div className="crm-section-head compact">
              <h2>Schedule</h2>
              <p>Today&apos;s field dispatch</p>
            </div>
            <div className="crm-schedule-list">
              {data.scheduleToday.length === 0 ? (
                <p className="empty-state">No schedule items for today.</p>
              ) : (
                data.scheduleToday.map((item) => (
                  <article className="crm-schedule-item" key={item.id}>
                    <div className="crm-schedule-avatar">
                      {(item.employee?.fullName ?? "U").slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p>{item.employee?.fullName ?? "Unassigned"}</p>
                      <small>{item.serviceType}</small>
                    </div>
                    <div>
                      <p>
                        {formatTime(item.startAt)} - {formatTime(item.endAt)}
                      </p>
                      <small>{item.location}</small>
                    </div>
                  </article>
                ))
              )}
            </div>
          </article>

          <article className="crm-panel">
            <div className="crm-section-head compact">
              <h2>Top Clients</h2>
              <p>Revenue contributors</p>
            </div>
            <div className="crm-top-clients">
              {data.topClientsByRevenue.map((client) => (
                <article key={client.clientId} className="crm-client-row">
                  <span>{client.companyName}</span>
                  <strong>{formatCurrencyFromCents(client.revenueCents)}</strong>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
