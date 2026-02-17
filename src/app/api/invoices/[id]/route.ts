import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { invoiceUpdateSchema } from "@/lib/validators";
import {
  badRequest,
  notFound,
  parseDateOrNull,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

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

  const parsed = invoiceUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  const issuedAtCandidate =
    parsed.data.issuedAt && parsed.data.issuedAt !== null
      ? parseDateOrNull(parsed.data.issuedAt)
      : undefined;
  const dueDateCandidate =
    parsed.data.dueDate && parsed.data.dueDate !== null
      ? parseDateOrNull(parsed.data.dueDate)
      : undefined;
  const paidAt = parsed.data.paidAt === undefined ? undefined : parseDateOrNull(parsed.data.paidAt);

  if (parsed.data.issuedAt !== undefined && parsed.data.issuedAt !== null && !issuedAtCandidate) {
    return badRequest("issuedAt must be a valid ISO datetime");
  }

  if (parsed.data.dueDate !== undefined && parsed.data.dueDate !== null && !dueDateCandidate) {
    return badRequest("dueDate must be a valid ISO datetime");
  }

  if (parsed.data.paidAt !== undefined && parsed.data.paidAt !== null && !paidAt) {
    return badRequest("paidAt must be a valid ISO datetime");
  }

  if (parsed.data.issuedAt === null) {
    return badRequest("issuedAt cannot be null");
  }

  if (parsed.data.dueDate === null) {
    return badRequest("dueDate cannot be null");
  }

  try {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        invoiceNumber: parsed.data.invoiceNumber,
        amountCents: parsed.data.amountCents,
        status: parsed.data.status,
        issuedAt: parsed.data.issuedAt === undefined ? undefined : (issuedAtCandidate ?? undefined),
        dueDate: parsed.data.dueDate === undefined ? undefined : (dueDateCandidate ?? undefined),
        paidAt: parsed.data.paidAt === undefined ? undefined : paidAt,
        notes: parsed.data.notes ?? undefined,
        clientId: parsed.data.clientId,
        workOrderId: parsed.data.workOrderId ?? undefined,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Updated invoice",
        entityType: "Invoice",
        entityId: id,
        description: `Updated invoice ${invoice.invoiceNumber}.`,
        severity: "INFO",
        userId: user.id,
        clientId: invoice.clientId,
      },
    });

    return NextResponse.json({ message: "Invoice updated", data: invoice });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Invoice");
    }

    return serverError(error, "Failed to update invoice");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.invoice.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Deleted invoice",
        entityType: "Invoice",
        entityId: id,
        description: `Deleted invoice record ${id}.`,
        severity: "WARNING",
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Invoice deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Invoice");
    }

    return serverError(error, "Failed to delete invoice");
  }
}
