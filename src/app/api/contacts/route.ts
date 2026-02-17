import { ContactStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { contactPersonInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

const statuses = new Set(Object.values(ContactStatus));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const take = getTakeFromSearchParams(request, 80, 120);

  const where =
    statusParam && statuses.has(statusParam as ContactStatus)
      ? { status: statusParam as ContactStatus }
      : undefined;

  try {
    const [data, total] = await Promise.all([
      prisma.contactPerson.findMany({
        where,
        include: {
          client: {
            select: {
              companyName: true,
            },
          },
        },
        orderBy: [{ isPrimary: "desc" }, { fullName: "asc" }],
        take,
      }),
      prisma.contactPerson.count({ where }),
    ]);

    return NextResponse.json({ data, count: data.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch contacts");
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

  const parsed = contactPersonInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  try {
    if (parsed.data.isPrimary) {
      await prisma.contactPerson.updateMany({
        where: { clientId: parsed.data.clientId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.contactPerson.create({
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
        title: parsed.data.title ?? null,
        status: parsed.data.status,
        isPrimary: parsed.data.isPrimary,
        isBilling: parsed.data.isBilling,
        notes: parsed.data.notes ?? null,
        clientId: parsed.data.clientId,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Created contact",
        entityType: "ContactPerson",
        entityId: contact.id,
        description: `Added contact ${contact.fullName}.`,
        severity: "INFO",
        userId: user.id,
        clientId: contact.clientId,
      },
    });

    return NextResponse.json({ message: "Contact created", data: contact }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create contact");
  }
}
