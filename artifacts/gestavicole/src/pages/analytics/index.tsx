import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetAnalytics } from "@workspace/api-client-react";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Loader2, BarChart3, Egg, Beef, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";

const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

const CATEGORY_LABELS: Record<string, string> = {
  ALIMENT: "Alimentation",
  SALAIRE: "Salaires",
  VETERINAIRE: "Vétérinaire",
  MAINTENANCE: "Maintenance",
  TRANSPORT: "Transport",
  AUTRE: "Autre",
};

function KPICard({ title, value, sub, icon: Icon, color, trend }: {
  title: string; value: string; sub?: string; icon: React.ElementType; color: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-medium flex items-center gap-1 ${trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-slate-400"}`}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-500">{title}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function Analytics() {
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);

  const { data, isLoading } = useGetAnalytics({ startDate, endDate });

  const formatCurrency = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M FCFA`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K FCFA`;
    return `${v.toLocaleString("fr-ML")} FCFA`;
  };

  const mergedMonthlyData = React.useMemo(() => {
    if (!data) return [];
    const months = new Set([...(data.monthlySales ?? []).map(m => m.month)]);
    return Array.from(months).sort().map((month) => {
      const sale = data.monthlySales?.find(m => m.month === month);
      const expense = data.monthlyExpenses
        ?.filter(m => m.month === month)
        .reduce((s, m) => s + m.amount, 0) ?? 0;
      return {
        month: month.slice(5),
        revenus: sale?.revenue ?? 0,
        depenses: expense,
        benefice: (sale?.revenue ?? 0) - expense,
      };
    });
  }, [data]);

  const expensePieData = React.useMemo(() => {
    if (!data?.expensesByCategory) return [];
    return data.expensesByCategory.map(e => ({
      name: CATEGORY_LABELS[e.category] ?? e.category,
      value: e.total,
    }));
  }, [data]);

  const handleExportPdf = () => {
    if (!data) return;

    // Safe number formatter — avoids non-breaking spaces from fr-ML locale
    // which jsPDF cannot render with the default Helvetica font.
    const fmtNum = (n: number) =>
      Math.round(n)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const fmtFcfa = (n: number) => `${fmtNum(n)} FCFA`;
    const fmtPct = (n: number) => `${Number(n).toFixed(2)}%`;

    const doc = new jsPDF({ orientation: "portrait" });
    const pageW = doc.internal.pageSize.width;
    const dateRange = `${format(new Date(startDate), "dd/MM/yyyy")} - ${format(new Date(endDate), "dd/MM/yyyy")}`;
    const generatedAt = format(new Date(), "dd/MM/yyyy HH:mm");

    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageW, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("GESTAVICOLE", 14, 18);
    doc.setFontSize(13);
    doc.text("Rapport Analytics", 14, 28);
    doc.setFontSize(9);
    doc.text(`Periode : ${dateRange}`, 14, 36);
    doc.text(`Genere le ${generatedAt}`, pageW - 14, 36, { align: "right" });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.text("Indicateurs Cles de Performance", 14, 52);

    autoTable(doc, {
      startY: 56,
      head: [["Indicateur", "Valeur"]],
      body: [
        ["Revenus Totaux", fmtFcfa(data.summary.totalRevenue)],
        ["Depenses Totales", fmtFcfa(data.summary.totalExpenses)],
        ["Benefice Net", fmtFcfa(data.summary.netProfit)],
        ["ROI", fmtPct(data.summary.roi)],
        ["Transactions", String(data.summary.totalTransactions)],
        ["Mortalite totale", `${fmtNum(data.summary.totalMortality)} animaux`],
        ["Aliment consomme", `${fmtNum(data.summary.totalFeedConsumed ?? 0)} kg`],
        ["Oeufs collectes", fmtNum(data.summary.totalEggsCollected ?? 0)],
      ],
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 }, 1: { halign: "right" } },
      margin: { left: 14, right: 14 },
    });

    const afterKpi = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    if (mergedMonthlyData.length > 0) {
      doc.setFontSize(13);
      doc.text("Evolution Mensuelle", 14, afterKpi);
      autoTable(doc, {
        startY: afterKpi + 4,
        head: [["Mois", "Revenus (FCFA)", "Depenses (FCFA)", "Benefice (FCFA)"]],
        body: mergedMonthlyData.map(m => [
          m.month,
          fmtNum(m.revenus),
          fmtNum(m.depenses),
          fmtNum(m.benefice),
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });
    }

    const afterMonthly = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    if (expensePieData.length > 0) {
      if (afterMonthly > 220) doc.addPage();
      const startY = afterMonthly > 220 ? 20 : afterMonthly;
      doc.setFontSize(13);
      doc.text("Repartition des Depenses par Categorie", 14, startY);
      autoTable(doc, {
        startY: startY + 4,
        head: [["Categorie", "Montant (FCFA)", "Part (%)"]],
        body: expensePieData.map(e => [
          e.name,
          fmtNum(e.value),
          data.summary.totalExpenses > 0
            ? fmtPct((e.value / data.summary.totalExpenses) * 100)
            : "0.0%",
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });
    }

    if (data.farmPerformance.length > 0) {
      const afterExp = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      if (afterExp > 220) doc.addPage();
      const startY2 = afterExp > 220 ? 20 : afterExp;
      doc.setFontSize(13);
      doc.text("Performance par Ferme", 14, startY2);
      autoTable(doc, {
        startY: startY2 + 4,
        head: [["Ferme", "Lots actifs", "Animaux", "Mortalite moy."]],
        body: data.farmPerformance.map(f => [
          f.farmName,
          String(f.activeBatches),
          fmtNum(f.totalAnimals),
          fmtPct(f.avgMortality),
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "center" } },
        margin: { left: 14, right: 14 },
      });
    }

    const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} / ${pageCount}`, pageW / 2, doc.internal.pageSize.height - 8, { align: "center" });
    }

    doc.save(`rapport_analytics_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-display font-bold text-slate-900">Analytics & Rapports</h1>
          <p className="text-slate-500 mt-1">Tableau de bord analytique de votre exploitation</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-slate-400">→</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleExportPdf}
            disabled={isLoading || !data}
            className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-700 px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-40 shadow-sm text-sm"
          >
            <FileText className="w-4 h-4 text-red-500" />
            Télécharger PDF
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : data ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Revenus Totaux"
              value={formatCurrency(data.summary.totalRevenue)}
              icon={DollarSign}
              color="bg-emerald-100 text-emerald-600"
              trend="up"
            />
            <KPICard
              title="Dépenses Totales"
              value={formatCurrency(data.summary.totalExpenses)}
              icon={TrendingDown}
              color="bg-red-100 text-red-500"
              trend="down"
            />
            <KPICard
              title="Bénéfice Net"
              value={formatCurrency(data.summary.netProfit)}
              sub={`ROI: ${data.summary.roi}%`}
              icon={TrendingUp}
              color={data.summary.netProfit >= 0 ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-500"}
            />
            <KPICard
              title="Transactions"
              value={data.summary.totalTransactions.toString()}
              sub="Ventes réalisées"
              icon={BarChart3}
              color="bg-violet-100 text-violet-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-slate-700">Mortalité totale</span>
              </div>
              <p className="text-3xl font-bold text-red-600">{data.summary.totalMortality.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">Animaux sur la période</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Beef className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-slate-700">Aliment consommé</span>
              </div>
              <p className="text-3xl font-bold text-amber-600">{(data.summary.totalFeedConsumed ?? 0).toLocaleString()} kg</p>
              <p className="text-xs text-slate-400 mt-1">Consommation totale</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Egg className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-semibold text-slate-700">Œufs collectés</span>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{(data.summary.totalEggsCollected ?? 0).toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">Production totale</p>
            </div>
          </div>

          {mergedMonthlyData.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Revenus vs Dépenses (mensuel)</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mergedMonthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="revenus" name="Revenus" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="depenses" name="Dépenses" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {mergedMonthlyData.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Évolution du Bénéfice Net</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={mergedMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="benefice" name="Bénéfice" stroke="#3b82f6" fill="#dbeafe" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {expensePieData.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Répartition des Dépenses</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={expensePieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {expensePieData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {data.farmPerformance.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Revenus par Ferme</h2>
                <p className="text-xs text-slate-500 mb-4">Données pour la période sélectionnée · Les fermes désactivées conservent leurs historiques</p>
                <div className="space-y-4">
                  {data.farmPerformance
                    .slice()
                    .sort((a, b) => b.revenue - a.revenue)
                    .map((farm, i) => {
                      const profit = farm.netProfit;
                      const isProfit = profit >= 0;
                      return (
                        <div key={farm.farmId} className={`border rounded-xl p-4 ${farm.isActive === false ? "bg-slate-50 border-slate-200 opacity-75" : "bg-white border-slate-200"}`}>
                          {/* Header row */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                                {i + 1}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{farm.farmName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${farm.isActive === false ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}`}>
                                    {farm.isActive === false ? "Désactivée" : "Active"}
                                  </span>
                                  <span className="text-xs text-slate-500">{farm.activeBatches} lots · {farm.totalAnimals.toLocaleString()} animaux</span>
                                </div>
                              </div>
                            </div>
                            <div className={`text-right`}>
                              <p className={`text-sm font-bold ${isProfit ? "text-emerald-600" : "text-red-600"}`}>
                                {isProfit ? "+" : ""}{formatCurrency(profit)}
                              </p>
                              <p className="text-xs text-slate-500">Bénéfice net</p>
                            </div>
                          </div>
                          {/* Revenue / Expenses grid */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-emerald-50 rounded-lg px-3 py-2">
                              <p className="text-xs text-emerald-700 font-medium">Revenus</p>
                              <p className="font-bold text-emerald-700">{formatCurrency(farm.revenue)}</p>
                            </div>
                            <div className="bg-red-50 rounded-lg px-3 py-2">
                              <p className="text-xs text-red-700 font-medium">Dépenses</p>
                              <p className="font-bold text-red-700">{formatCurrency(farm.expenses)}</p>
                            </div>
                          </div>
                          {/* Mortality */}
                          {farm.avgMortality > 0 && (
                            <p className={`text-xs mt-2 font-medium ${farm.avgMortality > 5 ? "text-red-600" : "text-amber-600"}`}>
                              ⚠ Mortalité moy. {farm.avgMortality.toFixed(1)}%
                            </p>
                          )}
                        </div>
                      );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-24 text-slate-400">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>Aucune donnée disponible</p>
        </div>
      )}
    </AppLayout>
  );
}
