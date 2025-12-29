import fs from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { formatDateFr, formatDateIso, formatMoney, formatMoneySmart } from "./format";

type ConventionPayload = {
  companyName: string;
  companyAddress: string;
  representativeName: string;
  representativeRole: string;
  trainingName: string;
  duration: string;
  dateStart: string;
  dateEnd: string;
  location: string;
  instructor: string;
  participants: string;
  amountHt: number;
  amountTva: number;
  amountTtc: number;
  conventionDate: string;
};

type LineSpec = {
  pageIndex: number;
  x: number;
  top: number;
  height: number;
  fontSize?: number;
  maxWidth?: number;
  clearWidth?: number;
  lineHeight?: number;
  maxLines?: number;
};

const LINES: Record<string, LineSpec> = {
  companyLine: {
    pageIndex: 0,
    x: 42.52,
    top: 302.1,
    height: 9.1,
    fontSize: 9,
    maxWidth: 480,
    lineHeight: 11,
    maxLines: 2,
  },
  representativeLine: {
    pageIndex: 0,
    x: 42.52,
    top: 347.46,
    height: 9.1,
    fontSize: 9,
    maxWidth: 480,
  },
  trainingLine: {
    pageIndex: 0,
    x: 42.52,
    top: 503.36,
    height: 9.1,
    fontSize: 9,
    maxWidth: 480,
  },
  durationLine: {
    pageIndex: 0,
    x: 56.69,
    top: 681.95,
    height: 9.1,
    fontSize: 9,
    maxWidth: 480,
  },
  datesLine: {
    pageIndex: 0,
    x: 56.69,
    top: 704.62,
    height: 9.1,
    fontSize: 9,
    maxWidth: 480,
  },
  locationLine: {
    pageIndex: 0,
    x: 56.69,
    top: 727.3,
    height: 9.1,
    fontSize: 9,
    maxWidth: 480,
  },
  instructorLine: {
    pageIndex: 0,
    x: 56.69,
    top: 749.98,
    height: 9.1,
    fontSize: 9,
    maxWidth: 480,
  },
  participantsLine: {
    pageIndex: 1,
    x: 56.69,
    top: 75.33,
    height: 9.1,
    fontSize: 9,
    maxWidth: 480,
    lineHeight: 11,
    maxLines: 3,
  },
  montantHtLine: {
    pageIndex: 1,
    x: 56.69,
    top: 177.38,
    height: 9.1,
    fontSize: 9,
    maxWidth: 480,
  },
  tvaLine: {
    pageIndex: 1,
    x: 56.69,
    top: 200.06,
    height: 9.1,
    fontSize: 9,
    maxWidth: 480,
  },
  montantTtcLine: {
    pageIndex: 1,
    x: 56.69,
    top: 222.73,
    height: 9.1,
    fontSize: 9,
    maxWidth: 480,
  },
  doneLine: {
    pageIndex: 1,
    x: 42.52,
    top: 506.2,
    height: 9.1,
    fontSize: 9,
    maxWidth: 480,
  },
  clientNameLine: {
    pageIndex: 1,
    x: 42.52,
    top: 560.06,
    height: 9.1,
    fontSize: 9,
    maxWidth: 480,
  },
  clientRoleLine: {
    pageIndex: 1,
    x: 42.52,
    top: 582.73,
    height: 9.1,
    fontSize: 9,
    maxWidth: 480,
  },
};

const SIGNATURE = {
  pageIndex: 2,
  x: 120,
  top: 35.65,
  width: 180,
};

function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
  maxLines = 2
): string[] {
  const words = text.split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, fontSize) <= maxWidth || !current) {
      current = next;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length >= maxLines - 1) {
      break;
    }
  }

  if (current) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    return lines.slice(0, maxLines);
  }

  if (lines.length === maxLines && words.length > 0) {
    const last = lines[lines.length - 1];
    if (font.widthOfTextAtSize(last, fontSize) > maxWidth) {
      lines[lines.length - 1] = last.slice(0, -3).trimEnd() + "...";
    }
  }

  return lines;
}

function yFromTop(pageHeight: number, top: number, height: number): number {
  return pageHeight - top - height + 1;
}

