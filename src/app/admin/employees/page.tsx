import type { Metadata } from "next";
import { EmployeeRole, EmployeeStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Employees | CRM",
  description: "Team members, assignments, and workforce status.",
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
    take: 100,
  });

  const roleOptions = Object.values(EmployeeRole).map((role) => ({
    value: role,
    label: enumLabel(role),
  }));

  const statusOptions = Object.values(EmployeeStatus).map((status) => ({
    value: status,
    label: enumLabel(status),
  }));

  return (
    <ResourceCrud
      title="Employees"
      description="Maintain workforce records and assignment capacity."
      endpoint="/api/employees"
      singularName="Employee"
      initialItems={employees}
      searchKeys={["fullName", "email", "phone", "territory", "role"]}
      filters={[
        { name: "role", label: "Role", options: roleOptions },
        { name: "status", label: "Status", options: statusOptions },
      ]}
      defaultValues={{ role: "FIELD_TECH", status: "ACTIVE" }}
      columns={[
        { key: "fullName", label: "Name" },
        { key: "role", label: "Role", format: "pill" },
        { key: "status", label: "Status", format: "pill" },
        { key: "territory", label: "Territory", empty: "-" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "_count.workOrders", label: "Work Orders" },
        { key: "_count.scheduleItems", label: "Schedule" },
      ]}
      fields={[
        { name: "fullName", label: "Full Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel", required: true },
        { name: "role", label: "Role", type: "select", required: true, options: roleOptions },
        { name: "status", label: "Status", type: "select", required: true, options: statusOptions },
        { name: "territory", label: "Territory", type: "text" },
        { name: "avatarUrl", label: "Avatar URL", type: "text" },
      ]}
    />
  );
}
