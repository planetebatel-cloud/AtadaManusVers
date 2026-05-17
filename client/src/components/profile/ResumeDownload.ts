/*
 * ATADA — Resume PDF Generator
 *
 * Renders the resume PDF DIRECTLY from ResumeData via jsPDF's text APIs.
 * No html2canvas, no DOM snapshot — so:
 *   - Text is selectable + searchable + sharp at any zoom
 *   - No font-loading races, no letter-spacing kerning bugs
 *   - No oklch / color-mix issues
 *   - File size ~30 KB instead of ~1 MB rasterized
 *   - Works identically on desktop and mobile
 *
 * Layout mirrors the on-screen ResumePreview as closely as practical using
 * the built-in Helvetica/Courier faces (DM Sans / DM Mono visually close).
 */

import { jsPDF } from "jspdf";
import type { ResumeData } from "@/lib/resume-types";

// A4 in mm. jsPDF default unit.
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 18;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

const COLOR_INK = [10, 10, 10] as const;        // #0A0A0A
const COLOR_BODY = [40, 40, 40] as const;       // #282828
const COLOR_MUTED = [80, 80, 80] as const;      // #505050
const COLOR_FAINT = [128, 128, 128] as const;   // #808080
const COLOR_RULE = [216, 216, 216] as const;    // #D8D8D8
const COLOR_TAG_BG = [250, 250, 250] as const;  // #FAFAFA

