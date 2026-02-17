import { InvoiceStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { invoiceInputSchema } from "@/lib/validators";
import {
  badRequest,
  createNumber,
  getTakeFromSearchParams,
  parseDateOrNull,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

const statuses = new Set(Object.values(InvoiceStatus));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const take = getTakeFromSearchParams(request, 30, 100);

  const where =
    statusParam && statuses.has(statusParam as InvoiceStatus)
      ? { status: statusParam as InvoiceStatus }
      : undefined;

  try {
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: {
            select: {
              companyName: true,
            },
          },
          workOrder: {
            select: {
              code: true,
              title: true,
            },
          },
        },
        orderBy: [{ dueDate: "asc" }],
        take,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({ data: invoices, count: invoices.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch invoices");
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

  const parsed = invoiceInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const issuedAt = parseDateOrNull(parsed.data.issuedAt) ?? new Date();
  const dueDate = parseDateOrNull(parsed.data.dueDate);
  const paidAt = parseDateOrNull(parsed.data.paidAt);

  if (!dueDate) {
    return badRequest("dueDate must be a valid ISO datetime");
  }

  if (parsed.data.paidAt && !paidAt) {
    return badRequest("paidAt must be a valid ISO datetime");
  }

  try {
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: parsed.data.invoiceNumber ?? createNumber("INV"),
        amountCents: parsed.data.amountCents,
        status: parsed.data.status,
        issuedAt,
        dueDate,
        paidAt,
        notes: parsed.data.notes ?? null,
        clientId: parsed.data.clientId,
        workOrderId: parsed.data.workOrderId ?? null,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Created invoice",
        entityType: "Invoice",
        entityId: invoice.id,
        description: `Created invoice ${invoice.invoiceNumber} for ${invoice.amountCents} cents.`,
        severity: "INFO",
        userId: user.id,
        clientId: invoice.clientId,
      },
    });

    return NextResponse.json({ message: "Invoice created", data: invoice }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create invoice");
  }
}
