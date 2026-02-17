import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { clientInputSchema } from "@/lib/validators";
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

  const take = getTakeFromSearchParams(request, 40, 100);

  try {
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        include: {
          _count: {
            select: {
              properties: true,
              workOrders: true,
              invoices: true,
              estimates: true,
            },
          },
        },
        orderBy: [{ companyName: "asc" }],
        take,
      }),
      prisma.client.count(),
    ]);

    return NextResponse.json({ data: clients, count: clients.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch clients");
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

  const parsed = clientInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  try {
    const client = await prisma.client.create({
      data: parsed.data,
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Created client",
        entityType: "Client",
        entityId: client.id,
        description: `Created client account ${client.companyName}.`,
        severity: "SUCCESS",
        userId: user.id,
        clientId: client.id,
      },
    });

    return NextResponse.json({ message: "Client created", data: client }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create client");
  }
}
