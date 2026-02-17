import { ScheduleStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { scheduleItemInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  parseDateOrNull,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

const statuses = new Set(Object.values(ScheduleStatus));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const take = getTakeFromSearchParams(request, 50, 100);

  const where =
    statusParam && statuses.has(statusParam as ScheduleStatus)
      ? { status: statusParam as ScheduleStatus }
      : undefined;

  try {
    const [scheduleItems, total] = await Promise.all([
      prisma.scheduleItem.findMany({
        where,
        include: {
          employee: { select: { fullName: true, role: true } },
          workOrder: { select: { code: true, title: true } },
          client: { select: { companyName: true } },
          property: { select: { name: true } },
        },
        orderBy: [{ startAt: "asc" }],
        take,
      }),
      prisma.scheduleItem.count({ where }),
    ]);

    return NextResponse.json({ data: scheduleItems, count: scheduleItems.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch schedule items");
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

  const parsed = scheduleItemInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const startAt = parseDateOrNull(parsed.data.startAt);
  const endAt = parseDateOrNull(parsed.data.endAt);

  if (!startAt || !endAt) {
    return badRequest("startAt and endAt must be valid ISO datetimes");
  }

  if (endAt <= startAt) {
    return badRequest("endAt must be after startAt");
  }

  try {
    const scheduleItem = await prisma.scheduleItem.create({
      data: {
        title: parsed.data.title,
        serviceType: parsed.data.serviceType,
        startAt,
        endAt,
        status: parsed.data.status,
        location: parsed.data.location,
        notes: parsed.data.notes ?? null,
        employeeId: parsed.data.employeeId ?? null,
        workOrderId: parsed.data.workOrderId ?? null,
        clientId: parsed.data.clientId ?? null,
        propertyId: parsed.data.propertyId ?? null,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Created schedule item",
        entityType: "Schedule",
        entityId: scheduleItem.id,
        description: `Created schedule item ${scheduleItem.title}.`,
        severity: "INFO",
        userId: user.id,
        clientId: scheduleItem.clientId,
      },
    });

    return NextResponse.json({ message: "Schedule item created", data: scheduleItem }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create schedule item");
  }
}
