import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { availabilityBlockUpdateSchema } from "@/lib/validators";
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

  const parsed = availabilityBlockUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  const startAt =
    parsed.data.startAt === undefined ? undefined : (parseDateOrNull(parsed.data.startAt) ?? undefined);
  const endAt = parsed.data.endAt === undefined ? undefined : (parseDateOrNull(parsed.data.endAt) ?? undefined);

  if (parsed.data.startAt !== undefined && parsed.data.startAt !== null && !startAt) {
    return badRequest("startAt must be a valid ISO datetime");
  }

  if (parsed.data.endAt !== undefined && parsed.data.endAt !== null && !endAt) {
    return badRequest("endAt must be a valid ISO datetime");
  }

  if (startAt && endAt && endAt <= startAt) {
    return badRequest("endAt must be after startAt");
  }

  try {
    const data = await prisma.availabilityBlock.update({
      where: { id },
      data: {
        startAt,
        endAt,
        type: parsed.data.type,
        reason: parsed.data.reason ?? undefined,
        approved: parsed.data.approved,
        employeeId: parsed.data.employeeId,
      },
    });

    return NextResponse.json({ message: "Availability block updated", data });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Availability block");
    }

    return serverError(error, "Failed to update availability block");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.availabilityBlock.delete({ where: { id } });
    return NextResponse.json({ message: "Availability block deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Availability block");
    }

    return serverError(error, "Failed to delete availability block");
  }
}
