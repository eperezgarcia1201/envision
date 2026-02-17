import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { clientUpdateSchema } from "@/lib/validators";
import { badRequest, notFound, readJsonBody, serverError, unauthorized } from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        properties: true,
        workOrders: {
          orderBy: [{ updatedAt: "desc" }],
          take: 20,
        },
        invoices: {
          orderBy: [{ dueDate: "asc" }],
          take: 20,
        },
        estimates: {
          orderBy: [{ updatedAt: "desc" }],
          take: 20,
        },
      },
    });

    if (!client) {
      return notFound("Client");
    }

    return NextResponse.json({ data: client });
  } catch (error) {
    return serverError(error, "Failed to fetch client");
  }
}

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

  const parsed = clientUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  try {
    const client = await prisma.client.update({
      where: { id },
      data: parsed.data,
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Updated client",
        entityType: "Client",
        entityId: client.id,
        description: `Updated client profile for ${client.companyName}.`,
        severity: "INFO",
        userId: user.id,
        clientId: client.id,
      },
    });

    return NextResponse.json({ message: "Client updated", data: client });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Client");
    }

    return serverError(error, "Failed to update client");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.client.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Deleted client",
        entityType: "Client",
        entityId: id,
        description: `Deleted client account ${id}.`,
        severity: "WARNING",
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Client deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Client");
    }

    return serverError(error, "Failed to delete client");
  }
}
