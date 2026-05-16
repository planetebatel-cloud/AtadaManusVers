// html2canvas-pro is a maintained fork that supports modern CSS color
// functions (oklch, color-mix, lab) — required because Tailwind 4 ships
// its default palette as oklch() and the original html2canvas crashes.
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

export async function generateResumePDF(
  previewElement: HTMLElement,
  fileName: string = "resume-atada.pdf"
): Promise<void> {
  await document.fonts.ready;

  const canvas = await html2canvas(previewElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#FFFFFF",
    logging: false,
  });

  // Draw watermark on canvas
  const ctx = canvas.getContext("2d")!;
  const watermarkCount = 5;
  const spacingY = canvas.height / (watermarkCount + 1);

  ctx.save();
  ctx.font = "bold 100px 'DM Sans', sans-serif";
  ctx.fillStyle = "rgba(0, 0, 0, 0.045)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 1; i <= watermarkCount; i++) {
    ctx.save();
    ctx.translate(canvas.width / 2, spacingY * i);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText("ATADA", 0, 0);
    ctx.restore();
  }

  ctx.restore();

  // Create PDF
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

  pdf.save(fileName);
}
