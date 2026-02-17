import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";

export const metadata: Metadata = {
  title: "Employees | CRM",
  description: "Technician and operations team capacity overview.",
};

export default async function AdminEmployeesPage() {
  const employees = await prisma.employee.findMany({
    include: {
      _count: {
        select: {
          workOrders: true,
          scheduleItems: true,
        },
      },
    },
    orderBy: [{ fullName: "asc" }],
    take: 80,
  });

  return (
    <div className="crm-stack">
      <section className="crm-panel">
        <div className="crm-section-head compact">
          <h1>Employees</h1>
          <p>Field and operations staffing across territories.</p>
        </div>
      </section>

      <section className="crm-panel">
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Territory</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Work Orders</th>
                <th>Schedule Items</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.fullName}</td>
                  <td>
                    <span className="pill">{enumLabel(employee.role)}</span>
                  </td>
                  <td>
                    <span className="pill">{enumLabel(employee.status)}</span>
                  </td>
                  <td>{employee.territory ?? "-"}</td>
                  <td>{employee.email}</td>
                  <td>{employee.phone}</td>
                  <td>{employee._count.workOrders}</td>
                  <td>{employee._count.scheduleItems}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
