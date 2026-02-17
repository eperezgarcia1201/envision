import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Clients | CRM",
  description: "Client accounts and portfolio coverage.",
};

export default async function AdminClientsPage() {
  const clients = await prisma.client.findMany({
    include: {
      _count: {
        select: {
          properties: true,
          workOrders: true,
          invoices: true,
          estimates: true,
        },
      },
    },
    orderBy: [{ companyName: "asc" }],
    take: 80,
  });

  return (
    <div className="crm-stack">
      <section className="crm-panel">
        <div className="crm-section-head compact">
          <h1>Clients</h1>
          <p>Account tiers, contacts, and service footprint.</p>
        </div>
      </section>

      <section className="crm-panel">
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Tier</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Properties</th>
                <th>Work Orders</th>
                <th>Invoices</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.companyName}</td>
                  <td>{client.contactName}</td>
                  <td>
                    <span className="pill">{client.tier}</span>
                  </td>
                  <td>{client.email}</td>
                  <td>{client.phone}</td>
                  <td>{client._count.properties}</td>
                  <td>{client._count.workOrders}</td>
                  <td>{client._count.invoices}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
