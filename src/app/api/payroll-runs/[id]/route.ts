import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { payrollRunUpdateSchema } from "@/lib/validators";
import {
  badRequest,
  notFound,
  parseDateOrNull,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    const data = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        entries: {
          include: {
            employee: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!data) {
      return notFound("Payroll run");
    }

    return NextResponse.json({ data });
  } catch (error) {
    return serverError(error, "Failed to fetch payroll run");
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;
  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = payrollRunUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  const periodStart =
    parsed.data.periodStart === undefined
      ? undefined
      : (parseDateOrNull(parsed.data.periodStart) ?? undefined);
  const periodEnd =
    parsed.data.periodEnd === undefined ? undefined : (parseDateOrNull(parsed.data.periodEnd) ?? undefined);
  const processedAt =
    parsed.data.processedAt === undefined
      ? undefined
      : (parseDateOrNull(parsed.data.processedAt) ?? undefined);

  if (parsed.data.periodStart !== undefined && parsed.data.periodStart !== null && !periodStart) {
    return badRequest("periodStart must be a valid ISO datetime");
  }

  if (parsed.data.periodEnd !== undefined && parsed.data.periodEnd !== null && !periodEnd) {
    return badRequest("periodEnd must be a valid ISO datetime");
  }

  if (parsed.data.processedAt !== undefined && parsed.data.processedAt !== null && !processedAt) {
    return badRequest("processedAt must be a valid ISO datetime");
  }

  if (periodStart && periodEnd && periodEnd <= periodStart) {
    return badRequest("periodEnd must be after periodStart");
  }

  try {
    const data = await prisma.payrollRun.update({
      where: { id },
      data: {
        periodStart,
        periodEnd,
        status: parsed.data.status,
        totalGrossCents: parsed.data.totalGrossCents,
        processedAt,
        notes: parsed.data.notes ?? undefined,
      },
    });

    return NextResponse.json({ message: "Payroll run updated", data });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Payroll run");
    }

    return serverError(error, "Failed to update payroll run");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.payrollRun.delete({ where: { id } });
    return NextResponse.json({ message: "Payroll run deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Payroll run");
    }

    return serverError(error, "Failed to delete payroll run");
  }
}
