import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { estimateUpdateSchema } from "@/lib/validators";
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

  const parsed = estimateUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  const validUntil =
    parsed.data.validUntil === undefined ? undefined : parseDateOrNull(parsed.data.validUntil);

  if (parsed.data.validUntil !== undefined && parsed.data.validUntil !== null && !validUntil) {
    return badRequest("validUntil must be a valid ISO datetime");
  }

  try {
    const estimate = await prisma.estimate.update({
      where: { id },
      data: {
        ...parsed.data,
        validUntil,
        preparedBy: parsed.data.preparedBy ?? undefined,
        notes: parsed.data.notes ?? undefined,
        clientId: parsed.data.clientId ?? undefined,
        propertyId: parsed.data.propertyId ?? undefined,
        leadId: parsed.data.leadId ?? undefined,
        convertedWorkOrderId: parsed.data.convertedWorkOrderId ?? undefined,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Updated estimate",
        entityType: "Estimate",
        entityId: estimate.id,
        description: `Updated estimate ${estimate.estimateNumber}.`,
        severity: "INFO",
        userId: user.id,
        clientId: estimate.clientId,
      },
    });

    return NextResponse.json({ message: "Estimate updated", data: estimate });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Estimate");
    }

    return serverError(error, "Failed to update estimate");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.estimate.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Deleted estimate",
        entityType: "Estimate",
        entityId: id,
        description: `Deleted estimate record ${id}.`,
        severity: "WARNING",
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Estimate deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Estimate");
    }

    return serverError(error, "Failed to delete estimate");
  }
}