function setFillRGB(pdf: jsPDF, c: readonly [number, number, number]) {
  pdf.setFillColor(c[0], c[1], c[2]);
}
function setTextRGB(pdf: jsPDF, c: readonly [number, number, number]) {
  pdf.setTextColor(c[0], c[1], c[2]);
}
function setDrawRGB(pdf: jsPDF, c: readonly [number, number, number]) {
  pdf.setDrawColor(c[0], c[1], c[2]);
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(p => p[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AT";
}

// Draw a centered diagonal "ATADA" watermark across the page.
function drawWatermark(pdf: jsPDF) {
  pdf.saveGraphicsState();
  // GState with low opacity for the watermark.
  // jsPDF exposes setGState via the API, but availability depends on version.
  // We approximate with light grey at no opacity — still subtle.
  setTextRGB(pdf, [230, 230, 230]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(80);
  const rows = 4;
  const stepY = PAGE_H / (rows + 1);
  for (let i = 1; i <= rows; i++) {
    const y = stepY * i;
    // jsPDF.text supports an `angle` option for rotation
    pdf.text("ATADA", PAGE_W / 2, y, { align: "center", angle: 22 });
  }
  pdf.restoreGraphicsState();
}

function drawSectionTitle(pdf: jsPDF, y: number, title: string): number {
  pdf.setFont("courier", "normal");
  pdf.setFontSize(8.5);
  setTextRGB(pdf, COLOR_FAINT);
  pdf.text(title.toUpperCase(), MARGIN_X, y);
  // Underline rule
  setDrawRGB(pdf, [236, 236, 236]);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN_X, y + 1.6, MARGIN_X + CONTENT_W, y + 1.6);
  return y + 6;
}

function ensureSpace(pdf: jsPDF, currentY: number, needed: number): number {
  if (currentY + needed > PAGE_H - 20) {
    pdf.addPage();
    drawWatermark(pdf);
    return 20;
  }
  return currentY;
}

function drawWrappedText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
): number {
  const lines = pdf.splitTextToSize(text, width);
  for (const line of lines) {
    y = ensureSpace(pdf, y, lineHeight);
    pdf.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

export async function generateResumePDF(
  data: ResumeData,
  fileName: string = "resume-atada.pdf",
): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  drawWatermark(pdf);

  let y = 22;

  // ── Header: avatar circle + name + title + location ────────────────────
  const initials = initialsOf(data.name || "Atada User");
  // Avatar circle
  setFillRGB(pdf, COLOR_INK);
  pdf.circle(MARGIN_X + 8, y + 2, 8, "F");
  setTextRGB(pdf, [255, 255, 255]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(initials, MARGIN_X + 8, y + 4.2, { align: "center" });

  // Name
  setTextRGB(pdf, COLOR_INK);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text(data.name || "Your Name", MARGIN_X + 22, y + 1);

  // Title
  setTextRGB(pdf, COLOR_MUTED);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text(data.title || "Professional Title", MARGIN_X + 22, y + 7);

  // Location
  if (data.location) {
    setTextRGB(pdf, COLOR_FAINT);
    pdf.setFontSize(9);
    pdf.text(data.location, MARGIN_X + 22, y + 12);
  }
  y += 22;

  // Divider
  setDrawRGB(pdf, COLOR_RULE);
  pdf.setLineWidth(0.4);
  pdf.line(MARGIN_X, y, MARGIN_X + CONTENT_W, y);
  y += 8;

  // ── About ────────────────────────────────────────────────────────────────
  if (data.about?.trim()) {
    y = drawSectionTitle(pdf, y, "About");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    setTextRGB(pdf, COLOR_BODY);
    y = drawWrappedText(pdf, data.about, MARGIN_X, y, CONTENT_W, 4.6);
    y += 4;
  }

  // ── Experience ───────────────────────────────────────────────────────────
  const exp = data.experience.filter(e => e.title || e.company || e.description);
  if (exp.length > 0) {
    y = ensureSpace(pdf, y, 18);
    y = drawSectionTitle(pdf, y, "Experience");
    for (const e of exp) {
      y = ensureSpace(pdf, y, 14);
      // Position + dates row
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      setTextRGB(pdf, COLOR_INK);
      pdf.text(e.title || "Position", MARGIN_X, y);

      const dates = [e.startDate, e.endDate].filter(Boolean).join(" – ");
      if (dates) {
        pdf.setFont("courier", "normal");
        pdf.setFontSize(8.5);
        setTextRGB(pdf, COLOR_FAINT);
        pdf.text(dates, MARGIN_X + CONTENT_W, y, { align: "right" });
      }
      y += 4.5;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      setTextRGB(pdf, COLOR_MUTED);
      pdf.text(e.company || "Company", MARGIN_X, y);
      y += 4;

      if (e.description?.trim()) {
        pdf.setFontSize(9.5);
        setTextRGB(pdf, COLOR_MUTED);
        y = drawWrappedText(pdf, e.description, MARGIN_X, y + 0.5, CONTENT_W, 4.2);
      }
      y += 3;
    }
    y += 2;
  }

  // ── Education ────────────────────────────────────────────────────────────
  const edu = data.education.filter(e => e.degree || e.institution);
  if (edu.length > 0) {
    y = ensureSpace(pdf, y, 18);
    y = drawSectionTitle(pdf, y, "Education");
    for (const e of edu) {
      y = ensureSpace(pdf, y, 10);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      setTextRGB(pdf, COLOR_INK);
      pdf.text(e.degree || "Degree", MARGIN_X, y);

      if (e.year) {
        pdf.setFont("courier", "normal");
        pdf.setFontSize(8.5);
        setTextRGB(pdf, COLOR_FAINT);
        pdf.text(e.year, MARGIN_X + CONTENT_W, y, { align: "right" });
      }
      y += 4.5;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      setTextRGB(pdf, COLOR_MUTED);
      pdf.text(e.institution || "Institution", MARGIN_X, y);
      y += 6;
    }
  }

  // ── Skills (as pill chips) ───────────────────────────────────────────────
  if (data.skills.length > 0) {
    y = ensureSpace(pdf, y, 16);
    y = drawSectionTitle(pdf, y, "Skills");

    pdf.setFont("courier", "normal");
    pdf.setFontSize(8.5);
    const padX = 3;
    const padY = 1.6;
    const gap = 2;
    let cursorX = MARGIN_X;
    let rowH = 5.8;

    for (const skill of data.skills) {
      const text = String(skill);
      const w = pdf.getTextWidth(text) + padX * 2;
      if (cursorX + w > MARGIN_X + CONTENT_W) {
        cursorX = MARGIN_X;
        y += rowH + 2;
        y = ensureSpace(pdf, y, rowH);
      }
      // Pill background + border
      setFillRGB(pdf, COLOR_TAG_BG);
      setDrawRGB(pdf, COLOR_RULE);
      pdf.setLineWidth(0.15);
      pdf.roundedRect(cursorX, y - 4, w, rowH, 1.2, 1.2, "FD");
      setTextRGB(pdf, COLOR_MUTED);
      pdf.text(text, cursorX + padX, y - 0.2);
      cursorX += w + gap;
    }
    y += rowH + 4;
  }

  // ── Contact ──────────────────────────────────────────────────────────────
  const contactBits: string[] = [];
  if (data.contact.email) contactBits.push(`Email: ${data.contact.email}`);
  if (data.contact.phone) contactBits.push(`Phone: ${data.contact.phone}`);
  if (data.contact.website) contactBits.push(`Web: ${data.contact.website}`);
  if (data.contact.linkedin) contactBits.push(`LinkedIn: ${data.contact.linkedin}`);
  if (contactBits.length > 0) {
    y = ensureSpace(pdf, y, 14);
    y = drawSectionTitle(pdf, y, "Contact");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    setTextRGB(pdf, COLOR_MUTED);
    for (const line of contactBits) {
      y = ensureSpace(pdf, y, 5);
      pdf.text(line, MARGIN_X, y);
      y += 5;
    }
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  pdf.setFont("courier", "normal");
  pdf.setFontSize(7.5);
  setTextRGB(pdf, [184, 184, 184]);
  pdf.text("GENERATED WITH ATADA", PAGE_W / 2, PAGE_H - 10, { align: "center" });

  pdf.save(fileName);
}
