import { LeadStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { leadInputSchema } from "@/lib/validators";

const statuses = new Set(Object.values(LeadStatus));

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
    statusParam && statuses.has(statusParam as LeadStatus)
      ? {
          status: statusParam as LeadStatus,
        }
      : undefined;

  const leads = await prisma.lead.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take,
  });

  return NextResponse.json({ data: leads, count: leads.length });
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = leadInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        ...parsed.data,
        phone: parsed.data.phone ?? null,
        company: parsed.data.company ?? null,
        serviceNeeded: parsed.data.serviceNeeded ?? null,
      },
    });

    return NextResponse.json(
      {
        message: "Lead captured",
        data: lead,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create lead",
      },
      { status: 500 },
    );
  }
}
