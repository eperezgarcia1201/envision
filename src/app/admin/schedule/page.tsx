import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { formatDate, formatTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Schedule | CRM",
  description: "Dispatch board for field assignments.",
};

export default async function AdminSchedulePage() {
  const schedule = await prisma.scheduleItem.findMany({
    include: {
      employee: { select: { fullName: true } },
      client: { select: { companyName: true } },
      workOrder: { select: { code: true } },
      property: { select: { name: true } },
    },
    orderBy: [{ startAt: "asc" }],
    take: 80,
  });

  return (
    <div className="crm-stack">
      <section className="crm-panel">
        <div className="crm-section-head compact">
          <h1>Schedule</h1>
          <p>Daily dispatch windows with technician assignment context.</p>
        </div>
      </section>

      <section className="crm-panel">
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Title</th>
                <th>Service</th>
                <th>Technician</th>
                <th>Client / Property</th>
                <th>Status</th>
                <th>WO</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.startAt)}</td>
                  <td>
                    {formatTime(item.startAt)} - {formatTime(item.endAt)}
                  </td>
                  <td>{item.title}</td>
                  <td>{item.serviceType}</td>
                  <td>{item.employee?.fullName ?? "Unassigned"}</td>
                  <td>{item.property?.name ?? item.client?.companyName ?? item.location}</td>
                  <td>
                    <span className="pill">{enumLabel(item.status)}</span>
                  </td>
                  <td>{item.workOrder?.code ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
