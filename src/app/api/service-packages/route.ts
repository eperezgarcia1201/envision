import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { servicePackageInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

export async function GET(request: NextRequest) {
  const currentUser = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!currentUser) {
    return unauthorized();
  }

  const take = getTakeFromSearchParams(request, 80, 100);

  try {
    const [packages, total] = await Promise.all([
      prisma.servicePackage.findMany({
        orderBy: [{ featured: "desc" }, { name: "asc" }],
        take,
      }),
      prisma.servicePackage.count(),
    ]);

    return NextResponse.json({ data: packages, count: packages.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch service packages");
  }
}

export async function POST(request: NextRequest) {
  const currentUser = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!currentUser) {
    return unauthorized();
  }

  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = servicePackageInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  try {
    const servicePackage = await prisma.servicePackage.create({
      data: parsed.data,
    });

    await prisma.activityLog.create({
      data: {
        actorName: currentUser.fullName ?? currentUser.username,
        action: "Created service package",
        entityType: "ServicePackage",
        entityId: servicePackage.id,
        description: `Created service package ${servicePackage.name}.`,
        severity: "SUCCESS",
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ message: "Service package created", data: servicePackage }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create service package");
  }
}
