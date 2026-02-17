import type { Metadata } from "next";
import { OnboardingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Onboarding | CRM",
  description: "Client onboarding task management and rollout tracking.",
};

export default async function AdminOnboardingPage() {
  const [tasks, clients] = await Promise.all([
    prisma.onboardingTask.findMany({
      include: {
        client: { select: { companyName: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.client.findMany({
      orderBy: [{ companyName: "asc" }],
      select: { id: true, companyName: true },
    }),
  ]);

  const statusOptions = Object.values(OnboardingStatus).map((status) => ({
    value: status,
    label: enumLabel(status),
  }));

  return (
    <ResourceCrud
      title="Onboarding Tasks"
      description="Track kickoff checklists, account migrations, and go-live readiness for new accounts."
      endpoint="/api/onboarding"
      singularName="Onboarding Task"
      initialItems={tasks}
      searchKeys={["title", "owner", "client.companyName", "notes"]}
      filters={[{ name: "status", label: "Status", options: statusOptions }]}
      defaultValues={{ status: "PENDING" }}
      columns={[
        { key: "title", label: "Task" },
        { key: "client.companyName", label: "Client", empty: "Internal" },
        { key: "owner", label: "Owner", empty: "Unassigned" },
        { key: "status", label: "Status", format: "pill" },
        { key: "dueDate", label: "Due", format: "date", empty: "-" },
        { key: "completedAt", label: "Completed", format: "date", empty: "-" },
      ]}
      fields={[
        { name: "title", label: "Task", type: "text", required: true },
        { name: "owner", label: "Owner", type: "text" },
        { name: "status", label: "Status", type: "select", required: true, options: statusOptions },
        { name: "dueDate", label: "Due Date", type: "date" },
        { name: "completedAt", label: "Completed At", type: "date" },
        { name: "notes", label: "Notes", type: "textarea" },
        {
          name: "clientId",
          label: "Client",
          type: "select",
          options: clients.map((client) => ({ value: client.id, label: client.companyName })),
        },
      ]}
    />
  );
}
