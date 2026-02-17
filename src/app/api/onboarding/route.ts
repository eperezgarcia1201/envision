import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { onboardingTaskInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  parseDateOrNull,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const take = getTakeFromSearchParams(request, 50, 100);

  try {
    const [data, total] = await Promise.all([
      prisma.onboardingTask.findMany({
        include: {
          client: {
            select: {
              companyName: true,
            },
          },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take,
      }),
      prisma.onboardingTask.count(),
    ]);

    return NextResponse.json({ data, count: data.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch onboarding tasks");
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

  const parsed = onboardingTaskInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const dueDate = parseDateOrNull(parsed.data.dueDate);
  const completedAt = parseDateOrNull(parsed.data.completedAt);

  if (parsed.data.dueDate && !dueDate) {
    return badRequest("dueDate must be a valid ISO datetime");
  }

  if (parsed.data.completedAt && !completedAt) {
    return badRequest("completedAt must be a valid ISO datetime");
  }

  try {
    const task = await prisma.onboardingTask.create({
      data: {
        title: parsed.data.title,
        owner: parsed.data.owner ?? null,
        status: parsed.data.status,
        dueDate,
        completedAt,
        notes: parsed.data.notes ?? null,
        clientId: parsed.data.clientId ?? null,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Created onboarding task",
        entityType: "OnboardingTask",
        entityId: task.id,
        description: `Created onboarding task \"${task.title}\".`,
        severity: "INFO",
        userId: user.id,
        clientId: task.clientId,
      },
    });

    return NextResponse.json({ message: "Onboarding task created", data: task }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create onboarding task");
  }
}
