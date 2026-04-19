import React, { useState, useRef, useEffect } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

interface ExportMenuProps {
  onExcel: () => void;
  onPdf: () => void;
  disabled?: boolean;
}

export function ExportMenu({ onExcel, onPdf, disabled }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 shadow-sm"
      >
        <Download className="w-4 h-4" />
        Exporter
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
          <button
            onClick={() => { onExcel(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Fichier Excel (.xlsx)
          </button>
          <div className="border-t border-slate-100" />
          <button
            onClick={() => { onPdf(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <FileText className="w-4 h-4 text-red-500" />
            Fichier PDF (.pdf)
          </button>
        </div>
      )}
    </div>
  );
}
