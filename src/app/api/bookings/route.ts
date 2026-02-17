import { BookingStatus, LeadStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest, requireRoleFromRequest } from "@/lib/auth";
import { bookingRequestInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  parseDateOrNull,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

const statuses = new Set(Object.values(BookingStatus));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const take = getTakeFromSearchParams(request, 50, 120);

  const where =
    statusParam && statuses.has(statusParam as BookingStatus)
      ? { status: statusParam as BookingStatus }
      : undefined;

  try {
    const [data, total] = await Promise.all([
      prisma.bookingRequest.findMany({
        where,
        include: {
          client: { select: { companyName: true } },
          convertedLead: { select: { name: true, status: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        take,
      }),
      prisma.bookingRequest.count({ where }),
    ]);

    return NextResponse.json({ data, count: data.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch booking requests");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = bookingRequestInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const preferredDate = parseDateOrNull(parsed.data.preferredDate);

  if (parsed.data.preferredDate && !preferredDate) {
    return badRequest("preferredDate must be a valid ISO datetime");
  }

  const internalRoles = new Set<UserRole>([UserRole.ADMIN, UserRole.MANAGER]);
  const canWriteLifecycle = user ? internalRoles.has(user.role) : false;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const shouldCreateLead = !parsed.data.convertedLeadId;

      const lead = shouldCreateLead
        ? await tx.lead.create({
            data: {
              name: parsed.data.name,
              email: parsed.data.email,
              phone: parsed.data.phone ?? null,
              company: parsed.data.company ?? null,
              serviceNeeded: parsed.data.serviceType,
              message: parsed.data.notes ?? "Booking request submitted.",
              source: parsed.data.source,
              status: LeadStatus.NEW,
            },
          })
        : null;

      const booking = await tx.bookingRequest.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone ?? null,
          company: parsed.data.company ?? null,
          address: parsed.data.address ?? null,
          serviceType: parsed.data.serviceType,
          frequency: parsed.data.frequency ?? null,
          preferredDate,
          source: canWriteLifecycle ? parsed.data.source : "website-booking",
          status: canWriteLifecycle ? parsed.data.status : BookingStatus.NEW,
          notes: parsed.data.notes ?? null,
          convertedLeadId: parsed.data.convertedLeadId ?? lead?.id ?? null,
          clientId: parsed.data.clientId ?? null,
        },
      });

      if (user && canWriteLifecycle) {
        await tx.activityLog.create({
          data: {
            actorName: user.fullName ?? user.username,
            action: "Created booking request",
            entityType: "BookingRequest",
            entityId: booking.id,
            description: `Created booking request for ${booking.name}.`,
            severity: "INFO",
            userId: user.id,
            clientId: booking.clientId,
          },
        });
      }

      return { booking, leadId: lead?.id ?? null };
    });

    return NextResponse.json(
      {
        message: "Booking request captured",
        data: result.booking,
        linkedLeadId: result.leadId,
      },
      { status: 201 },
    );
  } catch (error) {
    return serverError(error, "Failed to create booking request");
  }
}
