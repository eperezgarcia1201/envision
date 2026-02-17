import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { paymentProcessorUpdateSchema } from "@/lib/validators";
import { badRequest, notFound, readJsonBody, serverError, unauthorized } from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;
  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = paymentProcessorUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("At least one field must be provided");
  }

  try {
    const data = await prisma.paymentProcessor.update({
      where: { id },
      data: {
        name: parsed.data.name,
        enabled: parsed.data.enabled,
        sandboxMode: parsed.data.sandboxMode,
        publishableKeyMasked: parsed.data.publishableKeyMasked ?? undefined,
        webhookUrl: parsed.data.webhookUrl ?? undefined,
        notes: parsed.data.notes ?? undefined,
      },
    });

    return NextResponse.json({ message: "Payment processor updated", data });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to update not found")) {
      return notFound("Payment processor");
    }

    return serverError(error, "Failed to update payment processor");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, UserRole.ADMIN);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    await prisma.paymentProcessor.delete({ where: { id } });
    return NextResponse.json({ message: "Payment processor deleted" });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("record to delete does not exist")) {
      return notFound("Payment processor");
    }

    return serverError(error, "Failed to delete payment processor");
  }
}
