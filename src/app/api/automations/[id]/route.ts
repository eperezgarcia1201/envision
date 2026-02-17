import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { automationRuleUpdateSchema } from "@/lib/validators";
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

  const parsed = automationRuleUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  try {
    const data = await prisma.automationRule.update({
      where: { id },
      data: {
        name: parsed.data.name,
        channel: parsed.data.channel,
        triggerEvent: parsed.data.triggerEvent,
        sendAfterMinutes: parsed.data.sendAfterMinutes,
        templateSubject: parsed.data.templateSubject ?? undefined,
        templateBody: parsed.data.templateBody,
        status: parsed.data.status,
        clientId: parsed.data.clientId ?? undefined,
      },
    });

    return NextResponse.json({ message: "Automation rule updated", data });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Automation rule");
    }

    return serverError(error, "Failed to update automation rule");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.automationRule.delete({ where: { id } });
    return NextResponse.json({ message: "Automation rule deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Automation rule");
    }

    return serverError(error, "Failed to delete automation rule");
  }
}
