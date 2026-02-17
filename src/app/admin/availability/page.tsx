import type { Metadata } from "next";
import { AvailabilityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Availability | CRM",
  description: "Employee availability, time-off windows, and dispatch constraints.",
};

export default async function AdminAvailabilityPage() {
  const [blocks, employees] = await Promise.all([
    prisma.availabilityBlock.findMany({
      include: {
        employee: { select: { fullName: true } },
      },
      orderBy: [{ startAt: "asc" }],
      take: 120,
    }),
    prisma.employee.findMany({
      orderBy: [{ fullName: "asc" }],
      select: { id: true, fullName: true },
    }),
  ]);

  const typeOptions = Object.values(AvailabilityType).map((type) => ({
    value: type,
    label: enumLabel(type),
  }));

  return (
    <ResourceCrud
      title="Availability Blocks"
      description="Control field assignment windows by tracking blocked time, approved PTO, and known availability."
      endpoint="/api/availability"
      singularName="Availability Block"
      initialItems={blocks}
      searchKeys={["employee.fullName", "type", "reason"]}
      filters={[{ name: "type", label: "Type", options: typeOptions }]}
      defaultValues={{ type: "BLOCKED", approved: "false" }}
      columns={[
        { key: "employee.fullName", label: "Employee" },
        { key: "type", label: "Type", format: "pill" },
        { key: "startAt", label: "Start", format: "datetime" },
        { key: "endAt", label: "End", format: "datetime" },
        { key: "approved", label: "Approved", format: "boolean" },
        { key: "reason", label: "Reason", empty: "-" },
      ]}
      fields={[
        {
          name: "employeeId",
          label: "Employee",
          type: "select",
          required: true,
          options: employees.map((employee) => ({ value: employee.id, label: employee.fullName })),
        },
        { name: "type", label: "Type", type: "select", required: true, options: typeOptions },
        { name: "startAt", label: "Start At", type: "datetime-local", required: true },
        { name: "endAt", label: "End At", type: "datetime-local", required: true },
        { name: "reason", label: "Reason", type: "textarea" },
        {
          name: "approved",
          label: "Approved",
          type: "select",
          required: true,
          valueType: "boolean",
          options: [
            { value: "false", label: "No" },
            { value: "true", label: "Yes" },
          ],
        },
      ]}
    />
  );
}
