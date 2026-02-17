import { Priority, UserRole, WorkOrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { workOrderInputSchema } from "@/lib/validators";
import {
  badRequest,
  createNumber,
  getTakeFromSearchParams,
  parseDateOrNull,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

const statuses = new Set(Object.values(WorkOrderStatus));
const priorities = new Set(Object.values(Priority));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const priorityParam = searchParams.get("priority");
  const take = getTakeFromSearchParams(request, 40, 100);

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

  try {
    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: {
          client: { select: { companyName: true } },
          property: { select: { name: true } },
          assignedEmployee: {
            select: {
              fullName: true,
              role: true,
              status: true,
            },
          },
        },
        orderBy: [{ scheduledFor: "asc" }, { updatedAt: "desc" }],
        take,
      }),
      prisma.workOrder.count({ where }),
    ]);

    return NextResponse.json({ data: workOrders, count: workOrders.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch work orders");
  }
}

export async function POST(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = workOrderInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const scheduledFor = parseDateOrNull(parsed.data.scheduledFor);
  const completedAt = parseDateOrNull(parsed.data.completedAt);

  if (parsed.data.scheduledFor && !scheduledFor) {
    return badRequest("scheduledFor must be a valid ISO datetime");
  }

  if (parsed.data.completedAt && !completedAt) {
    return badRequest("completedAt must be a valid ISO datetime");
  }

  try {
    const workOrder = await prisma.workOrder.create({
      data: {
        code: createNumber("WO"),
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        status: parsed.data.status,
        assignee: parsed.data.assignee ?? null,
        assignedEmployeeId: parsed.data.assignedEmployeeId ?? null,
        estimatedHours: parsed.data.estimatedHours ?? null,
        actualHours: parsed.data.actualHours ?? null,
        estimatedValueCents: parsed.data.estimatedValueCents ?? null,
        locationLabel: parsed.data.locationLabel ?? null,
        scheduledFor,
        completedAt,
        clientId: parsed.data.clientId ?? null,
        propertyId: parsed.data.propertyId ?? null,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Created work order",
        entityType: "WorkOrder",
        entityId: workOrder.id,
        description: `Created ${workOrder.code} for ${workOrder.title}.`,
        severity: "INFO",
        userId: user.id,
        clientId: parsed.data.clientId ?? null,
      },
    });

    return NextResponse.json({ message: "Work order created", data: workOrder }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create work order");
  }
}
