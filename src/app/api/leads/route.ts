import { LeadStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest, requireRoleFromRequest } from "@/lib/auth";
import { leadInputSchema } from "@/lib/validators";
import {
  badRequest,
  createNumber,
  getTakeFromSearchParams,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

const statuses = new Set(Object.values(LeadStatus));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const take = getTakeFromSearchParams(request, 30, 100);

  const where =
    statusParam && statuses.has(statusParam as LeadStatus)
      ? {
          status: statusParam as LeadStatus,
        }
      : undefined;

  try {
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        take,
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({ data: leads, count: leads.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch leads");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  const internalRoles = new Set<UserRole>([UserRole.ADMIN, UserRole.MANAGER]);
  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = leadInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const canWriteLifecycle = user ? internalRoles.has(user.role) : false;

  try {
    const lead = await prisma.lead.create({
      data: {
        ...parsed.data,
        phone: parsed.data.phone ?? null,
        company: parsed.data.company ?? null,
        serviceNeeded: parsed.data.serviceNeeded ?? null,
        source: canWriteLifecycle ? parsed.data.source : "website",
        status: canWriteLifecycle ? parsed.data.status : LeadStatus.NEW,
      },
    });

    if (canWriteLifecycle && user) {
      await prisma.activityLog.create({
        data: {
          actorName: user.fullName ?? user.username,
          action: "Created lead",
          entityType: "Lead",
          entityId: lead.id,
          description: `Created lead ${lead.name} (${lead.email}). Ref ${createNumber("LID")}.`,
          severity: "INFO",
          userId: user.id,
        },
      });
    }

    return NextResponse.json({ message: "Lead captured", data: lead }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create lead");
  }
}
