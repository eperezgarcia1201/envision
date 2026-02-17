import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";
import { drawDocumentHeader, drawLabelValue, drawSectionTitle, renderPdfBuffer } from "@/lib/pdf";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
        },
      },
      workOrder: {
        select: {
          code: true,
          title: true,
          description: true,
        },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (user.role === UserRole.CLIENT && user.clientId !== invoice.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await renderPdfBuffer((doc) => {
    drawDocumentHeader(doc, "Invoice", invoice.invoiceNumber);

    drawSectionTitle(doc, "Billing Summary", 150);
    drawLabelValue(doc, "Invoice Number", invoice.invoiceNumber, 48, 174);
    drawLabelValue(doc, "Status", invoice.status, 300, 174);
    drawLabelValue(doc, "Issue Date", formatDate(invoice.issuedAt), 48, 214);
    drawLabelValue(doc, "Due Date", formatDate(invoice.dueDate), 300, 214);
    drawLabelValue(doc, "Client", invoice.client.companyName, 48, 254);
    drawLabelValue(doc, "Contact", invoice.client.contactName, 300, 254);
    drawLabelValue(doc, "Client Email", invoice.client.email, 48, 294);
    drawLabelValue(doc, "Client Phone", invoice.client.phone, 300, 294);

    drawSectionTitle(doc, "Work Scope", 350);
    drawLabelValue(doc, "Work Order", invoice.workOrder?.code ?? "Unlinked", 48, 374, 500);
    drawLabelValue(doc, "Title", invoice.workOrder?.title ?? "Maintenance Services", 48, 414, 500);

    const description = invoice.workOrder?.description ?? "General maintenance and operations support.";
    doc
      .fillColor("#1b3668")
      .font("Helvetica")
      .fontSize(10)
      .text(description, 48, 452, {
        width: 500,
        lineGap: 2,
      });

    drawSectionTitle(doc, "Amount", 560);
    drawLabelValue(doc, "Subtotal", formatCurrencyFromCents(invoice.amountCents), 48, 584, 200);
    drawLabelValue(doc, "Amount Due", formatCurrencyFromCents(invoice.amountCents), 300, 584, 200);

    if (invoice.notes) {
      drawSectionTitle(doc, "Notes", 644);
      doc
        .fillColor("#1b3668")
        .font("Helvetica")
        .fontSize(10)
        .text(invoice.notes, 48, 668, {
          width: 500,
          lineGap: 2,
        });
    }

    doc
      .fillColor("#5a6e94")
      .font("Helvetica")
      .fontSize(9)
      .text(
        "Thank you for choosing Envision Maintenence. For payment or support, contact info@envisionmaintenence.com.",
        48,
        760,
        { width: 500, align: "center" },
      );
  });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=\"${invoice.invoiceNumber}.pdf\"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
