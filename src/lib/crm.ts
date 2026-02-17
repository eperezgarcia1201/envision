import {
  BookingStatus,
  CampaignStatus,
  EstimateStatus,
  InvoiceStatus,
  LeadStatus,
  MessageStatus,
  OnboardingStatus,
  type Prisma,
  WorkOrderStatus,
  type ActivitySeverity,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function enumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function severityClassName(severity: ActivitySeverity) {
  if (severity === "SUCCESS") return "pill tone-success";
  if (severity === "WARNING") return "pill tone-warning";
  if (severity === "URGENT") return "pill tone-danger";
  return "pill";
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "short" });
}

type RevenueSeriesPoint = {
  label: string;
  amountCents: number;
};

function buildRevenueSeries(invoices: Array<{ paidAt: Date | null; amountCents: number }>) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: monthKey(date),
      label: monthLabel(date),
    };
  });

  const monthMap = new Map(months.map((month) => [month.key, 0]));

  for (const invoice of invoices) {
    if (!invoice.paidAt) {
      continue;
    }

    const key = monthKey(invoice.paidAt);

    if (!monthMap.has(key)) {
      continue;
    }

    monthMap.set(key, (monthMap.get(key) ?? 0) + invoice.amountCents);
  }

  return months.map<RevenueSeriesPoint>((month) => ({
    label: month.label,
    amountCents: monthMap.get(month.key) ?? 0,
  }));
}

