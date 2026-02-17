import type { Metadata } from "next";
import { WorkOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Work Orders | CRM",
  description: "Operational work order queue and assignment tracking.",
};

export default async function AdminWorkOrdersPage() {
  const [orders, grouped] = await Promise.all([
    prisma.workOrder.findMany({
      include: {
        client: { select: { companyName: true } },
        property: { select: { name: true } },
        assignedEmployee: { select: { fullName: true } },
      },
      orderBy: [{ scheduledFor: "asc" }, { updatedAt: "desc" }],
      take: 80,
    }),
    prisma.workOrder.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    }),
  ]);

  const counts = Object.values(WorkOrderStatus).map((status) => ({
    status,
    count: grouped.find((item) => item.status === status)?._count.id ?? 0,
  }));

  return (
    <div className="crm-stack">
      <section className="crm-panel">
        <div className="crm-section-head compact">
          <h1>Work Orders</h1>
          <p>Execution queue across properties and field teams.</p>
        </div>
        <div className="crm-pipeline-row" style={{ marginTop: "0.8rem" }}>
          {counts.map((item) => (
            <div key={item.status} className="crm-pipeline-pill">
              <span>{enumLabel(item.status)}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="crm-panel">
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Title</th>
                <th>Client / Property</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Scheduled</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.code}</td>
                  <td>{order.title}</td>
                  <td>{order.property?.name ?? order.client?.companyName ?? "Unassigned"}</td>
                  <td>
                    <span className="pill">{enumLabel(order.priority)}</span>
                  </td>
                  <td>
                    <span className="pill">{enumLabel(order.status)}</span>
                  </td>
                  <td>{order.assignedEmployee?.fullName ?? order.assignee ?? "Unassigned"}</td>
                  <td>{formatDate(order.scheduledFor)}</td>
                  <td>
                    {order.estimatedValueCents ? formatCurrencyFromCents(order.estimatedValueCents) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
