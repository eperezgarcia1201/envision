import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { servicePackageUpdateSchema } from "@/lib/validators";
import { badRequest, notFound, readJsonBody, serverError, unauthorized } from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const currentUser = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!currentUser) {
    return unauthorized();
  }

  const { id } = await context.params;
  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = servicePackageUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  try {
    const servicePackage = await prisma.servicePackage.update({
      where: { id },
      data: parsed.data,
    });

    await prisma.activityLog.create({
      data: {
        actorName: currentUser.fullName ?? currentUser.username,
        action: "Updated service package",
        entityType: "ServicePackage",
        entityId: id,
        description: `Updated service package ${servicePackage.name}.`,
        severity: "INFO",
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ message: "Service package updated", data: servicePackage });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Service package");
    }

    return serverError(error, "Failed to update service package");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const currentUser = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!currentUser) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.servicePackage.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        actorName: currentUser.fullName ?? currentUser.username,
        action: "Deleted service package",
        entityType: "ServicePackage",
        entityId: id,
        description: `Deleted service package ${id}.`,
        severity: "WARNING",
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ message: "Service package deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Service package");
    }

    return serverError(error, "Failed to delete service package");
  }
}
