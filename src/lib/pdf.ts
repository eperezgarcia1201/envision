import PDFDocument from "pdfkit";

export async function renderPdfBuffer(render: (doc: PDFKit.PDFDocument) => void) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      render(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export function drawDocumentHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string) {
  doc.rect(48, 46, 500, 84).fill("#0f2658");

  doc
    .fillColor("#d6ac63")
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Envision Maintenence", 64, 66, { align: "left" });

  doc
    .fillColor("#ffffff")
    .fontSize(11)
    .font("Helvetica")
    .text("Los Angeles, California", 64, 86, { align: "left" })
    .text("Professional Maintenance Operations", 64, 100, { align: "left" });

  doc
    .fillColor("#ffffff")
    .fontSize(20)
    .font("Helvetica-Bold")
    .text(title, 300, 66, { align: "right", width: 220 })
    .fontSize(10)
    .font("Helvetica")
    .text(subtitle, 300, 94, { align: "right", width: 220 });
}

export function drawSectionTitle(doc: PDFKit.PDFDocument, title: string, y: number) {
  doc
    .fillColor("#123066")
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(title, 48, y);

  doc.moveTo(48, y + 16).lineTo(548, y + 16).strokeColor("#d6deef").lineWidth(1).stroke();
}

export function drawLabelValue(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width = 230,
) {
  doc.fillColor("#4e6288").font("Helvetica-Bold").fontSize(9).text(label, x, y, { width });
  doc
    .fillColor("#132d5f")
    .font("Helvetica")
    .fontSize(11)
    .text(value || "-", x, y + 14, { width });
}
