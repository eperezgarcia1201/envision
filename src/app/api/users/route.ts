import { hash } from "bcryptjs";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { userAccountInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

export async function GET(request: NextRequest) {
  const currentUser = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!currentUser) {
    return unauthorized();
  }

  const take = getTakeFromSearchParams(request, 80, 100);

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
        orderBy: [{ role: "asc" }, { username: "asc" }],
        take,
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json({ data: users, count: users.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch users");
  }
}

export async function POST(request: NextRequest) {
  const currentUser = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!currentUser) {
    return unauthorized();
  }

  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = userAccountInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const username = parsed.data.username.trim().toLowerCase();

  try {
    const passwordHash = await hash(parsed.data.password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: parsed.data.role,
        fullName: parsed.data.fullName ?? null,
        clientId: parsed.data.clientId ?? null,
      },
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
        action: "Created user",
        entityType: "User",
        entityId: user.id,
        description: `Provisioned user ${user.username} with ${user.role} role.`,
        severity: "SUCCESS",
        userId: currentUser.id,
        clientId: user.clientId,
      },
    });

    return NextResponse.json({ message: "User created", data: user }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create user");
  }
}
