import type { Metadata } from "next";
import { CheckInType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Check-Ins | CRM",
  description: "Field mobile check-ins, GPS markers, and completion pings.",
};

export default async function AdminCheckInsPage() {
  const [checkIns, employees, scheduleItems] = await Promise.all([
    prisma.fieldCheckIn.findMany({
      include: {
        employee: { select: { fullName: true } },
        scheduleItem: { select: { title: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    }),
    prisma.employee.findMany({
      orderBy: [{ fullName: "asc" }],
      select: { id: true, fullName: true },
    }),
    prisma.scheduleItem.findMany({
      orderBy: [{ startAt: "desc" }],
      select: { id: true, title: true, startAt: true },
      take: 100,
    }),
  ]);

  const typeOptions = Object.values(CheckInType).map((type) => ({
    value: type,
    label: enumLabel(type),
  }));

  return (
    <ResourceCrud
      title="Field Check-Ins"
      description="Capture clock-ins, on-my-way notifications, arrivals, and completion events from mobile field workflows."
      endpoint="/api/check-ins"
      singularName="Check-In"
      initialItems={checkIns}
      searchKeys={["employee.fullName", "scheduleItem.title", "type", "notes"]}
      filters={[{ name: "type", label: "Type", options: typeOptions }]}
      defaultValues={{ type: "CLOCK_IN" }}
      columns={[
        { key: "type", label: "Type", format: "pill" },
        { key: "employee.fullName", label: "Employee" },
        { key: "scheduleItem.title", label: "Schedule", empty: "-" },
        { key: "latitude", label: "Lat", empty: "-" },
        { key: "longitude", label: "Lng", empty: "-" },
        { key: "createdAt", label: "Created", format: "datetime" },
      ]}
      fields={[
        { name: "type", label: "Type", type: "select", required: true, options: typeOptions },
        {
          name: "employeeId",
          label: "Employee",
          type: "select",
          required: true,
          options: employees.map((employee) => ({ value: employee.id, label: employee.fullName })),
        },
        {
          name: "scheduleItemId",
          label: "Schedule Item",
          type: "select",
          options: scheduleItems.map((item) => ({
            value: item.id,
            label: `${item.title} (${item.startAt.toLocaleDateString()})`,
          })),
        },
        {
          name: "latitude",
          label: "Latitude",
          type: "number",
          valueType: "number",
          step: "0.000001",
        },
        {
          name: "longitude",
          label: "Longitude",
          type: "number",
          valueType: "number",
          step: "0.000001",
        },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
