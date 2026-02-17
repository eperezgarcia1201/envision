import type { Metadata } from "next";
import { PayrollStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Payroll | CRM",
  description: "Payroll period management, gross calculations, and employee pay entries.",
};

export default async function AdminPayrollPage() {
  const [runs, entries, employees] = await Promise.all([
    prisma.payrollRun.findMany({
      include: {
        _count: { select: { entries: true } },
      },
      orderBy: [{ periodEnd: "desc" }],
      take: 100,
    }),
    prisma.payrollEntry.findMany({
      include: {
        employee: { select: { fullName: true } },
        payrollRun: { select: { periodStart: true, periodEnd: true, status: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    }),
    prisma.employee.findMany({
      orderBy: [{ fullName: "asc" }],
      select: { id: true, fullName: true },
    }),
  ]);

  const runStatusOptions = Object.values(PayrollStatus).map((status) => ({
    value: status,
    label: enumLabel(status),
  }));

  return (
    <div className="crm-stack">
      <ResourceCrud
        title="Payroll Runs"
        description="Manage payroll periods and approval lifecycle before disbursement."
        endpoint="/api/payroll-runs"
        singularName="Payroll Run"
        initialItems={runs}
        searchKeys={["status", "notes"]}
        filters={[{ name: "status", label: "Status", options: runStatusOptions }]}
        defaultValues={{ status: "DRAFT", totalGrossCents: "0" }}
        columns={[
          { key: "periodStart", label: "Period Start", format: "date" },
          { key: "periodEnd", label: "Period End", format: "date" },
          { key: "status", label: "Status", format: "pill" },
          { key: "totalGrossCents", label: "Gross", format: "currency" },
          { key: "_count.entries", label: "Entries" },
          { key: "processedAt", label: "Processed", format: "date", empty: "-" },
        ]}
        fields={[
          { name: "periodStart", label: "Period Start", type: "date", required: true },
          { name: "periodEnd", label: "Period End", type: "date", required: true },
          { name: "status", label: "Status", type: "select", required: true, options: runStatusOptions },
          {
            name: "totalGrossCents",
            label: "Total Gross (Cents)",
            type: "number",
            valueType: "number",
            required: true,
          },
          { name: "processedAt", label: "Processed At", type: "date" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />

      <ResourceCrud
        title="Payroll Entries"
        description="Line-level payroll records per employee, including hours, rates, and bonuses."
        endpoint="/api/payroll-entries"
        singularName="Payroll Entry"
        initialItems={entries}
        searchKeys={["employee.fullName", "payrollRun.status", "notes"]}
        defaultValues={{ bonusCents: "0", hoursWorked: "8", baseRateCents: "3000", grossCents: "24000" }}
        columns={[
          { key: "employee.fullName", label: "Employee" },
          { key: "hoursWorked", label: "Hours" },
          { key: "baseRateCents", label: "Base Rate", format: "currency" },
          { key: "bonusCents", label: "Bonus", format: "currency" },
          { key: "grossCents", label: "Gross", format: "currency" },
          { key: "payrollRun.status", label: "Run", format: "pill" },
        ]}
        fields={[
          {
            name: "payrollRunId",
            label: "Payroll Run",
            type: "select",
            required: true,
            options: runs.map((run) => ({
              value: run.id,
              label: `${run.periodStart.toLocaleDateString()} - ${run.periodEnd.toLocaleDateString()}`,
            })),
          },
          {
            name: "employeeId",
            label: "Employee",
            type: "select",
            required: true,
            options: employees.map((employee) => ({ value: employee.id, label: employee.fullName })),
          },
          { name: "hoursWorked", label: "Hours Worked", type: "number", required: true, valueType: "number" },
          {
            name: "baseRateCents",
            label: "Base Rate (Cents)",
            type: "number",
            required: true,
            valueType: "number",
          },
          { name: "bonusCents", label: "Bonus (Cents)", type: "number", required: true, valueType: "number" },
          { name: "grossCents", label: "Gross (Cents)", type: "number", required: true, valueType: "number" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
