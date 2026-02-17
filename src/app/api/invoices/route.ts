import { InvoiceStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";

const statuses = new Set(Object.values(InvoiceStatus));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const takeParam = Number(searchParams.get("take") ?? "25");
  const take = Number.isFinite(takeParam) ? Math.min(Math.max(takeParam, 1), 100) : 25;

  const where =
    statusParam && statuses.has(statusParam as InvoiceStatus)
      ? { status: statusParam as InvoiceStatus }
      : undefined;

  const invoices = await prisma.invoice.findMany({
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
  });

  return NextResponse.json({ data: invoices, count: invoices.length });
}
