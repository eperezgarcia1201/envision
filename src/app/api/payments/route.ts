import { PaymentStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { paymentRecordInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  parseDateOrNull,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

const statuses = new Set(Object.values(PaymentStatus));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const take = getTakeFromSearchParams(request, 80, 150);

  const where =
    statusParam && statuses.has(statusParam as PaymentStatus)
      ? { status: statusParam as PaymentStatus }
      : undefined;

  try {
    const [data, total] = await Promise.all([
      prisma.paymentRecord.findMany({
        where,
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              client: { select: { companyName: true } },
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take,
      }),
      prisma.paymentRecord.count({ where }),
    ]);

    return NextResponse.json({ data, count: data.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch payments");
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

  const parsed = paymentRecordInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const paidAt = parseDateOrNull(parsed.data.paidAt);

  if (parsed.data.paidAt && !paidAt) {
    return badRequest("paidAt must be a valid ISO datetime");
  }

  try {
    const data = await prisma.paymentRecord.create({
      data: {
        amountCents: parsed.data.amountCents,
        processor: parsed.data.processor,
        externalReference: parsed.data.externalReference ?? null,
        status: parsed.data.status,
        paidAt,
        notes: parsed.data.notes ?? null,
        invoiceId: parsed.data.invoiceId,
      },
    });

    return NextResponse.json({ message: "Payment record created", data }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create payment record");
  }
}
