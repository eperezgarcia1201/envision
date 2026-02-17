import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { badRequest, serverError, unauthorized } from "@/lib/api";

function escapeCsvValue(value: unknown) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\n") || text.includes("\"")) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvValue(row[header])).join(","));
  }

  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const resource = (searchParams.get("resource") ?? "invoices").toLowerCase();

  try {
    let rows: Array<Record<string, unknown>> = [];

    if (resource === "invoices") {
      const invoices = await prisma.invoice.findMany({
        include: {
          client: { select: { companyName: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 1000,
      });

      rows = invoices.map((item) => ({
        invoiceNumber: item.invoiceNumber,
        client: item.client.companyName,
        amountCents: item.amountCents,
        status: item.status,
        issuedAt: item.issuedAt.toISOString(),
        dueDate: item.dueDate.toISOString(),
        paidAt: item.paidAt?.toISOString() ?? "",
      }));
    } else if (resource === "leads") {
      const leads = await prisma.lead.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 1000,
      });

      rows = leads.map((item) => ({
        name: item.name,
        email: item.email,
        company: item.company ?? "",
        serviceNeeded: item.serviceNeeded ?? "",
        source: item.source,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      }));
    } else if (resource === "work-orders") {
      const workOrders = await prisma.workOrder.findMany({
        include: {
          client: { select: { companyName: true } },
          property: { select: { name: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 1000,
      });

      rows = workOrders.map((item) => ({
        code: item.code,
        title: item.title,
        status: item.status,
        priority: item.priority,
        client: item.client?.companyName ?? "",
        property: item.property?.name ?? "",
        createdAt: item.createdAt.toISOString(),
      }));
    } else if (resource === "bookings") {
      const bookings = await prisma.bookingRequest.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 1000,
      });

      rows = bookings.map((item) => ({
        name: item.name,
        email: item.email,
        serviceType: item.serviceType,
        status: item.status,
        source: item.source,
        preferredDate: item.preferredDate?.toISOString() ?? "",
        createdAt: item.createdAt.toISOString(),
      }));
    } else if (resource === "payments") {
      const payments = await prisma.paymentRecord.findMany({
        include: {
          invoice: { select: { invoiceNumber: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 1000,
      });

      rows = payments.map((item) => ({
        invoiceNumber: item.invoice.invoiceNumber,
        amountCents: item.amountCents,
        processor: item.processor,
        status: item.status,
        paidAt: item.paidAt?.toISOString() ?? "",
        createdAt: item.createdAt.toISOString(),
      }));
    } else {
      return badRequest("Unsupported resource. Use invoices, leads, work-orders, bookings, or payments.");
    }

    const csv = toCsv(rows);

    await prisma.exportJob.create({
      data: {
        resource,
        format: "csv",
        status: "COMPLETED",
        requestedBy: user.username,
        completedAt: new Date(),
        notes: `Exported ${rows.length} rows.`,
      },
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${resource}-export.csv"`,
      },
    });
  } catch (error) {
    return serverError(error, "Failed to export report");
  }
}
