import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetAnalytics } from "@workspace/api-client-react";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Loader2, BarChart3, Egg, Beef } from "lucide-react";
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

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Analytics & Rapports</h1>
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
                <h2 className="text-lg font-bold text-slate-900 mb-4">Performance par Ferme</h2>
                <div className="space-y-3">
                  {data.farmPerformance.map((farm, i) => (
                    <div key={farm.farmId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{farm.farmName}</p>
                          <p className="text-xs text-slate-500">{farm.activeBatches} lots actifs · {farm.totalAnimals.toLocaleString()} animaux</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${farm.avgMortality > 5 ? "text-red-600" : "text-emerald-600"}`}>
                          {farm.avgMortality.toFixed(1)}% mortalité
                        </span>
                      </div>
                    </div>
                  ))}
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
