import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { planTierInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const take = getTakeFromSearchParams(request, 20, 50);

  try {
    const [data, total] = await Promise.all([
      prisma.planTier.findMany({
        orderBy: [{ monthlyPriceCents: "asc" }],
        take,
      }),
      prisma.planTier.count(),
    ]);

    return NextResponse.json({ data, count: data.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch plans");
  }
}

export async function POST(request: NextRequest) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = planTierInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  try {
    const data = await prisma.planTier.create({
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

    return NextResponse.json({ message: "Plan tier created", data }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create plan tier");
  }
}
