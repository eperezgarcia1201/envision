import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { onboardingTaskUpdateSchema } from "@/lib/validators";
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

  const parsed = onboardingTaskUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  const dueDate =
    parsed.data.dueDate === undefined ? undefined : (parseDateOrNull(parsed.data.dueDate) ?? undefined);
  const completedAt =
    parsed.data.completedAt === undefined
      ? undefined
      : (parseDateOrNull(parsed.data.completedAt) ?? undefined);

  if (parsed.data.dueDate !== undefined && parsed.data.dueDate !== null && !dueDate) {
    return badRequest("dueDate must be a valid ISO datetime");
  }

  if (parsed.data.completedAt !== undefined && parsed.data.completedAt !== null && !completedAt) {
    return badRequest("completedAt must be a valid ISO datetime");
  }

  try {
    const task = await prisma.onboardingTask.update({
      where: { id },
      data: {
        title: parsed.data.title,
        owner: parsed.data.owner ?? undefined,
        status: parsed.data.status,
        dueDate,
        completedAt,
        notes: parsed.data.notes ?? undefined,
        clientId: parsed.data.clientId ?? undefined,
      },
    });

    return NextResponse.json({ message: "Onboarding task updated", data: task });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Onboarding task");
    }

    return serverError(error, "Failed to update onboarding task");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.onboardingTask.delete({ where: { id } });
    return NextResponse.json({ message: "Onboarding task deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Onboarding task");
    }

    return serverError(error, "Failed to delete onboarding task");
  }
}
