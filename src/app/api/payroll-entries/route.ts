import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { payrollEntryInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const take = getTakeFromSearchParams(request, 100, 200);

  try {
    const [data, total] = await Promise.all([
      prisma.payrollEntry.findMany({
        include: {
          employee: { select: { fullName: true } },
          payrollRun: { select: { periodStart: true, periodEnd: true, status: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        take,
      }),
      prisma.payrollEntry.count(),
    ]);

    return NextResponse.json({ data, count: data.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch payroll entries");
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

  const parsed = payrollEntryInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  try {
    const data = await prisma.payrollEntry.create({
      data: {
        payrollRunId: parsed.data.payrollRunId,
        employeeId: parsed.data.employeeId,
        hoursWorked: parsed.data.hoursWorked,
        baseRateCents: parsed.data.baseRateCents,
        bonusCents: parsed.data.bonusCents,
        grossCents: parsed.data.grossCents,
        notes: parsed.data.notes ?? null,
      },
    });

    await prisma.payrollRun.update({
      where: { id: parsed.data.payrollRunId },
      data: {
        totalGrossCents: {
          increment: data.grossCents,
        },
      },
    });

    return NextResponse.json({ message: "Payroll entry created", data }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create payroll entry");
  }
}
