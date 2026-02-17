import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { exportJobUpdateSchema } from "@/lib/validators";
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

  const parsed = exportJobUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  const completedAt =
    parsed.data.completedAt === undefined
      ? undefined
      : (parseDateOrNull(parsed.data.completedAt) ?? undefined);

  if (parsed.data.completedAt !== undefined && parsed.data.completedAt !== null && !completedAt) {
    return badRequest("completedAt must be a valid ISO datetime");
  }

  try {
    const data = await prisma.exportJob.update({
      where: { id },
      data: {
        resource: parsed.data.resource,
        format: parsed.data.format,
        status: parsed.data.status,
        requestedBy: parsed.data.requestedBy,
        downloadUrl: parsed.data.downloadUrl ?? undefined,
        completedAt,
        notes: parsed.data.notes ?? undefined,
      },
    });

    return NextResponse.json({ message: "Export job updated", data });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Export job");
    }

    return serverError(error, "Failed to update export job");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.exportJob.delete({ where: { id } });
    return NextResponse.json({ message: "Export job deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Export job");
    }

    return serverError(error, "Failed to delete export job");
  }
}
