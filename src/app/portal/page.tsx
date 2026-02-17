import type { Metadata } from "next";
import { InvoiceStatus, UserRole, WorkOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";
import { requireRole } from "@/lib/auth";
import { LogoutButton } from "@/components/forms/logout-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portal",
  description: "Operations dashboard for leads, work orders, and invoicing health.",
};

async function getPortalData() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [openWorkOrders, overdueInvoices, newLeads, paidThisMonth, upcomingOrders, recentInvoices] =
      await Promise.all([
        prisma.workOrder.count({
          where: {
            status: {
              in: [
                WorkOrderStatus.BACKLOG,
                WorkOrderStatus.SCHEDULED,
                WorkOrderStatus.IN_PROGRESS,
                WorkOrderStatus.ON_HOLD,
              ],
            },
          },
        }),
        prisma.invoice.count({
          where: {
            dueDate: { lt: now },
            status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] },
          },
        }),
        prisma.lead.count({
          where: {
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        prisma.invoice.aggregate({
          where: {
            status: InvoiceStatus.PAID,
            paidAt: { gte: monthStart },
          },
          _sum: {
            amountCents: true,
          },
        }),
        prisma.workOrder.findMany({
          where: {
            scheduledFor: { not: null },
            status: { in: [WorkOrderStatus.SCHEDULED, WorkOrderStatus.IN_PROGRESS] },
          },
          include: {
            property: { select: { name: true } },
            client: { select: { companyName: true } },
          },
          orderBy: [{ scheduledFor: "asc" }],
          take: 8,
        }),
        prisma.invoice.findMany({
          include: {
            client: { select: { companyName: true } },
          },
          orderBy: [{ dueDate: "asc" }],
          take: 8,
        }),
      ]);

    return {
      openWorkOrders,
      overdueInvoices,
      newLeads,
      paidThisMonth: paidThisMonth._sum.amountCents ?? 0,
      upcomingOrders,
      recentInvoices,
    };
  } catch {
    return null;
  }
}

export default async function PortalPage() {
  const currentUser = await requireRole(UserRole.ADMIN, "/portal");
  const data = await getPortalData();

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <p className="section-label">Operations Portal</p>
          <h1 className="page-title">Business Snapshot and Delivery Queue</h1>
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
              Dashboard data is unavailable right now. Confirm database configuration and run
              seeding.
            </p>
          ) : (
            <>
              <div className="kpi-grid">
                <article className="kpi-card">
                  <p className="kpi-label">Open Work Orders</p>
                  <p className="kpi-value">{data.openWorkOrders}</p>
                  <p className="kpi-sub">Backlog + active execution</p>
                </article>
                <article className="kpi-card">
                  <p className="kpi-label">Leads (30 Days)</p>
                  <p className="kpi-value">{data.newLeads}</p>
                  <p className="kpi-sub">Inbound opportunity volume</p>
                </article>
                <article className="kpi-card">
                  <p className="kpi-label">Overdue Invoices</p>
                  <p className="kpi-value">{data.overdueInvoices}</p>
                  <p className="kpi-sub">Requires follow-up</p>
                </article>
                <article className="kpi-card">
                  <p className="kpi-label">Paid This Month</p>
                  <p className="kpi-value">{formatCurrencyFromCents(data.paidThisMonth)}</p>
                  <p className="kpi-sub">Collected revenue</p>
                </article>
              </div>

              <div className="grid-2" style={{ marginTop: "1.1rem" }}>
                <article className="panel" style={{ padding: "1rem" }}>
                  <p className="section-label">Upcoming Jobs</p>
                  <h2 className="section-title">Scheduled Work Orders</h2>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Property</th>
                          <th>Status</th>
                          <th>Scheduled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.upcomingOrders.map((order) => (
                          <tr key={order.id}>
                            <td>{order.code}</td>
                            <td>{order.property?.name ?? order.client?.companyName ?? "Unassigned"}</td>
                            <td>
                              <span className="pill">{order.status}</span>
                            </td>
                            <td>{formatDate(order.scheduledFor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="panel" style={{ padding: "1rem" }}>
                  <p className="section-label">Billing Queue</p>
                  <h2 className="section-title">Invoice Pipeline</h2>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Invoice</th>
                          <th>Client</th>
                          <th>Status</th>
                          <th>Due Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentInvoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td>{invoice.invoiceNumber}</td>
                            <td>{invoice.client.companyName}</td>
                            <td>
                              <span className="pill">{invoice.status}</span>
                            </td>
                            <td>{formatDate(invoice.dueDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
