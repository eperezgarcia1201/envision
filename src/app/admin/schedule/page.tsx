import type { Metadata } from "next";
import { ScheduleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Schedule | CRM",
  description: "Dispatch timeline and technician assignment board.",
};

export default async function AdminSchedulePage() {
  const [scheduleItems, employees, workOrders, clients, properties] = await Promise.all([
    prisma.scheduleItem.findMany({
      include: {
        employee: { select: { fullName: true } },
        workOrder: { select: { code: true } },
        client: { select: { companyName: true } },
        property: { select: { name: true } },
      },
      orderBy: [{ startAt: "asc" }],
      take: 100,
    }),
    prisma.employee.findMany({
      orderBy: [{ fullName: "asc" }],
      select: { id: true, fullName: true },
    }),
    prisma.workOrder.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: { id: true, code: true },
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
  ]);

  const statusOptions = Object.values(ScheduleStatus).map((status) => ({
    value: status,
    label: enumLabel(status),
  }));

  return (
    <ResourceCrud
      title="Schedule"
      description="Create and adjust dispatch windows with linked work orders."
      endpoint="/api/schedule"
      singularName="Schedule Item"
      initialItems={scheduleItems}
      searchKeys={[
        "title",
        "serviceType",
        "location",
        "employee.fullName",
        "client.companyName",
        "workOrder.code",
      ]}
      filters={[{ name: "status", label: "Status", options: statusOptions }]}
      defaultValues={{ status: "SCHEDULED" }}
      columns={[
        { key: "startAt", label: "Start", format: "datetime" },
        { key: "endAt", label: "End", format: "datetime" },
        { key: "title", label: "Title" },
        { key: "serviceType", label: "Service" },
        { key: "employee.fullName", label: "Technician", empty: "Unassigned" },
        { key: "status", label: "Status", format: "pill" },
        { key: "location", label: "Location" },
        { key: "workOrder.code", label: "WO", empty: "-" },
      ]}
      fields={[
        { name: "title", label: "Title", type: "text", required: true },
        { name: "serviceType", label: "Service Type", type: "text", required: true },
        { name: "startAt", label: "Start At", type: "datetime-local", required: true },
        { name: "endAt", label: "End At", type: "datetime-local", required: true },
        { name: "status", label: "Status", type: "select", required: true, options: statusOptions },
        { name: "location", label: "Location", type: "text", required: true },
        { name: "notes", label: "Notes", type: "textarea" },
        {
          name: "employeeId",
          label: "Employee",
          type: "select",
          options: employees.map((employee) => ({ value: employee.id, label: employee.fullName })),
        },
        {
          name: "workOrderId",
          label: "Work Order",
          type: "select",
          options: workOrders.map((workOrder) => ({ value: workOrder.id, label: workOrder.code })),
        },
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
