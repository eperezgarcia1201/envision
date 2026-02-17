import { IntegrationStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { integrationConnectionInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  parseDateOrNull,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

const statuses = new Set(Object.values(IntegrationStatus));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const take = getTakeFromSearchParams(request, 40, 100);

  const where =
    statusParam && statuses.has(statusParam as IntegrationStatus)
      ? { status: statusParam as IntegrationStatus }
      : undefined;

  try {
    const [data, total] = await Promise.all([
      prisma.integrationConnection.findMany({
        where,
        orderBy: [{ provider: "asc" }],
        take,
      }),
      prisma.integrationConnection.count({ where }),
    ]);

    return NextResponse.json({ data, count: data.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch integrations");
  }
}

export async function POST(request: NextRequest) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = integrationConnectionInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const lastSyncAt = parseDateOrNull(parsed.data.lastSyncAt);

  if (parsed.data.lastSyncAt && !lastSyncAt) {
    return badRequest("lastSyncAt must be a valid ISO datetime");
  }

  try {
    const data = await prisma.integrationConnection.create({
      data: {
        provider: parsed.data.provider,
        status: parsed.data.status,
        apiKeyMasked: parsed.data.apiKeyMasked ?? null,
        webhookUrl: parsed.data.webhookUrl ?? null,
        syncIntervalMinutes: parsed.data.syncIntervalMinutes,
        lastSyncAt,
        notes: parsed.data.notes ?? null,
      },
    });

    return NextResponse.json({ message: "Integration created", data }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create integration");
  }
}
