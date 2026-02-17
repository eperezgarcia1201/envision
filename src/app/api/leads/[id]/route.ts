import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { leadUpdateSchema } from "@/lib/validators";
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

  const parsed = leadUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...parsed.data,
        phone: parsed.data.phone ?? undefined,
        company: parsed.data.company ?? undefined,
        serviceNeeded: parsed.data.serviceNeeded ?? undefined,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Updated lead",
        entityType: "Lead",
        entityId: id,
        description: `Updated lead ${lead.name} and lifecycle metadata.`,
        severity: "INFO",
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Lead updated", data: lead });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Lead");
    }

    return serverError(error, "Failed to update lead");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.lead.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Deleted lead",
        entityType: "Lead",
        entityId: id,
        description: `Removed lead ${id} from CRM records.`,
        severity: "WARNING",
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Lead deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Lead");
    }

    return serverError(error, "Failed to delete lead");
  }
}
