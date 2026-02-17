import { PayrollStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { payrollRunInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  parseDateOrNull,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

const statuses = new Set(Object.values(PayrollStatus));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const take = getTakeFromSearchParams(request, 50, 120);

  const where =
    statusParam && statuses.has(statusParam as PayrollStatus)
      ? { status: statusParam as PayrollStatus }
      : undefined;

  try {
    const [data, total] = await Promise.all([
      prisma.payrollRun.findMany({
        where,
        include: {
          _count: {
            select: {
              entries: true,
            },
          },
        },
        orderBy: [{ periodEnd: "desc" }],
        take,
      }),
      prisma.payrollRun.count({ where }),
    ]);

    return NextResponse.json({ data, count: data.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch payroll runs");
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

  const parsed = payrollRunInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const periodStart = parseDateOrNull(parsed.data.periodStart);
  const periodEnd = parseDateOrNull(parsed.data.periodEnd);
  const processedAt = parseDateOrNull(parsed.data.processedAt);

  if (!periodStart || !periodEnd) {
    return badRequest("periodStart and periodEnd must be valid ISO datetimes");
  }

  if (periodEnd <= periodStart) {
    return badRequest("periodEnd must be after periodStart");
  }

  if (parsed.data.processedAt && !processedAt) {
    return badRequest("processedAt must be a valid ISO datetime");
  }

  try {
    const data = await prisma.payrollRun.create({
      data: {
        periodStart,
        periodEnd,
        status: parsed.data.status,
        totalGrossCents: parsed.data.totalGrossCents,
        processedAt,
        notes: parsed.data.notes ?? null,
      },
    });

    return NextResponse.json({ message: "Payroll run created", data }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create payroll run");
  }
}
