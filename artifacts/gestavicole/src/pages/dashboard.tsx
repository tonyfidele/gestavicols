import React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Tractor, Layers, Target, DollarSign, Activity, AlertTriangle } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  const kpis = [
    { label: "Fermes Actives", value: stats?.totalFarms || 0, icon: Tractor, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Lots en cours", value: stats?.activeBatches || 0, icon: Layers, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Total Animaux", value: stats?.totalAnimals || 0, icon: Target, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Alertes Stock", value: stats?.lowStockAlerts || 0, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  const financials = [
    { name: 'Revenus', amount: stats?.monthlyRevenue || 0, fill: '#10b981' },
    { name: 'Dépenses', amount: stats?.monthlyExpenses || 0, fill: '#ef4444' },
    { name: 'Profit Net', amount: stats?.netProfit || 0, fill: '#3b82f6' },
  ];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900">Vue d'ensemble</h1>
        <p className="text-slate-500 mt-1">Gérez et surveillez vos indicateurs de performance clés.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{kpi.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Financial Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" /> Finances du mois
            </h2>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financials} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `€${val}`} />
                <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance by batch */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" /> Taux de mortalité
            </h2>
          </div>
          <div className="space-y-4">
            {stats?.batchPerformance?.map((batch) => (
              <div key={batch.batchId} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-800">{batch.batchName}</span>
                  <span className={`text-sm font-bold ${batch.mortalityRate > 5 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {batch.mortalityRate}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${batch.mortalityRate > 5 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min(batch.mortalityRate * 5, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">{batch.farmName} • {batch.currentCount} animaux</p>
              </div>
            ))}
            {(!stats?.batchPerformance || stats.batchPerformance.length === 0) && (
              <p className="text-sm text-slate-500 text-center py-8">Aucune donnée de performance</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