function drawLine(
  pdfDoc: PDFDocument,
  font: PDFFont,
  line: LineSpec,
  text: string
) {
  const page = pdfDoc.getPages()[line.pageIndex];
  const pageHeight = page.getHeight();
  const fontSize = line.fontSize ?? 9;
  const maxWidth = line.maxWidth ?? page.getWidth() - line.x - 40;
  const lineHeight = line.lineHeight ?? fontSize + 2;
  const maxLines = line.maxLines ?? 1;
  const lines = wrapText(text, font, fontSize, maxWidth, maxLines);

  const clearHeight = line.height + (lines.length - 1) * lineHeight + 2;
  const clearWidth = line.clearWidth ?? page.getWidth() - line.x - 40;
  const clearY = yFromTop(pageHeight, line.top, line.height) - 1;

  page.drawRectangle({
    x: line.x - 1,
    y: clearY,
    width: clearWidth,
    height: clearHeight,
    color: rgb(1, 1, 1),
  });

  const baseY = yFromTop(pageHeight, line.top, line.height);
  lines.forEach((value, index) => {
    page.drawText(value, {
      x: line.x,
      y: baseY - index * lineHeight,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  });
}

export async function generateConventionPdf(payload: ConventionPayload) {
  const templatePath = path.join(process.cwd(), "templates", "convention.pdf");
  const signaturePath = path.join(process.cwd(), "templates", "signature.png");
  const [templateBytes, signatureBytes] = await Promise.all([
    fs.readFile(templatePath),
    fs.readFile(signaturePath),
  ]);

  const pdfDoc = await PDFDocument.load(templateBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const companyLine = `Et : ${payload.companyName}, dont le siège social est situé à ${payload.companyAddress}`;
  const representativeLine = `${payload.representativeName} en qualité de ${payload.representativeRole}.`;
  const trainingLine = payload.trainingName;
  const durationLine = `• Durée de la formation : ${payload.duration}.`;
  const datesLine = `• Dates de formation : ${formatDateFr(
    payload.dateStart
  )} au ${formatDateFr(payload.dateEnd)}.`;
  const locationLine = `• Lieu de la formation : ${payload.location}.`;
  const instructorLine = `• Intervenant : ${payload.instructor}`;

  const participantsLine = `• ${payload.participants}`;
  const montantHtLine = `• Montant HT : ${formatMoneySmart(
    payload.amountHt
  )} euros`;
  const tvaLine = `• TVA (20%) : ${formatMoney(payload.amountTva)} euros`;
  const montantTtcLine = `• Montant TTC : ${formatMoney(
    payload.amountTtc
  )} euros`;
  const doneLine = `Fait en 2 exemplaires, à ${payload.location.toUpperCase()}, le ${formatDateIso(
    payload.conventionDate
  )}`;
  const clientNameLine = `Nom : ${payload.representativeName}`;
  const clientRoleLine = `Fonction : ${payload.representativeRole}`;

  drawLine(pdfDoc, font, LINES.companyLine, companyLine);
  drawLine(pdfDoc, font, LINES.representativeLine, representativeLine);
  drawLine(pdfDoc, font, LINES.trainingLine, trainingLine);
  drawLine(pdfDoc, font, LINES.durationLine, durationLine);
  drawLine(pdfDoc, font, LINES.datesLine, datesLine);
  drawLine(pdfDoc, font, LINES.locationLine, locationLine);
  drawLine(pdfDoc, font, LINES.instructorLine, instructorLine);

  drawLine(pdfDoc, font, LINES.participantsLine, participantsLine);
  drawLine(pdfDoc, font, LINES.montantHtLine, montantHtLine);
  drawLine(pdfDoc, font, LINES.tvaLine, tvaLine);
  drawLine(pdfDoc, font, LINES.montantTtcLine, montantTtcLine);
  drawLine(pdfDoc, font, LINES.doneLine, doneLine);
  drawLine(pdfDoc, font, LINES.clientNameLine, clientNameLine);
  drawLine(pdfDoc, font, LINES.clientRoleLine, clientRoleLine);

  const signatureImage = await pdfDoc.embedPng(signatureBytes);
  const signaturePage = pdfDoc.getPages()[SIGNATURE.pageIndex];
  const signatureScale = SIGNATURE.width / signatureImage.width;
  const signatureHeight = signatureImage.height * signatureScale;
  const signatureY =
    signaturePage.getHeight() - SIGNATURE.top - signatureHeight - 6;

  signaturePage.drawImage(signatureImage, {
    x: SIGNATURE.x,
    y: signatureY,
    width: SIGNATURE.width,
    height: signatureHeight,
  });

  return pdfDoc.save();
}
