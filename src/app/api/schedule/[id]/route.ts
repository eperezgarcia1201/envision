import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { scheduleItemUpdateSchema } from "@/lib/validators";
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

  const parsed = scheduleItemUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  const startAtCandidate =
    parsed.data.startAt && parsed.data.startAt !== null ? parseDateOrNull(parsed.data.startAt) : undefined;
  const endAtCandidate =
    parsed.data.endAt && parsed.data.endAt !== null ? parseDateOrNull(parsed.data.endAt) : undefined;

  if (parsed.data.startAt !== undefined && parsed.data.startAt !== null && !startAtCandidate) {
    return badRequest("startAt must be a valid ISO datetime");
  }

  if (parsed.data.endAt !== undefined && parsed.data.endAt !== null && !endAtCandidate) {
    return badRequest("endAt must be a valid ISO datetime");
  }

  if (parsed.data.startAt === null || parsed.data.endAt === null) {
    return badRequest("startAt and endAt cannot be null");
  }

  if (startAtCandidate && endAtCandidate && endAtCandidate <= startAtCandidate) {
    return badRequest("endAt must be after startAt");
  }

  try {
    const scheduleItem = await prisma.scheduleItem.update({
      where: { id },
      data: {
        title: parsed.data.title,
        serviceType: parsed.data.serviceType,
        startAt:
          parsed.data.startAt === undefined ? undefined : (startAtCandidate ?? undefined),
        endAt: parsed.data.endAt === undefined ? undefined : (endAtCandidate ?? undefined),
        status: parsed.data.status,
        location: parsed.data.location,
        notes: parsed.data.notes ?? undefined,
        employeeId: parsed.data.employeeId ?? undefined,
        workOrderId: parsed.data.workOrderId ?? undefined,
        clientId: parsed.data.clientId ?? undefined,
        propertyId: parsed.data.propertyId ?? undefined,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Updated schedule item",
        entityType: "Schedule",
        entityId: scheduleItem.id,
        description: `Updated schedule item ${scheduleItem.title}.`,
        severity: "INFO",
        userId: user.id,
        clientId: scheduleItem.clientId,
      },
    });

    return NextResponse.json({ message: "Schedule item updated", data: scheduleItem });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Schedule item");
    }

    return serverError(error, "Failed to update schedule item");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.scheduleItem.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Deleted schedule item",
        entityType: "Schedule",
        entityId: id,
        description: `Deleted schedule item ${id}.`,
        severity: "WARNING",
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Schedule item deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Schedule item");
    }

    return serverError(error, "Failed to delete schedule item");
  }
}
