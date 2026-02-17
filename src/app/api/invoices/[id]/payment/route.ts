import { InvoiceStatus, PaymentStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { badRequest, notFound, parseDateOrNull, readJsonBody, serverError, unauthorized } from "@/lib/api";

const paymentInputSchema = z.object({
  amountCents: z.coerce.number().int().min(1).max(500000000),
  processor: z.string().trim().min(2).max(60),
  externalReference: z.string().trim().max(120).optional().nullable(),
  paidAt: z.string().datetime().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function applyInvoicePayment(
  user: NonNullable<Awaited<ReturnType<typeof requireRoleFromRequest>>>,
  id: string,
  paymentInput: {
    amountCents: number;
    processor: string;
    externalReference?: string | null;
    paidAt?: Date;
    notes?: string | null;
  },
) {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      return notFound("Invoice");
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.paymentRecord.create({
        data: {
          invoiceId: id,
          amountCents: paymentInput.amountCents,
          processor: paymentInput.processor,
          externalReference: paymentInput.externalReference ?? null,
          status: PaymentStatus.SETTLED,
          paidAt: paymentInput.paidAt ?? new Date(),
          notes: paymentInput.notes ?? null,
        },
      });

      const settledTotal = await tx.paymentRecord.aggregate({
        where: {
          invoiceId: id,
          status: PaymentStatus.SETTLED,
        },
        _sum: {
          amountCents: true,
        },
      });

      const settledAmount = settledTotal._sum.amountCents ?? 0;
      const nextStatus =
        settledAmount >= invoice.amountCents ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;

      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          status: nextStatus,
          paidAt: nextStatus === InvoiceStatus.PAID ? (paymentInput.paidAt ?? new Date()) : invoice.paidAt,
        },
      });

      await tx.activityLog.create({
        data: {
          actorName: user.fullName ?? user.username,
          action: "Recorded payment",
          entityType: "Invoice",
          entityId: id,
          description: `Recorded ${payment.amountCents} cents on invoice ${updatedInvoice.invoiceNumber}.`,
          severity: "SUCCESS",
          userId: user.id,
          clientId: updatedInvoice.clientId,
        },
      });

      return { payment, updatedInvoice, settledAmount };
    });

    return NextResponse.json({
      message: "Payment applied",
      data: result,
    });
  } catch (error) {
    return serverError(error, "Failed to apply payment");
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;
  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = paymentInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const paidAt = parseDateOrNull(parsed.data.paidAt) ?? new Date();

  if (parsed.data.paidAt && !parseDateOrNull(parsed.data.paidAt)) {
    return badRequest("paidAt must be a valid ISO datetime");
  }

  return applyInvoicePayment(user, id, {
    amountCents: parsed.data.amountCents,
    processor: parsed.data.processor,
    externalReference: parsed.data.externalReference ?? null,
    paidAt,
    notes: parsed.data.notes ?? null,
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    const invoice = await prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      return notFound("Invoice");
    }

    const settled = await prisma.paymentRecord.aggregate({
      where: {
        invoiceId: id,
        status: PaymentStatus.SETTLED,
      },
      _sum: {
        amountCents: true,
      },
    });

    const settledAmount = settled._sum.amountCents ?? 0;
    const remaining = Math.max(invoice.amountCents - settledAmount, 0);

    if (remaining === 0) {
      return NextResponse.json({ message: "Invoice already fully settled." });
    }

    return applyInvoicePayment(user, id, {
      amountCents: remaining,
      processor: "Manual",
      externalReference: "MANUAL-QUICK-APPLY",
      paidAt: new Date(),
      notes: "Quick payment apply from CRM action.",
    });
  } catch (error) {
    return serverError(error, "Failed to apply quick payment");
  }
}