export async function getCrmDashboardData() {
  const now = new Date();
  const activeEstimateStatuses = new Set<EstimateStatus>([
    EstimateStatus.DRAFT,
    EstimateStatus.SENT,
    EstimateStatus.APPROVED,
  ]);
  const overdueInvoiceStatuses = new Set<InvoiceStatus>([
    InvoiceStatus.SENT,
    InvoiceStatus.PARTIAL,
    InvoiceStatus.OVERDUE,
  ]);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    leads,
    estimates,
    invoices,
    paidInvoices,
    workOrders,
    scheduleToday,
    activity,
    clients,
    paidByClient,
    openWorkOrdersCount,
    workOrderStatusGroups,
    invoiceStatusGroups,
    activeBookingsCount,
    onboardingOpenCount,
    queuedMessagesCount,
    activeAutomationCount,
  ] = await Promise.all([
    prisma.lead.findMany({
      select: {
        id: true,
        status: true,
      },
    }),
    prisma.estimate.findMany({
      select: {
        id: true,
        status: true,
        amountCents: true,
      },
    }),
    prisma.invoice.findMany({
      include: {
        client: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: [{ dueDate: "asc" }],
      take: 30,
    }),
    prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PAID,
        paidAt: {
          gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
        },
      },
      select: {
        amountCents: true,
        paidAt: true,
      },
    }),
    prisma.workOrder.findMany({
      include: {
        client: { select: { companyName: true } },
        property: { select: { name: true } },
        assignedEmployee: { select: { fullName: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 12,
    }),
    prisma.scheduleItem.findMany({
      where: {
        startAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        employee: { select: { fullName: true, avatarUrl: true } },
        client: { select: { companyName: true } },
      },
      orderBy: [{ startAt: "asc" }],
      take: 10,
    }),
    prisma.activityLog.findMany({
      include: {
        client: { select: { companyName: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 8,
    }),
    prisma.client.findMany({
      select: {
        id: true,
        companyName: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PAID,
      },
      select: {
        amountCents: true,
        clientId: true,
      },
    }),
    prisma.workOrder.count({
      where: {
        status: {
          in: [
            WorkOrderStatus.BACKLOG,
            WorkOrderStatus.SCHEDULED,
            WorkOrderStatus.IN_PROGRESS,
            WorkOrderStatus.ON_HOLD,
          ],
        },
      },
    }),
    prisma.workOrder.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    }),
    prisma.bookingRequest.count({
      where: {
        status: {
          in: [BookingStatus.NEW, BookingStatus.REVIEWED, BookingStatus.QUOTED],
        },
      },
    }),
    prisma.onboardingTask.count({
      where: {
        status: {
          in: [OnboardingStatus.PENDING, OnboardingStatus.IN_PROGRESS, OnboardingStatus.BLOCKED],
        },
      },
    }),
    prisma.messageLog.count({
      where: {
        status: MessageStatus.QUEUED,
      },
    }),
    prisma.automationRule.count({
      where: {
        status: CampaignStatus.ACTIVE,
      },
    }),
  ]);

  const leadPipeline = Object.values(LeadStatus).map((status) => ({
    status,
    count: leads.filter((lead) => lead.status === status).length,
  }));

  const activeEstimateCount = estimates.filter((estimate) =>
    activeEstimateStatuses.has(estimate.status),
  ).length;

  const estimateValueCents = estimates.reduce((sum, estimate) => sum + estimate.amountCents, 0);

  const overdueInvoices = invoices.filter(
    (invoice) => invoice.dueDate < now && overdueInvoiceStatuses.has(invoice.status),
  );

  const overdueAmountCents = overdueInvoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);

  const topClientsByRevenue = clients
    .map((client) => ({
      clientId: client.id,
      companyName: client.companyName,
      revenueCents: paidByClient
        .filter((invoice) => invoice.clientId === client.id)
        .reduce((sum, invoice) => sum + invoice.amountCents, 0),
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

  const revenueSeries = buildRevenueSeries(paidInvoices);
  const workOrderStatusBreakdown = Object.values(WorkOrderStatus).map((status) => ({
    status,
    count: workOrderStatusGroups.find((item) => item.status === status)?._count.id ?? 0,
  }));
  const invoiceStatusBreakdown = Object.values(InvoiceStatus).map((status) => ({
    status,
    count: invoiceStatusGroups.find((item) => item.status === status)?._count.id ?? 0,
  }));

  return {
    metrics: {
      newLeads: leadPipeline.find((item) => item.status === LeadStatus.NEW)?.count ?? 0,
      estimateValueCents,
      activeEstimateCount,
      invoiceCount: invoices.length,
      overdueAmountCents,
      overdueCount: overdueInvoices.length,
      openWorkOrdersCount,
      activeBookingsCount,
      onboardingOpenCount,
      queuedMessagesCount,
      activeAutomationCount,
    },
    leadPipeline,
    revenueSeries,
    workOrderStatusBreakdown,
    invoiceStatusBreakdown,
    workOrders,
    scheduleToday,
    activity,
    topClientsByRevenue,
  };
}

export async function getCrmModuleData() {
  const [leads, workOrders, clients, estimates, invoices, employees, scheduleItems, activityLogs] =
    await Promise.all([
      prisma.lead.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 50,
      }),
      prisma.workOrder.findMany({
        include: {
          client: { select: { companyName: true } },
          property: { select: { name: true } },
          assignedEmployee: { select: { fullName: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 50,
      }),
      prisma.client.findMany({
        include: {
          _count: {
            select: {
              properties: true,
              workOrders: true,
              invoices: true,
            },
          },
        },
        orderBy: [{ companyName: "asc" }],
        take: 50,
      }),
      prisma.estimate.findMany({
        include: {
          client: { select: { companyName: true } },
          property: { select: { name: true } },
          lead: { select: { name: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 50,
      }),
      prisma.invoice.findMany({
        include: {
          client: { select: { companyName: true } },
          workOrder: { select: { code: true } },
        },
        orderBy: [{ dueDate: "asc" }],
        take: 50,
      }),
      prisma.employee.findMany({
        include: {
          _count: {
            select: {
              workOrders: true,
              scheduleItems: true,
            },
          },
        },
        orderBy: [{ fullName: "asc" }],
        take: 50,
      }),
      prisma.scheduleItem.findMany({
        include: {
          employee: { select: { fullName: true } },
          client: { select: { companyName: true } },
          workOrder: { select: { code: true } },
        },
        orderBy: [{ startAt: "asc" }],
        take: 50,
      }),
      prisma.activityLog.findMany({
        include: {
          client: { select: { companyName: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 50,
      }),
    ]);

  return {
    leads,
    workOrders,
    clients,
    estimates,
    invoices,
    employees,
    scheduleItems,
    activityLogs,
  };
}

export async function getReportsData() {
  const now = new Date();
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);

  const [invoiceAgg, paidAgg, overdueCount, estimates, leads, workOrders] = await Promise.all([
    prisma.invoice.aggregate({
      where: {
        issuedAt: {
          gte: quarterStart,
        },
      },
      _sum: {
        amountCents: true,
      },
      _count: {
        id: true,
      },
    }),
    prisma.invoice.aggregate({
      where: {
        status: InvoiceStatus.PAID,
        paidAt: {
          gte: quarterStart,
        },
      },
      _sum: {
        amountCents: true,
      },
      _count: {
        id: true,
      },
    }),
    prisma.invoice.count({
      where: {
        dueDate: {
          lt: now,
        },
        status: {
          in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE],
        },
      },
    }),
    prisma.estimate.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
      _sum: {
        amountCents: true,
      },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    }),
    prisma.workOrder.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    }),
  ]);

  return {
    quarterStart,
    invoiceAgg,
    paidAgg,
    overdueCount,
    estimates,
    leads,
    workOrders,
  };
}

export async function getSettingsData() {
  const [services, users, packages, counts] = await Promise.all([
    prisma.servicePackage.findMany({
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    }),
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { username: "asc" }],
      select: {
        id: true,
        username: true,
        role: true,
        fullName: true,
        createdAt: true,
      },
    }),
    prisma.servicePackage.count(),
    prisma.$transaction([
      prisma.client.count(),
      prisma.employee.count(),
      prisma.workOrder.count(),
      prisma.invoice.count(),
      prisma.estimate.count(),
    ]),
  ]);

  return {
    services,
    userAccounts: users,
    packageCount: packages,
    counts: {
      clients: counts[0],
      employees: counts[1],
      workOrders: counts[2],
      invoices: counts[3],
      estimates: counts[4],
    },
  };
}

export type DashboardWorkOrder = Prisma.WorkOrderGetPayload<{
  include: {
    client: { select: { companyName: true } };
    property: { select: { name: true } };
    assignedEmployee: { select: { fullName: true } };
  };
}>;
