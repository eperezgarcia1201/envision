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

  const estimate = await prisma.estimate.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
        },
      },
      property: {
        select: {
          name: true,
          addressLine1: true,
          city: true,
          state: true,
          zipCode: true,
        },
      },
      lead: {
        select: {
          name: true,
          company: true,
          email: true,
        },
      },
      convertedWorkOrder: {
        select: {
          code: true,
          title: true,
        },
      },
    },
  });

  if (!estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  if (user.role === UserRole.CLIENT && user.clientId && estimate.clientId !== user.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientName = estimate.client?.companyName ?? estimate.lead?.company ?? "Prospective Client";
  const contactName = estimate.client?.contactName ?? estimate.lead?.name ?? "-";
  const contactEmail = estimate.client?.email ?? estimate.lead?.email ?? "-";

  const buffer = await renderPdfBuffer((doc) => {
    drawDocumentHeader(doc, "Quote", estimate.estimateNumber);

    drawSectionTitle(doc, "Quote Details", 150);
    drawLabelValue(doc, "Quote Number", estimate.estimateNumber, 48, 174);
    drawLabelValue(doc, "Status", estimate.status, 300, 174);
    drawLabelValue(doc, "Prepared By", estimate.preparedBy ?? "Operations Team", 48, 214);
    drawLabelValue(doc, "Valid Until", formatDate(estimate.validUntil), 300, 214);
    drawLabelValue(doc, "Client", clientName, 48, 254);
    drawLabelValue(doc, "Contact", contactName, 300, 254);
    drawLabelValue(doc, "Contact Email", contactEmail, 48, 294);

    drawSectionTitle(doc, "Scope", 350);
    drawLabelValue(doc, "Title", estimate.title, 48, 374, 500);

    doc
      .fillColor("#1b3668")
      .font("Helvetica")
      .fontSize(10)
      .text(estimate.description, 48, 414, {
        width: 500,
        lineGap: 2,
      });

    drawSectionTitle(doc, "Commercial Terms", 530);
    drawLabelValue(doc, "Quoted Amount", formatCurrencyFromCents(estimate.amountCents), 48, 554, 200);
    drawLabelValue(doc, "Converted WO", estimate.convertedWorkOrder?.code ?? "Not converted", 300, 554, 200);

    if (estimate.property) {
      drawLabelValue(
        doc,
        "Property",
        `${estimate.property.name}, ${estimate.property.addressLine1}, ${estimate.property.city}, ${estimate.property.state} ${estimate.property.zipCode}`,
        48,
        594,
        500,
      );
    }

    if (estimate.notes) {
      drawSectionTitle(doc, "Notes", 650);
      doc
        .fillColor("#1b3668")
        .font("Helvetica")
        .fontSize(10)
        .text(estimate.notes, 48, 674, {
          width: 500,
          lineGap: 2,
        });
    }

    doc
      .fillColor("#5a6e94")
      .font("Helvetica")
      .fontSize(9)
      .text(
        "This quote is confidential and intended for authorized client representatives of Envision Maintenence.",
        48,
        760,
        { width: 500, align: "center" },
      );
  });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=\"${estimate.estimateNumber}.pdf\"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
