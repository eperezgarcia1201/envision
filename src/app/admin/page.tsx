import type { Metadata } from "next";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/auth";
import { LogoutButton } from "@/components/forms/logout-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  description: "Internal admin console for leads, work orders, and client records.",
};

async function getAdminData() {
  try {
    const [leads, workOrders, clients] = await Promise.all([
      prisma.lead.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 12,
      }),
      prisma.workOrder.findMany({
        include: {
          client: { select: { companyName: true } },
          property: { select: { name: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 12,
      }),
      prisma.client.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 10,
      }),
    ]);

    return { leads, workOrders, clients };
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const currentUser = await requireRole(UserRole.ADMIN, "/admin");
  const data = await getAdminData();

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <p className="section-label">Admin Console</p>
          <h1 className="page-title">Internal Pipeline and Records</h1>
          <p className="page-lead">
            Signed in as <strong>{currentUser.username}</strong> ({currentUser.role}).
          </p>
          <div className="action-row" style={{ marginTop: "1rem" }}>
            <LogoutButton />
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          {!data ? (
            <p className="empty-state">
              Admin data is unavailable. Check database connectivity and seed records.
            </p>
          ) : (
            <div className="grid-3">
              <article className="panel" style={{ padding: "1rem" }}>
                <p className="section-label">Recent Leads</p>
                <h2 className="section-title">Lead Intake</h2>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.leads.map((lead) => (
                        <tr key={lead.id}>
                          <td>{lead.name}</td>
                          <td>
                            <span className="pill">{lead.status}</span>
                          </td>
                          <td>{formatDate(lead.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="panel" style={{ padding: "1rem" }}>
                <p className="section-label">Work Queue</p>
                <h2 className="section-title">Work Orders</h2>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Client / Property</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.workOrders.map((order) => (
                        <tr key={order.id}>
                          <td>{order.code}</td>
                          <td>{order.property?.name ?? order.client?.companyName ?? "Unassigned"}</td>
                          <td>
                            <span className="pill">{order.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="panel" style={{ padding: "1rem" }}>
                <p className="section-label">Clients</p>
                <h2 className="section-title">Account List</h2>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Tier</th>
                        <th>Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.clients.map((client) => (
                        <tr key={client.id}>
                          <td>{client.companyName}</td>
                          <td>
                            <span className="pill">{client.tier}</span>
                          </td>
                          <td>{client.contactName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
