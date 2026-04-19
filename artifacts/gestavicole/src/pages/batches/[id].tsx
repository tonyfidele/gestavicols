import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetBatch, useListDailyRecords, useCreateDailyRecord, useListVeterinaryRecords, useCreateVeterinaryRecord } from "@workspace/api-client-react";
import { Loader2, ArrowLeft, Layers, Activity, Egg, Droplets, Thermometer, Plus, Syringe, Pill, Calendar } from "lucide-react";
import { Link, useParams } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/lib/auth-context";

function AddDailyRecordModal({ batchId, onClose, onSuccess }: { batchId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    mortality: 0,
    feedConsumption: 0,
    waterConsumption: 0,
    eggsCollected: undefined as number | undefined,
    averageWeight: undefined as number | undefined,
    temperature: undefined as number | undefined,
    notes: "",
  });
  const { mutate: createRecord, isPending } = useCreateDailyRecord();
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRecord(
      {
        batchId,
        data: {
          date: form.date,
          mortality: form.mortality,
          feedConsumption: form.feedConsumption,
          waterConsumption: form.waterConsumption,
          eggsCollected: form.eggsCollected,
          averageWeight: form.averageWeight,
          temperature: form.temperature,
          notes: form.notes || undefined,
          recordedBy: user!.id,
        },
      },
      {
        onSuccess: () => { toast.success("Relevé journalier enregistré"); onSuccess(); onClose(); },
        onError: () => toast.error("Erreur lors de l'enregistrement"),
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Relevé Journalier</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
            <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mortalité</label>
              <input type="number" min="0" value={form.mortality} onChange={(e) => setForm({ ...form, mortality: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Température (°C)</label>
              <input type="number" step="0.1" value={form.temperature ?? ""} onChange={(e) => setForm({ ...form, temperature: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="ex: 25.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Aliment consommé (kg)</label>
              <input type="number" min="0" step="0.1" value={form.feedConsumption} onChange={(e) => setForm({ ...form, feedConsumption: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Eau consommée (L)</label>
              <input type="number" min="0" step="0.1" value={form.waterConsumption} onChange={(e) => setForm({ ...form, waterConsumption: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Œufs collectés</label>
              <input type="number" min="0" value={form.eggsCollected ?? ""} onChange={(e) => setForm({ ...form, eggsCollected: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Pour pondeuses" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Poids moyen (kg)</label>
              <input type="number" min="0" step="0.01" value={form.averageWeight ?? ""} onChange={(e) => setForm({ ...form, averageWeight: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Pour chair" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Observations..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Annuler</button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50">
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>();
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"daily" | "vet">("daily");

  const { data: batchData, isLoading: batchLoading } = useGetBatch({ batchId: id ?? "" });
  const { data: dailyRecords, refetch: refetchDaily, isLoading: dailyLoading } = useListDailyRecords({ batchId: id ?? "" }, { limit: 30 });
  const { data: vetRecords, refetch: refetchVet, isLoading: vetLoading } = useListVeterinaryRecords({ batchId: id ?? "" });

  const batch = batchData;

  const chartData = (dailyRecords?.data ?? []).slice().reverse().map((r) => ({
    date: format(new Date(r.date), "dd/MM"),
    mortalité: r.mortality,
    aliment: r.feedConsumption,
    œufs: r.eggsCollected ?? 0,
    temp: r.temperature ?? 0,
  }));

  if (batchLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  if (!batch) {
    return (
      <AppLayout>
        <div className="text-center py-24">
          <p className="text-slate-500">Bande introuvable</p>
          <Link href="/batches" className="text-primary hover:underline text-sm mt-2 inline-block">← Retour aux lots</Link>
        </div>
      </AppLayout>
    );
  }

  const statusColor = batch.status === "ACTIF" ? "bg-emerald-100 text-emerald-700" : batch.status === "TERMINE" ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-700";

  return (
    <AppLayout>
      <div className="mb-6">
        <Link href="/batches" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour aux lots
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Layers className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900">{batch.name}</h1>
              <p className="text-slate-500">{batch.farmName} · {batch.species}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>{batch.status}</span>
          </div>
          {batch.status === "ACTIF" && (
            <button
              onClick={() => setIsDailyModalOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all"
            >
              <Plus className="w-5 h-5" /> Relevé du jour
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Effectif actuel</p>
          <p className="text-2xl font-bold text-slate-900">{batch.currentCount.toLocaleString()}</p>
          <p className="text-xs text-slate-400">sur {batch.initialCount.toLocaleString()} initiaux</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Taux mortalité</p>
          <p className={`text-2xl font-bold ${batch.mortalityRate > 5 ? "text-red-600" : "text-emerald-600"}`}>{batch.mortalityRate}%</p>
          <p className="text-xs text-slate-400">{batch.mortalityRate > 5 ? "⚠ Élevé" : "✓ Normal"}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Relevés journaliers</p>
          <p className="text-2xl font-bold text-slate-900">{dailyRecords?.total ?? 0}</p>
          <p className="text-xs text-slate-400">enregistrements</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Suivi vétérinaire</p>
          <p className="text-2xl font-bold text-slate-900">{vetRecords?.total ?? 0}</p>
          <p className="text-xs text-slate-400">interventions</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Évolution mortalité (30 derniers jours)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip />
              <Line type="monotone" dataKey="mortalité" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("daily")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "daily" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Relevés journaliers ({dailyRecords?.total ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("vet")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "vet" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Suivi vétérinaire ({vetRecords?.total ?? 0})
        </button>
      </div>

      {activeTab === "daily" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {dailyLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : dailyRecords?.data.length === 0 ? (
            <div className="py-12 text-center">
              <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Aucun relevé journalier</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Mortalité</th>
                    <th className="px-5 py-3 font-semibold">Aliment (kg)</th>
                    <th className="px-5 py-3 font-semibold">Eau (L)</th>
                    <th className="px-5 py-3 font-semibold">Œufs</th>
                    <th className="px-5 py-3 font-semibold">Poids moy.</th>
                    <th className="px-5 py-3 font-semibold">Temp. (°C)</th>
                    <th className="px-5 py-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyRecords?.data.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 text-sm">
                      <td className="px-5 py-3 font-medium text-slate-900">{format(new Date(r.date), "dd MMM yyyy", { locale: fr })}</td>
                      <td className="px-5 py-3">
                        <span className={`font-bold ${r.mortality > 0 ? "text-red-600" : "text-slate-400"}`}>{r.mortality}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{r.feedConsumption} kg</td>
                      <td className="px-5 py-3 text-slate-600">{r.waterConsumption} L</td>
                      <td className="px-5 py-3 text-slate-600">{r.eggsCollected ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-600">{r.averageWeight ? `${r.averageWeight} kg` : "—"}</td>
                      <td className="px-5 py-3 text-slate-600">{r.temperature ? `${r.temperature}°C` : "—"}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs max-w-xs truncate">{r.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "vet" && (
        <div className="space-y-3">
          {vetLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : vetRecords?.data.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
              <Syringe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Aucun enregistrement vétérinaire</p>
            </div>
          ) : (
            vetRecords?.data.map((record) => (
              <div key={record.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {record.type === "VACCIN" ? <Syringe className="w-5 h-5 text-blue-500 mt-0.5" /> : <Pill className="w-5 h-5 text-orange-500 mt-0.5" />}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${record.type === "VACCIN" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>{record.type}</span>
                        <span className="text-xs text-slate-400">{format(new Date(record.date), "dd MMM yyyy", { locale: fr })}</span>
                      </div>
                      <p className="font-semibold text-slate-900">{record.description}</p>
                      {record.medication && <p className="text-sm text-slate-500 mt-0.5">{record.medication} {record.dosage && `— ${record.dosage}`}</p>}
                      <p className="text-sm text-slate-400 mt-1">Dr. {record.veterinarianName}</p>
                    </div>
                  </div>
                  {record.nextVisit && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                      <Calendar className="w-3 h-3" /> Rappel: {format(new Date(record.nextVisit), "dd/MM/yyyy")}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isDailyModalOpen && <AddDailyRecordModal batchId={id ?? ""} onClose={() => setIsDailyModalOpen(false)} onSuccess={refetchDaily} />}
    </AppLayout>
  );
}
