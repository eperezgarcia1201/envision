import type { Metadata } from "next";
import { Priority, WorkOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Work Orders | CRM",
  description: "Create, assign, and track operational work orders.",
};

export default async function AdminWorkOrdersPage() {
  const [orders, clients, properties, employees] = await Promise.all([
    prisma.workOrder.findMany({
      include: {
        client: { select: { companyName: true } },
        property: { select: { name: true } },
        assignedEmployee: { select: { fullName: true } },
      },
      orderBy: [{ scheduledFor: "asc" }, { updatedAt: "desc" }],
      take: 100,
    }),
    prisma.client.findMany({
      orderBy: [{ companyName: "asc" }],
      select: { id: true, companyName: true },
    }),
    prisma.property.findMany({
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.employee.findMany({
      orderBy: [{ fullName: "asc" }],
      select: { id: true, fullName: true },
    }),
  ]);

  const statusOptions = Object.values(WorkOrderStatus).map((status) => ({
    value: status,
    label: enumLabel(status),
  }));

  const priorityOptions = Object.values(Priority).map((priority) => ({
    value: priority,
    label: enumLabel(priority),
  }));

  return (
    <ResourceCrud
      title="Work Orders"
      description="Manage dispatch, assignment, and completion for every job."
      endpoint="/api/work-orders"
      singularName="Work Order"
      initialItems={orders}
      searchKeys={["code", "title", "description", "assignee", "locationLabel", "client.companyName", "property.name"]}
      filters={[
        { name: "status", label: "Status", options: statusOptions },
        { name: "priority", label: "Priority", options: priorityOptions },
      ]}
      defaultValues={{ status: "BACKLOG", priority: "MEDIUM" }}
      columns={[
        { key: "code", label: "Code" },
        { key: "title", label: "Title" },
        { key: "client.companyName", label: "Client", empty: "Unassigned" },
        { key: "priority", label: "Priority", format: "pill" },
        { key: "status", label: "Status", format: "pill" },
        { key: "assignee", label: "Assignee", empty: "Unassigned" },
        { key: "scheduledFor", label: "Scheduled", format: "datetime", empty: "TBD" },
        { key: "estimatedValueCents", label: "Value", format: "currency", empty: "-" },
      ]}
      fields={[
        { name: "title", label: "Title", type: "text", required: true },
        { name: "description", label: "Description", type: "textarea", required: true },
        { name: "priority", label: "Priority", type: "select", required: true, options: priorityOptions },
        { name: "status", label: "Status", type: "select", required: true, options: statusOptions },
        { name: "assignee", label: "Assignee Label", type: "text" },
        {
          name: "assignedEmployeeId",
          label: "Assigned Employee",
          type: "select",
          options: employees.map((employee) => ({ value: employee.id, label: employee.fullName })),
        },
        { name: "estimatedHours", label: "Estimated Hours", type: "number", valueType: "number", step: "1" },
        { name: "actualHours", label: "Actual Hours", type: "number", valueType: "number", step: "1" },
        {
          name: "estimatedValueCents",
          label: "Estimated Value (Cents)",
          type: "number",
          valueType: "number",
          step: "1",
        },
        { name: "locationLabel", label: "Location Label", type: "text" },
        { name: "scheduledFor", label: "Scheduled For", type: "datetime-local" },
        { name: "completedAt", label: "Completed At", type: "datetime-local" },
        {
          name: "clientId",
          label: "Client",
          type: "select",
          options: clients.map((client) => ({ value: client.id, label: client.companyName })),
        },
        {
          name: "propertyId",
          label: "Property",
          type: "select",
          options: properties.map((property) => ({ value: property.id, label: property.name })),
        },
      ]}
    />
  );
}
