import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { paymentRecordUpdateSchema } from "@/lib/validators";
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

  const parsed = paymentRecordUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  const paidAt =
    parsed.data.paidAt === undefined ? undefined : (parseDateOrNull(parsed.data.paidAt) ?? undefined);

  if (parsed.data.paidAt !== undefined && parsed.data.paidAt !== null && !paidAt) {
    return badRequest("paidAt must be a valid ISO datetime");
  }

  try {
    const data = await prisma.paymentRecord.update({
      where: { id },
      data: {
        amountCents: parsed.data.amountCents,
        processor: parsed.data.processor,
        externalReference: parsed.data.externalReference ?? undefined,
        status: parsed.data.status,
        paidAt,
        notes: parsed.data.notes ?? undefined,
        invoiceId: parsed.data.invoiceId,
      },
    });

    return NextResponse.json({ message: "Payment record updated", data });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Payment record");
    }

    return serverError(error, "Failed to update payment record");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.paymentRecord.delete({ where: { id } });
    return NextResponse.json({ message: "Payment record deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Payment record");
    }

    return serverError(error, "Failed to delete payment record");
  }
}
