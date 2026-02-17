import { EstimateStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { estimateInputSchema } from "@/lib/validators";
import {
  badRequest,
  createNumber,
  getTakeFromSearchParams,
  parseDateOrNull,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

const statuses = new Set(Object.values(EstimateStatus));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const take = getTakeFromSearchParams(request, 30, 100);

  const where =
    statusParam && statuses.has(statusParam as EstimateStatus)
      ? { status: statusParam as EstimateStatus }
      : undefined;

  try {
    const [estimates, total] = await Promise.all([
      prisma.estimate.findMany({
        where,
        include: {
          client: { select: { companyName: true } },
          property: { select: { name: true } },
          lead: { select: { name: true, company: true } },
          convertedWorkOrder: { select: { code: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
        take,
      }),
      prisma.estimate.count({ where }),
    ]);

    return NextResponse.json({ data: estimates, count: estimates.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch estimates");
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

  const parsed = estimateInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const validUntil = parseDateOrNull(parsed.data.validUntil);

  if (parsed.data.validUntil && !validUntil) {
    return badRequest("validUntil must be a valid ISO datetime");
  }

  try {
    const estimate = await prisma.estimate.create({
      data: {
        estimateNumber: parsed.data.estimateNumber ?? createNumber("EST"),
        title: parsed.data.title,
        description: parsed.data.description,
        amountCents: parsed.data.amountCents,
        status: parsed.data.status,
        validUntil,
        preparedBy: parsed.data.preparedBy ?? user.fullName ?? user.username,
        notes: parsed.data.notes ?? null,
        clientId: parsed.data.clientId ?? null,
        propertyId: parsed.data.propertyId ?? null,
        leadId: parsed.data.leadId ?? null,
        convertedWorkOrderId: parsed.data.convertedWorkOrderId ?? null,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Created estimate",
        entityType: "Estimate",
        entityId: estimate.id,
        description: `Created estimate ${estimate.estimateNumber}.`,
        severity: "SUCCESS",
        userId: user.id,
        clientId: estimate.clientId,
      },
    });

    return NextResponse.json({ message: "Estimate created", data: estimate }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create estimate");
  }
}
