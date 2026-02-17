import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { bookingRequestUpdateSchema } from "@/lib/validators";
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

  const parsed = bookingRequestUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  const preferredDate =
    parsed.data.preferredDate === undefined
      ? undefined
      : (parseDateOrNull(parsed.data.preferredDate) ?? undefined);

  if (parsed.data.preferredDate !== undefined && parsed.data.preferredDate !== null && !preferredDate) {
    return badRequest("preferredDate must be a valid ISO datetime");
  }

  try {
    const data = await prisma.bookingRequest.update({
      where: { id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? undefined,
        company: parsed.data.company ?? undefined,
        address: parsed.data.address ?? undefined,
        serviceType: parsed.data.serviceType,
        frequency: parsed.data.frequency ?? undefined,
        preferredDate,
        source: parsed.data.source,
        status: parsed.data.status,
        notes: parsed.data.notes ?? undefined,
        convertedLeadId: parsed.data.convertedLeadId ?? undefined,
        clientId: parsed.data.clientId ?? undefined,
      },
    });

    return NextResponse.json({ message: "Booking request updated", data });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Booking request");
    }

    return serverError(error, "Failed to update booking request");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.bookingRequest.delete({ where: { id } });
    return NextResponse.json({ message: "Booking request deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Booking request");
    }

    return serverError(error, "Failed to delete booking request");
  }
}
