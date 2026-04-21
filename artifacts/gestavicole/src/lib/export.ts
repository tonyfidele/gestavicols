import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface PaySlipData {
  userName: string;
  userRole: string;
  month: number;
  year: number;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  paymentStatus: string;
  paymentDate?: string | null;
  notes?: string | null;
}

const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function fmt(n: number): string {
  return Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
}

export function downloadPaySlip(salary: PaySlipData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.width;
  const green: [number, number, number] = [16, 185, 129];
  const dark: [number, number, number] = [15, 23, 42];
  const gray: [number, number, number] = [100, 116, 139];
  const lightGray: [number, number, number] = [248, 250, 252];

  // ── Header band ──────────────────────────────────────────────
  doc.setFillColor(...green);
  doc.rect(0, 0, W, 28, "F");

  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("GESTAVICOLE", 14, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Gestion avicole - Plateforme de gestion de ferme", 14, 19);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("BULLETIN DE PAIE", W - 14, 12, { align: "right" });

  const period = `${MONTHS_FR[(salary.month ?? 1) - 1]} ${salary.year}`;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(pdfSafe(period), W - 14, 19, { align: "right" });

  // ── Employee info block ───────────────────────────────────────
  doc.setFillColor(...lightGray);
  doc.roundedRect(14, 34, W - 28, 24, 3, 3, "F");

  doc.setFontSize(13);
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.text(pdfSafe(salary.userName || "—"), 20, 44);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text(pdfSafe(salary.userRole || "—"), 20, 51);

  // Status pill (right side)
  const statusLabel = salary.paymentStatus === "PAYE" ? "PAYE" : salary.paymentStatus === "EN_ATTENTE" ? "EN ATTENTE" : "ANNULE";
  const statusColor: [number, number, number] = salary.paymentStatus === "PAYE" ? [16, 185, 129] : salary.paymentStatus === "EN_ATTENTE" ? [245, 158, 11] : [239, 68, 68];
  doc.setFillColor(...statusColor);
  const pillW = 36;
  doc.roundedRect(W - 14 - pillW, 37, pillW, 8, 2, 2, "F");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(statusLabel, W - 14 - pillW / 2, 42.5, { align: "center" });

  if (salary.paymentDate) {
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.setFont("helvetica", "normal");
    const dateStr = `Paye le ${format(new Date(salary.paymentDate), "d MMM yyyy", { locale: fr })}`;
    doc.text(pdfSafe(dateStr), W - 14 - pillW / 2, 51, { align: "center" });
  }

  // ── Earnings / Deductions table ───────────────────────────────
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.text("Detail de la remuneration", 14, 68);

  autoTable(doc, {
    startY: 72,
    margin: { left: 14, right: 14 },
    head: [["Libelle", "Montant"]],
    body: [
      ["Salaire de base", fmt(salary.baseSalary)],
      ["Primes / Indemnites", fmt(salary.bonuses)],
      ["Retenues / Deductions", `- ${fmt(salary.deductions)}`],
    ],
    styles: { fontSize: 10, cellPadding: 5, lineColor: [226, 232, 240], lineWidth: 0.1 },
    headStyles: { fillColor: green, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { halign: "left" }, 1: { halign: "right" } },
  });

  const afterTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  // ── Net salary highlight ──────────────────────────────────────
  doc.setFillColor(...green);
  doc.roundedRect(14, afterTable + 6, W - 28, 18, 3, 3, "F");

  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("NET A PAYER", 22, afterTable + 17);

  doc.setFontSize(14);
  doc.text(pdfSafe(fmt(salary.netSalary)), W - 22, afterTable + 17, { align: "right" });

  // ── Notes ─────────────────────────────────────────────────────
  if (salary.notes) {
    const notesY = afterTable + 32;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dark);
    doc.text("Observations :", 14, notesY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gray);
    doc.text(pdfSafe(salary.notes), 14, notesY + 6, { maxWidth: W - 28 });
  }

  // ── Footer ────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.height - 14;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(14, footerY - 4, W - 14, footerY - 4);
  doc.setFontSize(7);
  doc.setTextColor(...gray);
  doc.setFont("helvetica", "normal");
  doc.text(`GESTAVICOLE - Document genere le ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, footerY);
  doc.text("Document confidentiel - Usage interne uniquement", W - 14, footerY, { align: "right" });

  const safeMonth = String(salary.month).padStart(2, "0");
  doc.save(`bulletin_paie_${(salary.userName || "employe").replace(/\s+/g, "_")}_${salary.year}_${safeMonth}.pdf`);
}

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export function exportToExcel(
  filename: string,
  sheetName: string,
  columns: ExportColumn[],
  data: Record<string, unknown>[]
) {
  const headers = columns.map((c) => c.header);
  const rows = data.map((row) => columns.map((c) => row[c.key] ?? ""));

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = columns.map((c) => ({ wch: c.width ?? 20 }));

  const headerRange = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "10B981" } },
      alignment: { horizontal: "center" },
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
}

// Strip non-breaking spaces (U+00A0, U+202F) that jsPDF cannot render
// with its default Helvetica font, replacing them with regular spaces.
function pdfSafe(text: string): string {
  return text.replace(/[\u00A0\u202F]/g, " ");
}

// Format a number with plain spaces as thousands separator (safe for jsPDF)
function fmtNum(n: number): string {
  return Math.round(Number(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function exportToPDF(
  filename: string,
  title: string,
  subtitle: string,
  columns: ExportColumn[],
  data: Record<string, unknown>[]
) {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text("GESTAVICOLE", 14, 18);

  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129);
  doc.text(pdfSafe(title), 14, 27);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(pdfSafe(subtitle), 14, 34);
  doc.text(
    `Genere le ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
    doc.internal.pageSize.width - 14,
    34,
    { align: "right" }
  );

  autoTable(doc, {
    startY: 40,
    head: [columns.map((c) => c.header)],
    body: data.map((row) =>
      columns.map((c) => {
        const val = row[c.key];
        if (val === null || val === undefined) return "";
        if (typeof val === "number") return fmtNum(val);
        return pdfSafe(String(val));
      })
    ),
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: Object.fromEntries(
      columns.map((_, i) => [i, { halign: "left" }])
    ),
    margin: { left: 14, right: 14 },
  });

  const pageCount = (doc.internal as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} / ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 8,
      { align: "center" }
    );
  }

  doc.save(`${filename}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
