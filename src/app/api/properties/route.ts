import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { propertyInputSchema } from "@/lib/validators";
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

  const take = getTakeFromSearchParams(request, 50, 100);

  try {
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        include: {
          client: { select: { companyName: true } },
          _count: {
            select: {
              workOrders: true,
              estimates: true,
              scheduleItems: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }],
        take,
      }),
      prisma.property.count(),
    ]);

    return NextResponse.json({ data: properties, count: properties.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch properties");
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

  const parsed = propertyInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  try {
    const property = await prisma.property.create({
      data: {
        ...parsed.data,
        clientId: parsed.data.clientId ?? null,
      },
    });

    return NextResponse.json({ message: "Property created", data: property }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create property");
  }
}
