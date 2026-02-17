import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { employeeUpdateSchema } from "@/lib/validators";
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

  const parsed = employeeUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...parsed.data,
        territory: parsed.data.territory ?? undefined,
        avatarUrl: parsed.data.avatarUrl ?? undefined,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Updated employee",
        entityType: "Employee",
        entityId: employee.id,
        description: `Updated employee profile for ${employee.fullName}.`,
        severity: "INFO",
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Employee updated", data: employee });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Employee");
    }

    return serverError(error, "Failed to update employee");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.employee.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Deleted employee",
        entityType: "Employee",
        entityId: id,
        description: `Deleted employee record ${id}.`,
        severity: "WARNING",
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Employee deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Employee");
    }

    return serverError(error, "Failed to delete employee");
  }
}
