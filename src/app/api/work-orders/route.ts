import { Priority, UserRole, WorkOrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { workOrderInputSchema } from "@/lib/validators";

const statuses = new Set(Object.values(WorkOrderStatus));
const priorities = new Set(Object.values(Priority));

function createWorkOrderCode() {
  const stamp = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  const suffix = Math.floor(Math.random() * 900 + 100);
  return `WO-${stamp}-${suffix}`;
}

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const priorityParam = searchParams.get("priority");
  const takeParam = Number(searchParams.get("take") ?? "30");
  const take = Number.isFinite(takeParam) ? Math.min(Math.max(takeParam, 1), 100) : 30;

  const where: {
    status?: WorkOrderStatus;
    priority?: Priority;
  } = {};

  if (statusParam && statuses.has(statusParam as WorkOrderStatus)) {
    where.status = statusParam as WorkOrderStatus;
  }

  if (priorityParam && priorities.has(priorityParam as Priority)) {
    where.priority = priorityParam as Priority;
  }

  const workOrders = await prisma.workOrder.findMany({
    where,
    include: {
      client: { select: { companyName: true } },
      property: { select: { name: true } },
    },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
    take,
  });

  return NextResponse.json({ data: workOrders, count: workOrders.length });
}

export async function POST(request: NextRequest) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = workOrderInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const scheduledFor = parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : null;

  if (scheduledFor && Number.isNaN(scheduledFor.getTime())) {
    return NextResponse.json({ error: "scheduledFor must be a valid ISO datetime" }, { status: 400 });
  }

  try {
    const workOrder = await prisma.workOrder.create({
      data: {
        code: createWorkOrderCode(),
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        status: parsed.data.status,
        assignee: parsed.data.assignee ?? null,
        estimatedHours: parsed.data.estimatedHours ?? null,
        scheduledFor,
        clientId: parsed.data.clientId ?? null,
        propertyId: parsed.data.propertyId ?? null,
      },
    });

    return NextResponse.json(
      {
        message: "Work order created",
        data: workOrder,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create work order",
      },
      { status: 500 },
    );
  }
}
