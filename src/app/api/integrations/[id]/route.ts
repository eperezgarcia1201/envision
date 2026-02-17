import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { integrationConnectionUpdateSchema } from "@/lib/validators";
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
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;
  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = integrationConnectionUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  const lastSyncAt =
    parsed.data.lastSyncAt === undefined
      ? undefined
      : (parseDateOrNull(parsed.data.lastSyncAt) ?? undefined);

  if (parsed.data.lastSyncAt !== undefined && parsed.data.lastSyncAt !== null && !lastSyncAt) {
    return badRequest("lastSyncAt must be a valid ISO datetime");
  }

  try {
    const data = await prisma.integrationConnection.update({
      where: { id },
      data: {
        provider: parsed.data.provider,
        status: parsed.data.status,
        apiKeyMasked: parsed.data.apiKeyMasked ?? undefined,
        webhookUrl: parsed.data.webhookUrl ?? undefined,
        syncIntervalMinutes: parsed.data.syncIntervalMinutes,
        lastSyncAt,
        notes: parsed.data.notes ?? undefined,
      },
    });

    return NextResponse.json({ message: "Integration updated", data });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Integration");
    }

    return serverError(error, "Failed to update integration");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.integrationConnection.delete({ where: { id } });
    return NextResponse.json({ message: "Integration deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Integration");
    }

    return serverError(error, "Failed to delete integration");
  }
}
