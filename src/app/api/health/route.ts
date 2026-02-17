import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      leadCount,
      workOrderCount,
      invoiceCount,
      clientCount,
      estimateCount,
      employeeCount,
      scheduleCount,
      activityCount,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.workOrder.count(),
      prisma.invoice.count(),
      prisma.client.count(),
      prisma.estimate.count(),
      prisma.employee.count(),
      prisma.scheduleItem.count(),
      prisma.activityLog.count(),
    ]);

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      counters: {
        leadCount,
        workOrderCount,
        invoiceCount,
        clientCount,
        estimateCount,
        employeeCount,
        scheduleCount,
        activityCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : "Unknown health check error",
      },
      { status: 503 },
    );
  }
}
