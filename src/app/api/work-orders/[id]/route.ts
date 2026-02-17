import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { workOrderUpdateSchema } from "@/lib/validators";
import {
  badRequest,
  notFound,
  parseDateOrNull,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        client: true,
        property: true,
        assignedEmployee: true,
        estimates: true,
        invoices: true,
        scheduleItems: {
          orderBy: [{ startAt: "asc" }],
        },
      },
    });

    if (!workOrder) {
      return notFound("Work order");
    }

    return NextResponse.json({ data: workOrder });
  } catch (error) {
    return serverError(error, "Failed to fetch work order");
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;
  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = workOrderUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  const scheduledFor =
    parsed.data.scheduledFor === undefined ? undefined : parseDateOrNull(parsed.data.scheduledFor);
  const completedAt =
    parsed.data.completedAt === undefined ? undefined : parseDateOrNull(parsed.data.completedAt);

  if (parsed.data.scheduledFor !== undefined && parsed.data.scheduledFor !== null && !scheduledFor) {
    return badRequest("scheduledFor must be a valid ISO datetime");
  }

  if (parsed.data.completedAt !== undefined && parsed.data.completedAt !== null && !completedAt) {
    return badRequest("completedAt must be a valid ISO datetime");
  }

  try {
    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: {
        ...parsed.data,
        scheduledFor,
        completedAt,
        assignee: parsed.data.assignee ?? undefined,
        assignedEmployeeId: parsed.data.assignedEmployeeId ?? undefined,
        estimatedHours: parsed.data.estimatedHours ?? undefined,
        actualHours: parsed.data.actualHours ?? undefined,
        estimatedValueCents: parsed.data.estimatedValueCents ?? undefined,
        locationLabel: parsed.data.locationLabel ?? undefined,
        clientId: parsed.data.clientId ?? undefined,
        propertyId: parsed.data.propertyId ?? undefined,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Updated work order",
        entityType: "WorkOrder",
        entityId: id,
        description: `Updated ${workOrder.code} with latest CRM details.`,
        severity: "INFO",
        userId: user.id,
        clientId: workOrder.clientId,
      },
    });

    return NextResponse.json({ message: "Work order updated", data: workOrder });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Work order");
    }

    return serverError(error, "Failed to update work order");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.workOrder.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Deleted work order",
        entityType: "WorkOrder",
        entityId: id,
        description: `Deleted work order ${id}.`,
        severity: "WARNING",
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Work order deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Work order");
    }

    return serverError(error, "Failed to delete work order");
  }
}
