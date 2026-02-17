import { AvailabilityType, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { availabilityBlockInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  parseDateOrNull,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

const types = new Set(Object.values(AvailabilityType));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");
  const take = getTakeFromSearchParams(request, 80, 150);

  const where =
    typeParam && types.has(typeParam as AvailabilityType)
      ? { type: typeParam as AvailabilityType }
      : undefined;

  try {
    const [data, total] = await Promise.all([
      prisma.availabilityBlock.findMany({
        where,
        include: {
          employee: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: [{ startAt: "asc" }],
        take,
      }),
      prisma.availabilityBlock.count({ where }),
    ]);

    return NextResponse.json({ data, count: data.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch availability blocks");
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

  const parsed = availabilityBlockInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const startAt = parseDateOrNull(parsed.data.startAt);
  const endAt = parseDateOrNull(parsed.data.endAt);

  if (!startAt || !endAt) {
    return badRequest("startAt and endAt must be valid ISO datetime values");
  }

  if (endAt <= startAt) {
    return badRequest("endAt must be after startAt");
  }

  try {
    const data = await prisma.availabilityBlock.create({
      data: {
        startAt,
        endAt,
        type: parsed.data.type,
        reason: parsed.data.reason ?? null,
        approved: parsed.data.approved,
        employeeId: parsed.data.employeeId,
      },
    });

    return NextResponse.json({ message: "Availability block created", data }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create availability block");
  }
}
