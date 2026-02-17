import { CampaignStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { automationRuleInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

const statuses = new Set(Object.values(CampaignStatus));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const take = getTakeFromSearchParams(request, 60, 120);

  const where =
    statusParam && statuses.has(statusParam as CampaignStatus)
      ? { status: statusParam as CampaignStatus }
      : undefined;

  try {
    const [data, total] = await Promise.all([
      prisma.automationRule.findMany({
        where,
        include: {
          client: {
            select: {
              companyName: true,
            },
          },
          _count: {
            select: {
              logs: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }],
        take,
      }),
      prisma.automationRule.count({ where }),
    ]);

    return NextResponse.json({ data, count: data.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch automation rules");
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

  const parsed = automationRuleInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  try {
    const data = await prisma.automationRule.create({
      data: {
        name: parsed.data.name,
        channel: parsed.data.channel,
        triggerEvent: parsed.data.triggerEvent,
        sendAfterMinutes: parsed.data.sendAfterMinutes,
        templateSubject: parsed.data.templateSubject ?? null,
        templateBody: parsed.data.templateBody,
        status: parsed.data.status,
        clientId: parsed.data.clientId ?? null,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Created automation rule",
        entityType: "AutomationRule",
        entityId: data.id,
        description: `Created automation rule ${data.name}.`,
        severity: "INFO",
        userId: user.id,
        clientId: data.clientId,
      },
    });

    return NextResponse.json({ message: "Automation rule created", data }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create automation rule");
  }
}
