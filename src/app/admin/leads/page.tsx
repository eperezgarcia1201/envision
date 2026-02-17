import type { Metadata } from "next";
import { LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Leads | CRM",
  description: "Lead intake pipeline and qualification status.",
};

export default async function AdminLeadsPage() {
  const [leads, grouped] = await Promise.all([
    prisma.lead.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 80,
    }),
    prisma.lead.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    }),
  ]);

  const counts = Object.values(LeadStatus).map((status) => ({
    status,
    count: grouped.find((item) => item.status === status)?._count.id ?? 0,
  }));

  return (
    <div className="crm-stack">
      <section className="crm-panel">
        <div className="crm-section-head compact">
          <h1>Leads</h1>
          <p>Inbound opportunities and lifecycle progression.</p>
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
                <th>Name</th>
                <th>Company</th>
                <th>Service Needed</th>
                <th>Status</th>
                <th>Source</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.company ?? "N/A"}</td>
                  <td>{lead.serviceNeeded ?? "General Inquiry"}</td>
                  <td>
                    <span className="pill">{enumLabel(lead.status)}</span>
                  </td>
                  <td>{lead.source}</td>
                  <td>{formatDate(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
