import { ExportStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { exportJobInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  parseDateOrNull,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

const statuses = new Set(Object.values(ExportStatus));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const take = getTakeFromSearchParams(request, 80, 150);

  const where =
    statusParam && statuses.has(statusParam as ExportStatus)
      ? { status: statusParam as ExportStatus }
      : undefined;

  try {
    const [data, total] = await Promise.all([
      prisma.exportJob.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        take,
      }),
      prisma.exportJob.count({ where }),
    ]);

    return NextResponse.json({ data, count: data.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch export jobs");
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

  const parsed = exportJobInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const completedAt = parseDateOrNull(parsed.data.completedAt);

  if (parsed.data.completedAt && !completedAt) {
    return badRequest("completedAt must be a valid ISO datetime");
  }

  try {
    const data = await prisma.exportJob.create({
      data: {
        resource: parsed.data.resource,
        format: parsed.data.format,
        status: parsed.data.status,
        requestedBy: parsed.data.requestedBy ?? user.username,
        downloadUrl: parsed.data.downloadUrl ?? null,
        completedAt,
        notes: parsed.data.notes ?? null,
      },
    });

    return NextResponse.json({ message: "Export job created", data }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create export job");
  }
}
