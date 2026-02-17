import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { messageLogUpdateSchema } from "@/lib/validators";
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

  const parsed = messageLogUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  const scheduledFor =
    parsed.data.scheduledFor === undefined
      ? undefined
      : (parseDateOrNull(parsed.data.scheduledFor) ?? undefined);
  const sentAt =
    parsed.data.sentAt === undefined ? undefined : (parseDateOrNull(parsed.data.sentAt) ?? undefined);

  if (parsed.data.scheduledFor !== undefined && parsed.data.scheduledFor !== null && !scheduledFor) {
    return badRequest("scheduledFor must be a valid ISO datetime");
  }

  if (parsed.data.sentAt !== undefined && parsed.data.sentAt !== null && !sentAt) {
    return badRequest("sentAt must be a valid ISO datetime");
  }

  try {
    const data = await prisma.messageLog.update({
      where: { id },
      data: {
        recipient: parsed.data.recipient,
        channel: parsed.data.channel,
        subject: parsed.data.subject ?? undefined,
        body: parsed.data.body,
        status: parsed.data.status,
        scheduledFor,
        sentAt,
        campaignId: parsed.data.campaignId ?? undefined,
        clientId: parsed.data.clientId ?? undefined,
      },
    });

    return NextResponse.json({ message: "Message updated", data });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Message");
    }

    return serverError(error, "Failed to update message");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.messageLog.delete({ where: { id } });
    return NextResponse.json({ message: "Message deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Message");
    }

    return serverError(error, "Failed to delete message");
  }
}
