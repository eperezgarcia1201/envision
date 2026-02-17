import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Properties | CRM",
  description: "Managed properties, managers, and operational coverage.",
};

export default async function AdminPropertiesPage() {
  const properties = await prisma.property.findMany({
    include: {
      client: { select: { companyName: true } },
      _count: {
        select: {
          workOrders: true,
          estimates: true,
          scheduleItems: true,
        },
      },
    },
    orderBy: [{ city: "asc" }, { name: "asc" }],
    take: 80,
  });

  return (
    <div className="crm-stack">
      <section className="crm-panel">
        <div className="crm-section-head compact">
          <h1>Properties</h1>
          <p>Sites, managers, and linked operations activity.</p>
        </div>
      </section>

      <section className="crm-panel">
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Client</th>
                <th>Address</th>
                <th>Manager</th>
                <th>Contact</th>
                <th>Work Orders</th>
                <th>Estimates</th>
                <th>Schedule</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id}>
                  <td>{property.name}</td>
                  <td>{property.client?.companyName ?? "Unassigned"}</td>
                  <td>
                    {property.addressLine1}, {property.city}, {property.state} {property.zipCode}
                  </td>
                  <td>{property.managerName}</td>
                  <td>
                    {property.managerEmail}
                    <br />
                    {property.managerPhone}
                  </td>
                  <td>{property._count.workOrders}</td>
                  <td>{property._count.estimates}</td>
                  <td>{property._count.scheduleItems}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
