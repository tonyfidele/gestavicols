import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  doc.text(title, 14, 27);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, 14, 34);
  doc.text(
    `Généré le ${format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}`,
    doc.internal.pageSize.width - 14,
    34,
    { align: "right" }
  );

  autoTable(doc, {
    startY: 40,
    head: [columns.map((c) => c.header)],
    body: data.map((row) =>
      columns.map((c) => String(row[c.key] ?? ""))
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
