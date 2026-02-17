import { MessageStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { messageLogInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  parseDateOrNull,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

const statuses = new Set(Object.values(MessageStatus));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const take = getTakeFromSearchParams(request, 80, 150);

  const where =
    statusParam && statuses.has(statusParam as MessageStatus)
      ? { status: statusParam as MessageStatus }
      : undefined;

  try {
    const [data, total] = await Promise.all([
      prisma.messageLog.findMany({
        where,
        include: {
          campaign: { select: { name: true } },
          client: { select: { companyName: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        take,
      }),
      prisma.messageLog.count({ where }),
    ]);

    return NextResponse.json({ data, count: data.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch message logs");
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

  const parsed = messageLogInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const scheduledFor = parseDateOrNull(parsed.data.scheduledFor);
  const sentAt = parseDateOrNull(parsed.data.sentAt);

  if (parsed.data.scheduledFor && !scheduledFor) {
    return badRequest("scheduledFor must be a valid ISO datetime");
  }

  if (parsed.data.sentAt && !sentAt) {
    return badRequest("sentAt must be a valid ISO datetime");
  }

  try {
    const data = await prisma.messageLog.create({
      data: {
        recipient: parsed.data.recipient,
        channel: parsed.data.channel,
        subject: parsed.data.subject ?? null,
        body: parsed.data.body,
        status: parsed.data.status,
        scheduledFor,
        sentAt,
        campaignId: parsed.data.campaignId ?? null,
        clientId: parsed.data.clientId ?? null,
      },
    });

    return NextResponse.json({ message: "Message queued", data }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create message log");
  }
}
