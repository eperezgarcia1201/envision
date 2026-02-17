import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { contactPersonUpdateSchema } from "@/lib/validators";
import { badRequest, notFound, readJsonBody, serverError, unauthorized } from "@/lib/api";

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

  const parsed = contactPersonUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  try {
    const existing = await prisma.contactPerson.findUnique({ where: { id } });

    if (!existing) {
      return notFound("Contact");
    }

    const clientId = parsed.data.clientId ?? existing.clientId;

    if (parsed.data.isPrimary === true) {
      await prisma.contactPerson.updateMany({
        where: { clientId, isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.contactPerson.update({
      where: { id },
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone ?? undefined,
        title: parsed.data.title ?? undefined,
        status: parsed.data.status,
        isPrimary: parsed.data.isPrimary,
        isBilling: parsed.data.isBilling,
        notes: parsed.data.notes ?? undefined,
        clientId: parsed.data.clientId,
      },
    });

    return NextResponse.json({ message: "Contact updated", data: contact });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Contact");
    }

    return serverError(error, "Failed to update contact");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.contactPerson.delete({ where: { id } });
    return NextResponse.json({ message: "Contact deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Contact");
    }

    return serverError(error, "Failed to delete contact");
  }
}
