import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { paymentProcessorInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const take = getTakeFromSearchParams(request, 20, 50);

  try {
    const [data, total] = await Promise.all([
      prisma.paymentProcessor.findMany({
        orderBy: [{ name: "asc" }],
        take,
      }),
      prisma.paymentProcessor.count(),
    ]);

    return NextResponse.json({ data, count: data.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch payment processors");
  }
}

export async function POST(request: NextRequest) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = paymentProcessorInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  try {
    const data = await prisma.paymentProcessor.create({
      data: {
        name: parsed.data.name,
        enabled: parsed.data.enabled,
        sandboxMode: parsed.data.sandboxMode,
        publishableKeyMasked: parsed.data.publishableKeyMasked ?? null,
        webhookUrl: parsed.data.webhookUrl ?? null,
        notes: parsed.data.notes ?? null,
      },
    });

    return NextResponse.json({ message: "Payment processor created", data }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create payment processor");
  }
}
