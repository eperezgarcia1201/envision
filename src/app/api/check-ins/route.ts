import { CheckInType, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest, requireRoleFromRequest } from "@/lib/auth";
import { fieldCheckInInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

const types = new Set(Object.values(CheckInType));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");
  const take = getTakeFromSearchParams(request, 80, 150);

  const where =
    typeParam && types.has(typeParam as CheckInType)
      ? { type: typeParam as CheckInType }
      : undefined;

  try {
    const [data, total] = await Promise.all([
      prisma.fieldCheckIn.findMany({
        where,
        include: {
          employee: {
            select: {
              fullName: true,
            },
          },
          scheduleItem: {
            select: {
              title: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take,
      }),
      prisma.fieldCheckIn.count({ where }),
    ]);

    return NextResponse.json({ data, count: data.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch check-ins");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return unauthorized();
  }

  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = fieldCheckInInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (user.role === UserRole.CLIENT) {
    return unauthorized();
  }

  try {
    const data = await prisma.fieldCheckIn.create({
      data: {
        type: parsed.data.type,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        notes: parsed.data.notes ?? null,
        employeeId: parsed.data.employeeId,
        scheduleItemId: parsed.data.scheduleItemId ?? null,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Logged field check-in",
        entityType: "FieldCheckIn",
        entityId: data.id,
        description: `${data.type} logged for employee ${data.employeeId}.`,
        severity: "INFO",
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Check-in recorded", data }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create check-in");
  }
}
