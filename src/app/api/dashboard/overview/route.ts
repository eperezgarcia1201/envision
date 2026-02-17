import { InvoiceStatus, LeadStatus, WorkOrderStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "short" });
}

export async function GET() {
  const user = await getCurrentUser();
  const allowedRoles = new Set<UserRole>([UserRole.ADMIN, UserRole.MANAGER]);

  if (!user || !allowedRoles.has(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const openStatuses = new Set<WorkOrderStatus>([
      WorkOrderStatus.BACKLOG,
      WorkOrderStatus.SCHEDULED,
      WorkOrderStatus.IN_PROGRESS,
      WorkOrderStatus.ON_HOLD,
    ]);
    const overdueStatuses = new Set<InvoiceStatus>([
      InvoiceStatus.SENT,
      InvoiceStatus.PARTIAL,
      InvoiceStatus.OVERDUE,
    ]);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const months = Array.from({ length: 6 }, (_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      return {
        key: monthKey(date),
        label: monthLabel(date),
      };
    });

    const [
      leads,
      estimates,
      invoices,
      paidInvoices,
      workOrders,
      scheduleToday,
      activity,
      allClients,
      paidByClient,
    ] = await Promise.all([
      prisma.lead.findMany({
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.estimate.findMany({
        select: {
          id: true,
          status: true,
          amountCents: true,
          createdAt: true,
        },
      }),
      prisma.invoice.findMany({
        select: {
          id: true,
          status: true,
          amountCents: true,
          dueDate: true,
        },
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
          clientId: true,
        },
      }),
      prisma.workOrder.findMany({
        include: {
          client: { select: { companyName: true } },
          property: { select: { name: true } },
          assignedEmployee: { select: { fullName: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 8,
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
        take: 8,
      }),
      prisma.activityLog.findMany({
        include: {
          client: { select: { companyName: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 10,
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
    ]);

    const leadPipeline = Object.values(LeadStatus).map((status) => ({
      status,
      count: leads.filter((lead) => lead.status === status).length,
    }));

    const newLeads = leadPipeline.find((item) => item.status === LeadStatus.NEW)?.count ?? 0;

    const estimateValueCents = estimates.reduce((sum, estimate) => sum + estimate.amountCents, 0);

    const activeJobs = workOrders.filter((order) => openStatuses.has(order.status)).length;

    const overdueInvoices = invoices.filter(
      (invoice) => invoice.dueDate < now && overdueStatuses.has(invoice.status),
    );

    const overdueAmountCents = overdueInvoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);

    const revenueByMonthMap = new Map(months.map((month) => [month.key, 0]));

    for (const invoice of paidInvoices) {
      if (!invoice.paidAt) {
        continue;
      }

      const key = monthKey(invoice.paidAt);
      if (!revenueByMonthMap.has(key)) {
        continue;
      }

      revenueByMonthMap.set(key, (revenueByMonthMap.get(key) ?? 0) + invoice.amountCents);
    }

    const revenueSeries = months.map((month) => ({
      label: month.label,
      amountCents: revenueByMonthMap.get(month.key) ?? 0,
    }));

    const topClientsByRevenue = allClients
      .map((client) => ({
        clientId: client.id,
        companyName: client.companyName,
        revenueCents: paidByClient
          .filter((invoice) => invoice.clientId === client.id)
          .reduce((sum, invoice) => sum + invoice.amountCents, 0),
      }))
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 5);

    return NextResponse.json({
      data: {
        metrics: {
          newLeads,
          estimateValueCents,
          activeJobs,
          invoiceCount: invoices.length,
          overdueAmountCents,
          overdueCount: overdueInvoices.length,
        },
        leadPipeline,
        revenueSeries,
        workOrders,
        scheduleToday,
        activity,
        topClientsByRevenue,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load dashboard overview",
      },
      { status: 500 },
    );
  }
}
