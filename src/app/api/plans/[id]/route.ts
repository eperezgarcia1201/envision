import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { planTierUpdateSchema } from "@/lib/validators";
import { badRequest, notFound, readJsonBody, serverError, unauthorized } from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;
  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = planTierUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  try {
    const data = await prisma.planTier.update({
      where: { id },
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        monthlyPriceCents: parsed.data.monthlyPriceCents,
        maxUsers: parsed.data.maxUsers,
        maxClients: parsed.data.maxClients,
        maxProperties: parsed.data.maxProperties,
        apiAccess: parsed.data.apiAccess,
        mobileAccess: parsed.data.mobileAccess,
        automationAccess: parsed.data.automationAccess,
      },
    });

    return NextResponse.json({ message: "Plan tier updated", data });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Plan tier");
    }

    return serverError(error, "Failed to update plan tier");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.planTier.delete({ where: { id } });
    return NextResponse.json({ message: "Plan tier deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Plan tier");
    }

    return serverError(error, "Failed to delete plan tier");
  }
}
