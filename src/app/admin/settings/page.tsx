import type { Metadata } from "next";
import { enumLabel, getSettingsData } from "@/lib/crm";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Settings | CRM",
  description: "Platform modules, user accounts, and operational configuration summary.",
};

export default async function AdminSettingsPage() {
  const settings = await getSettingsData();

  return (
    <div className="crm-stack">
      <section className="crm-panel">
        <div className="crm-section-head compact">
          <h1>Settings</h1>
          <p>Platform inventory and access baseline.</p>
        </div>
        <div className="crm-kpi-grid" style={{ marginTop: "0.8rem" }}>
          <article className="crm-kpi-card">
            <p>Clients</p>
            <strong>{settings.counts.clients}</strong>
          </article>
          <article className="crm-kpi-card">
            <p>Employees</p>
            <strong>{settings.counts.employees}</strong>
          </article>
          <article className="crm-kpi-card">
            <p>Work Orders</p>
            <strong>{settings.counts.workOrders}</strong>
          </article>
          <article className="crm-kpi-card">
            <p>Service Packages</p>
            <strong>{settings.packageCount}</strong>
          </article>
        </div>
      </section>

      <section className="crm-main-columns" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <article className="crm-panel">
          <div className="crm-section-head compact">
            <h2>User Accounts</h2>
            <p>Role assignments</p>
          </div>
          <div className="table-wrap" style={{ marginTop: "0.5rem" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {settings.userAccounts.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.fullName ?? "-"}</td>
                    <td>
                      <span className="pill">{enumLabel(user.role)}</span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="crm-panel">
          <div className="crm-section-head compact">
            <h2>Service Packages</h2>
            <p>Published commercial offerings</p>
          </div>
          <div className="crm-activity-list">
            {settings.services.map((service) => (
              <article key={service.id} className="crm-activity-item">
                <div>
                  <p>
                    <strong>{service.name}</strong>
                  </p>
                  <small>{service.summary}</small>
                </div>
                <div className="crm-activity-meta">
                  <span className="pill">{service.startingPrice}</span>
                  <small>{service.coverageArea}</small>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
