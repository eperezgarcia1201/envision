import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { payrollEntryUpdateSchema } from "@/lib/validators";
import { badRequest, notFound, readJsonBody, serverError, unauthorized } from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

  const parsed = payrollEntryUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  try {
    const existing = await prisma.payrollEntry.findUnique({ where: { id } });

    if (!existing) {
      return notFound("Payroll entry");
    }

    const data = await prisma.payrollEntry.update({
      where: { id },
      data: {
        payrollRunId: parsed.data.payrollRunId,
        employeeId: parsed.data.employeeId,
        hoursWorked: parsed.data.hoursWorked,
        baseRateCents: parsed.data.baseRateCents,
        bonusCents: parsed.data.bonusCents,
        grossCents: parsed.data.grossCents,
        notes: parsed.data.notes ?? undefined,
      },
    });

    if (parsed.data.grossCents !== undefined) {
      const delta = parsed.data.grossCents - existing.grossCents;
      if (delta !== 0) {
        await prisma.payrollRun.update({
          where: { id: data.payrollRunId },
          data: {
            totalGrossCents: {
              increment: delta,
            },
          },
        });
      }
    }

    return NextResponse.json({ message: "Payroll entry updated", data });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Payroll entry");
    }

    return serverError(error, "Failed to update payroll entry");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.payrollEntry.findUnique({ where: { id } });

    if (!existing) {
      return notFound("Payroll entry");
    }

    await prisma.payrollEntry.delete({ where: { id } });

    await prisma.payrollRun.update({
      where: { id: existing.payrollRunId },
      data: {
        totalGrossCents: {
          decrement: existing.grossCents,
        },
      },
    });

    return NextResponse.json({ message: "Payroll entry deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Payroll entry");
    }

    return serverError(error, "Failed to delete payroll entry");
  }
}
