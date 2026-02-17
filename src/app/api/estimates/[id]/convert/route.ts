import { EstimateStatus, Priority, UserRole, WorkOrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { createNumber, notFound, serverError, unauthorized } from "@/lib/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function handleConvert(request: NextRequest, context: RouteContext) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    const estimate = await prisma.estimate.findUnique({ where: { id } });

    if (!estimate) {
      return notFound("Estimate");
    }

    if (estimate.convertedWorkOrderId) {
      const workOrder = await prisma.workOrder.findUnique({ where: { id: estimate.convertedWorkOrderId } });
      return NextResponse.json({
        message: "Estimate already converted",
        data: {
          estimate,
          workOrder,
        },
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.create({
        data: {
          code: createNumber("WO"),
          title: estimate.title,
          description: estimate.description,
          status: WorkOrderStatus.BACKLOG,
          priority: Priority.MEDIUM,
          estimatedValueCents: estimate.amountCents,
          clientId: estimate.clientId,
          propertyId: estimate.propertyId,
        },
      });

      const updatedEstimate = await tx.estimate.update({
        where: { id: estimate.id },
        data: {
          status: EstimateStatus.CONVERTED,
          convertedWorkOrderId: workOrder.id,
        },
      });

      await tx.activityLog.create({
        data: {
          actorName: user.fullName ?? user.username,
          action: "Converted estimate",
          entityType: "Estimate",
          entityId: estimate.id,
          description: `Converted ${estimate.estimateNumber} to work order ${workOrder.code}.`,
          severity: "SUCCESS",
          userId: user.id,
          clientId: estimate.clientId,
        },
      });

      return { updatedEstimate, workOrder };
    });

    return NextResponse.json({
      message: "Estimate converted to work order",
      data: {
        estimate: result.updatedEstimate,
        workOrder: result.workOrder,
      },
    });
  } catch (error) {
    return serverError(error, "Failed to convert estimate");
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleConvert(request, context);
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handleConvert(request, context);
}
