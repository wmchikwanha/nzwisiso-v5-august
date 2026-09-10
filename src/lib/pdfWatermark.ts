import type jsPDF from "jspdf";
import { PILOT_WATERMARK } from "@/lib/copy";
import { isPilotModeSync } from "@/hooks/usePilotConfig";

/**
 * Stamps the pilot watermark at the top and bottom of every page.
 * Call immediately before doc.save(). No-op when pilot mode is off.
 */
export const applyPilotWatermark = (doc: jsPDF): void => {
  if (!isPilotModeSync()) return;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();

  for (let page = 1; page <= total; page++) {
    doc.setPage(page);

    // Top strip
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, pageWidth, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(PILOT_WATERMARK, pageWidth / 2, 4.8, { align: "center" });

    // Bottom line
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(7);
    doc.text(PILOT_WATERMARK, pageWidth / 2, pageHeight - 5, { align: "center" });
  }

  doc.setPage(total);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
};
