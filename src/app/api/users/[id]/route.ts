import { hash } from "bcryptjs";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { userAccountUpdateSchema } from "@/lib/validators";
import { badRequest, notFound, readJsonBody, serverError, unauthorized } from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const currentUser = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!currentUser) {
    return unauthorized();
  }

  const { id } = await context.params;
  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = userAccountUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  if (id === currentUser.id && parsed.data.role && parsed.data.role !== UserRole.ADMIN) {
    return badRequest("You cannot remove your own admin role");
  }

  try {
    const data: Record<string, unknown> = {};

    if (parsed.data.username !== undefined) {
      data.username = parsed.data.username.trim().toLowerCase();
    }

    if (parsed.data.password !== undefined) {
      data.passwordHash = await hash(parsed.data.password, 12);
    }

    if (parsed.data.role !== undefined) {
      data.role = parsed.data.role;
    }

    if (parsed.data.fullName !== undefined) {
      data.fullName = parsed.data.fullName ?? null;
    }

    if (parsed.data.clientId !== undefined) {
      data.clientId = parsed.data.clientId ?? null;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        username: true,
        role: true,
        fullName: true,
        clientId: true,
        client: {
          select: {
            companyName: true,
          },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: currentUser.fullName ?? currentUser.username,
        action: "Updated user",
        entityType: "User",
        entityId: id,
        description: `Updated user profile for ${user.username}.`,
        severity: "INFO",
        userId: currentUser.id,
        clientId: user.clientId,
      },
    });

    return NextResponse.json({ message: "User updated", data: user });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("User");
    }

    return serverError(error, "Failed to update user");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const currentUser = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!currentUser) {
    return unauthorized();
  }

  const { id } = await context.params;

  if (id === currentUser.id) {
    return badRequest("You cannot delete your own account");
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        username: true,
      },
    });

    if (!target) {
      return notFound("User");
    }

    if (target.role === UserRole.ADMIN) {
      const adminCount = await prisma.user.count({
        where: {
          role: UserRole.ADMIN,
        },
      });

      if (adminCount <= 1) {
        return badRequest("At least one admin account must remain");
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    await prisma.activityLog.create({
      data: {
        actorName: currentUser.fullName ?? currentUser.username,
        action: "Deleted user",
        entityType: "User",
        entityId: id,
        description: `Deleted user account ${target.username}.`,
        severity: "WARNING",
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("User");
    }

    return serverError(error, "Failed to delete user");
  }
}
