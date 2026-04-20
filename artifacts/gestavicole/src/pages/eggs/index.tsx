import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  useListEggProductions,
  useCreateEggProduction,
  useUpdateEggProduction,
  useDeleteEggProduction,
  useListBatches,
  useListFarms,
} from "@workspace/api-client-react";
import { Plus, Egg, Loader2, Pencil, Trash2, Calculator } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

type EggRecord = {
  id: string;
  batchId: string;
  farmId: string;
  date: string;
  eggsCollected: number;
  brokenEggs: number;
  soldEggs: number;
  stockEggs: number;
  cratesCount: number;
  unitPrice: number;
  caisseAmount: number;
  notes?: string;
};

const EMPTY_FORM = {
  batchId: "",
  farmId: "",
  date: format(new Date(), "yyyy-MM-dd"),
  eggsCollected: "",
  brokenEggs: "0",
  soldEggs: "0",
  cratesCount: "",
  unitPrice: "",
  notes: "",
};

const fmtFcfa = (n: number) =>
  n.toLocaleString("fr-ML", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " FCFA";

export default function Eggs() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EggRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: eggsData, isLoading, refetch } = useListEggProductions({ limit: 100 });
  const deleteMutation = useDeleteEggProduction();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({ eggId: deleteTarget });
      toast.success("Enregistrement supprimé");
      refetch();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteTarget(null);
    }
  };

  const stats = useMemo(() => {
    const records = eggsData?.data ?? [];
    const totalCollected = records.reduce((s, r) => s + r.eggsCollected, 0);
    const totalBroken = records.reduce((s, r) => s + r.brokenEggs, 0);
    const totalNet = totalCollected - totalBroken;
    const totalSold = records.reduce((s, r) => s + r.soldEggs, 0);
    const totalStock = records.reduce((s, r) => s + r.stockEggs, 0);
    const totalCaisse = records.reduce((s, r) => s + r.caisseAmount, 0);
    return { totalCollected, totalBroken, totalNet, totalSold, totalStock, totalCaisse };
  }, [eggsData]);

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Production d'Œufs</h1>
          <p className="text-slate-500 mt-1">Suivi journalier de la collecte d'œufs</p>
        </div>
        <button
          onClick={() => { setEditRecord(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Enregistrer collecte
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Collectés</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalCollected.toLocaleString("fr-ML")}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cassés</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.totalBroken.toLocaleString("fr-ML")}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nets</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.totalNet.toLocaleString("fr-ML")}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Vendus</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalSold.toLocaleString("fr-ML")}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">En stock</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{stats.totalStock.toLocaleString("fr-ML")}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Caisse totale</p>
          <p className="text-xl font-bold text-purple-700 mt-1">{fmtFcfa(stats.totalCaisse)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Collectés</th>
                  <th className="px-5 py-4 font-semibold text-red-500">Cassés</th>
                  <th className="px-5 py-4 font-semibold text-emerald-600">Nets</th>
                  <th className="px-5 py-4 font-semibold text-blue-600">Vendus</th>
                  <th className="px-5 py-4 font-semibold text-amber-600">Stock</th>
                  <th className="px-5 py-4 font-semibold">Caisses</th>
                  <th className="px-5 py-4 font-semibold text-purple-600">Montant caisse</th>
                  <th className="px-5 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eggsData?.data.map((record) => {
                  const net = record.eggsCollected - record.brokenEggs;
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {format(new Date(record.date), "dd MMM yyyy", { locale: fr })}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{record.eggsCollected.toLocaleString()}</td>
                      <td className="px-5 py-4 text-red-600">{record.brokenEggs > 0 ? record.brokenEggs.toLocaleString() : "—"}</td>
                      <td className="px-5 py-4 font-semibold text-emerald-700">{net.toLocaleString()}</td>
                      <td className="px-5 py-4 text-blue-700">{record.soldEggs > 0 ? record.soldEggs.toLocaleString() : "—"}</td>
                      <td className="px-5 py-4 text-amber-700">{record.stockEggs.toLocaleString()}</td>
                      <td className="px-5 py-4 text-slate-600">{record.cratesCount > 0 ? record.cratesCount : "—"}</td>
                      <td className="px-5 py-4 font-semibold text-purple-700">
                        {record.caisseAmount > 0 ? fmtFcfa(record.caisseAmount) : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditRecord(record as EggRecord); setIsModalOpen(true); }}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(record.id)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {(!eggsData?.data || eggsData.data.length === 0) && (
            <div className="py-16 text-center">
              <Egg className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Aucune collecte enregistrée</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <EggModal
          record={editRecord}
          onClose={() => { setIsModalOpen(false); setEditRecord(null); }}
          onSuccess={refetch}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmer la suppression</h3>
            <p className="text-slate-600 mb-6">Voulez-vous vraiment supprimer cet enregistrement ?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium">Annuler</button>
              <button onClick={handleDelete} disabled={deleteMutation.isPending} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50">
                {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function EggModal({ record, onClose, onSuccess }: { record: EggRecord | null; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!record;
  const [form, setForm] = useState(
    record
      ? {
          batchId: record.batchId,
          farmId: record.farmId,
          date: record.date.split("T")[0],
          eggsCollected: String(record.eggsCollected),
          brokenEggs: String(record.brokenEggs),
          soldEggs: String(record.soldEggs),
          cratesCount: String(record.cratesCount),
          unitPrice: String(record.unitPrice ?? ""),
          notes: record.notes || "",
        }
      : { ...EMPTY_FORM }
  );

  const createMutation = useCreateEggProduction();
  const updateMutation = useUpdateEggProduction();
  const { data: batchesData } = useListBatches({ status: "ACTIF", limit: 100 });
  const { data: farmsData } = useListFarms({ limit: 100 });

  const eggsCollected = parseInt(form.eggsCollected, 10) || 0;
  const brokenEggs = parseInt(form.brokenEggs, 10) || 0;
  const soldEggs = parseInt(form.soldEggs, 10) || 0;
  const unitPrice = parseFloat(form.unitPrice) || 0;

  const netEggs = Math.max(0, eggsCollected - brokenEggs);
  const stockEggs = Math.max(0, netEggs - soldEggs);
  const caisseAmount = unitPrice * soldEggs;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      batchId: form.batchId,
      farmId: form.farmId,
      date: form.date,
      eggsCollected,
      brokenEggs,
      soldEggs,
      stockEggs,
      cratesCount: parseFloat(form.cratesCount) || 0,
      unitPrice,
      caisseAmount,
      notes: form.notes || undefined,
    };
    try {
      if (isEdit && record) {
        await updateMutation.mutateAsync({ eggId: record.id, data: payload });
        toast.success("Enregistrement mis à jour");
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast.success("Collecte enregistrée");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Modifier la collecte" : "Enregistrer une collecte"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ferme *</label>
              <select required value={form.farmId} onChange={e => setForm({ ...form, farmId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                <option value="">Sélectionner</option>
                {farmsData?.data.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lot *</label>
              <select required value={form.batchId} onChange={e => setForm({ ...form, batchId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                <option value="">Sélectionner</option>
                {batchesData?.data.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
            <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Œufs collectés *</label>
              <input required type="number" min="0" value={form.eggsCollected} onChange={e => setForm({ ...form, eggsCollected: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Œufs cassés</label>
              <input type="number" min="0" value={form.brokenEggs} onChange={e => setForm({ ...form, brokenEggs: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <Calculator className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-800">Œufs nets (collectés − cassés)</span>
              <span className="text-lg font-bold text-emerald-700">{netEggs.toLocaleString("fr-ML")}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Œufs vendus</label>
              <input type="number" min="0" max={netEggs} value={form.soldEggs} onChange={e => setForm({ ...form, soldEggs: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prix unitaire (FCFA/œuf)</label>
              <input type="number" min="0" step="1" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-col gap-0.5">
              <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">Œufs en stock</span>
              <span className="text-xl font-bold text-amber-800">{stockEggs.toLocaleString("fr-ML")}</span>
              <span className="text-xs text-amber-600">nets − vendus</span>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex flex-col gap-0.5">
              <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">Montant caisse</span>
              <span className="text-xl font-bold text-purple-800">
                {caisseAmount > 0 ? caisseAmount.toLocaleString("fr-ML") : "0"} FCFA
              </span>
              <span className="text-xs text-purple-600">prix × vendus</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de caisses physiques</label>
            <input type="number" min="0" step="0.5" value={form.cratesCount} onChange={e => setForm({ ...form, cratesCount: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optionnel)</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">Annuler</button>
            <button type="submit" disabled={isPending} className="px-6 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-white font-medium shadow-md shadow-primary/20 disabled:opacity-50">
              {isPending ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
