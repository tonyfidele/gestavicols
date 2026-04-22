import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  useListEggProductions,
  useCreateEggProduction,
  useUpdateEggProduction,
  useDeleteEggProduction,
  useCreateSale,
  useListBatches,
  useListFarms,
  useListCustomers,
} from "@workspace/api-client-react";
import {
  Plus, Egg, Loader2, Pencil, Trash2, Calculator,
  FileSpreadsheet, ShoppingCart, PackagePlus, TrendingDown, Package,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useAuth } from "@/lib/auth-context";

type EggRecord = {
  id: string;
  batchId: string;
  batchName?: string;
  farmId: string;
  farmName?: string;
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

function rowType(r: EggRecord): "production" | "vente_stock" | "appro" {
  if (r.notes?.startsWith("[VENTE STOCK]")) return "vente_stock";
  if (r.notes?.startsWith("[APPRO]")) return "appro";
  return "production";
}

export default function Eggs() {
  const [modalType, setModalType] = useState<null | "collecte" | "vente" | "appro">(null);
  const [editRecord, setEditRecord] = useState<EggRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { user } = useAuth();
  const canWrite = user?.permissions?.includes("BATCH:CREATE") ?? false;

  const { data: eggsData, isLoading, refetch } = useListEggProductions({ limit: 200 });
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

  const { stats, stockPerBatch } = useMemo(() => {
    const records = eggsData?.data ?? [];
    const totalCollected = records.reduce((s, r) => s + r.eggsCollected, 0);
    const totalBroken = records.reduce((s, r) => s + r.brokenEggs, 0);
    const totalNet = totalCollected - totalBroken;
    const totalSold = records.reduce((s, r) => s + r.soldEggs, 0);
    const totalCaisse = records.reduce((s, r) => s + (r.caisseAmount ?? 0), 0);

    const stockMap: Record<string, { batchName: string; farmName: string; stock: number }> = {};
    for (const r of records) {
      const bid = r.batchId;
      if (!stockMap[bid]) {
        stockMap[bid] = { batchName: (r as any).batchName ?? bid, farmName: (r as any).farmName ?? "—", stock: 0 };
      }
      stockMap[bid].stock += r.stockEggs;
    }
    const stockPerBatch = Object.entries(stockMap).map(([batchId, v]) => ({ batchId, ...v }));
    const totalStock = stockPerBatch.reduce((s, b) => s + Math.max(0, b.stock), 0);

    return {
      stats: { totalCollected, totalBroken, totalNet, totalSold, totalStock, totalCaisse },
      stockPerBatch,
    };
  }, [eggsData]);

  const exportToExcel = () => {
    const records = eggsData?.data ?? [];
    if (records.length === 0) { toast.info("Aucune donnée à exporter"); return; }
    const rows = records.map((r) => ({
      "Type": rowType(r as EggRecord) === "vente_stock" ? "Vente stock" : rowType(r as EggRecord) === "appro" ? "Approvisionnement" : "Production",
      "Date": format(new Date(r.date), "dd/MM/yyyy"),
      "Lot": (r as any).batchName ?? "",
      "Ferme": (r as any).farmName ?? "",
      "Collectés": r.eggsCollected,
      "Cassés": r.brokenEggs,
      "Nets": r.eggsCollected - r.brokenEggs,
      "Vendus": r.soldEggs,
      "Prix unitaire (FCFA)": r.unitPrice ?? 0,
      "Montant caisse (FCFA)": r.caisseAmount ?? 0,
      "En stock": r.stockEggs,
      "Caisses": r.cratesCount,
      "Notes": r.notes ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Production Oeufs");
    XLSX.writeFile(wb, `production-oeufs-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Export Excel téléchargé");
  };

  return (
    <AppLayout>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl lg:text-3xl font-display font-bold text-slate-900">Production d'Œufs</h1>
          <p className="text-slate-500 mt-1">Collecte, stock et vente d'œufs par lot</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportToExcel}
            disabled={isLoading || !eggsData?.data?.length}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          {canWrite && (
            <>
              <button
                onClick={() => setModalType("appro")}
                className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2.5 rounded-xl font-medium transition-all"
              >
                <PackagePlus className="w-4 h-4" /> Approvisionnement
              </button>
              <button
                onClick={() => setModalType("vente")}
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2.5 rounded-xl font-medium transition-all"
              >
                <ShoppingCart className="w-4 h-4" /> Vendre depuis stock
              </button>
              <button
                onClick={() => { setEditRecord(null); setModalType("collecte"); }}
                className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" /> Enregistrer collecte
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Collectés" value={stats.totalCollected.toLocaleString("fr-ML")} color="slate" />
        <StatCard label="Cassés" value={stats.totalBroken.toLocaleString("fr-ML")} color="red" />
        <StatCard label="Nets" value={stats.totalNet.toLocaleString("fr-ML")} color="emerald" />
        <StatCard label="Vendus" value={stats.totalSold.toLocaleString("fr-ML")} color="blue" />
        <StatCard label="En stock" value={stats.totalStock.toLocaleString("fr-ML")} color="amber" />
        <StatCard label="Caisse totale" value={fmtFcfa(stats.totalCaisse)} color="purple" small />
      </div>

      {/* Stock par lot */}
      {stockPerBatch.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" /> Stock actuel par lot
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stockPerBatch.map((b) => {
              const stock = Math.max(0, b.stock);
              const urgent = stock < 200;
              return (
                <div
                  key={b.batchId}
                  className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-3 ${urgent ? "border-orange-200" : "border-slate-200"}`}
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{b.batchName}</p>
                    <p className="text-xs text-slate-500 truncate">{b.farmName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-2xl font-bold tabular-nums ${urgent ? "text-orange-600" : "text-amber-700"}`}>
                      {stock.toLocaleString("fr-ML")}
                    </p>
                    <p className="text-xs text-slate-400">œufs</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-4 font-semibold">Type</th>
                  <th className="px-4 py-4 font-semibold">Date</th>
                  <th className="px-4 py-4 font-semibold">Lot</th>
                  <th className="px-4 py-4 font-semibold">Collectés</th>
                  <th className="px-4 py-4 font-semibold text-red-500">Cassés</th>
                  <th className="px-4 py-4 font-semibold text-emerald-600">Nets</th>
                  <th className="px-4 py-4 font-semibold text-blue-600">Vendus</th>
                  <th className="px-4 py-4 font-semibold text-amber-600">Stock Δ</th>
                  <th className="px-4 py-4 font-semibold text-purple-600">Montant</th>
                  {canWrite && <th className="px-4 py-4 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eggsData?.data.map((record) => {
                  const r = record as EggRecord;
                  const type = rowType(r);
                  const net = r.eggsCollected - r.brokenEggs;
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/50 transition-colors ${type === "vente_stock" ? "bg-blue-50/30" : type === "appro" ? "bg-amber-50/30" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <TypeBadge type={type} />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {format(new Date(r.date), "dd MMM yyyy", { locale: fr })}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{r.batchName ?? "—"}</p>
                          <p className="text-xs text-slate-400">{r.farmName ?? ""}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {r.eggsCollected > 0 ? r.eggsCollected.toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-red-600">
                        {r.brokenEggs > 0 ? r.brokenEggs.toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">
                        {net > 0 ? net.toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-blue-700">
                        {r.soldEggs > 0 ? r.soldEggs.toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold tabular-nums ${r.stockEggs < 0 ? "text-red-600" : "text-amber-700"}`}>
                          {r.stockEggs >= 0 ? "+" : ""}{r.stockEggs.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-purple-700">
                        {(r.caisseAmount ?? 0) > 0 ? fmtFcfa(r.caisseAmount ?? 0) : "—"}
                      </td>
                      {canWrite && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {type === "production" && (
                              <button
                                onClick={() => { setEditRecord(r); setModalType("collecte"); }}
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="Modifier"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteTarget(r.id)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
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

      {/* Modals */}
      {modalType === "collecte" && (
        <EggModal
          record={editRecord}
          onClose={() => { setModalType(null); setEditRecord(null); }}
          onSuccess={refetch}
        />
      )}
      {modalType === "vente" && (
        <VenteStockModal
          stockPerBatch={stockPerBatch}
          onClose={() => setModalType(null)}
          onSuccess={refetch}
        />
      )}
      {modalType === "appro" && (
        <ApproModal
          onClose={() => setModalType(null)}
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

function StatCard({ label, value, color, small }: { label: string; value: string; color: string; small?: boolean }) {
  const colors: Record<string, string> = {
    slate: "border-slate-200",
    red: "border-red-100",
    emerald: "border-emerald-100",
    blue: "border-blue-100",
    amber: "border-amber-100",
    purple: "border-purple-100",
  };
  const textColors: Record<string, string> = {
    slate: "text-slate-900",
    red: "text-red-600",
    emerald: "text-emerald-700",
    blue: "text-blue-700",
    amber: "text-amber-700",
    purple: "text-purple-700",
  };
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border ${colors[color] ?? "border-slate-200"}`}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`${small ? "text-base" : "text-2xl"} font-bold mt-1 ${textColors[color] ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function TypeBadge({ type }: { type: "production" | "vente_stock" | "appro" }) {
  if (type === "vente_stock") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
        <TrendingDown className="w-3 h-3" /> Vente
      </span>
    );
  }
  if (type === "appro") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
        <PackagePlus className="w-3 h-3" /> Appro
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
      <Egg className="w-3 h-3" /> Collecte
    </span>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Modal: Enregistrement de collecte journalière           */
/* ──────────────────────────────────────────────────────── */
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
    <ModalWrapper title={isEdit ? "Modifier la collecte" : "Enregistrer une collecte"} onClose={onClose}>
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
          <span className="text-sm font-medium text-emerald-800 flex-1">Œufs nets</span>
          <span className="text-lg font-bold text-emerald-700">{netEggs.toLocaleString("fr-ML")}</span>
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
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex flex-col gap-0.5">
            <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">Montant caisse</span>
            <span className="text-xl font-bold text-purple-800">{caisseAmount > 0 ? caisseAmount.toLocaleString("fr-ML") : "0"} FCFA</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Caisses physiques</label>
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
    </ModalWrapper>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Modal: Vente depuis le stock d'œufs                     */
/* ──────────────────────────────────────────────────────── */
function VenteStockModal({
  stockPerBatch,
  onClose,
  onSuccess,
}: {
  stockPerBatch: { batchId: string; batchName: string; farmName: string; stock: number }[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    batchId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    quantity: "",
    unitPrice: "",
    buyerName: "",
    customerId: "",
    notes: "",
  });

  const createSaleMutation = useCreateSale();
  const createEggMutation = useCreateEggProduction();
  const { data: customersData } = useListCustomers({ limit: 100 });

  const selectedBatch = stockPerBatch.find(b => b.batchId === form.batchId);
  const currentStock = selectedBatch ? Math.max(0, selectedBatch.stock) : 0;
  const qty = parseInt(form.quantity, 10) || 0;
  const unitPrice = parseFloat(form.unitPrice) || 0;
  const totalAmount = qty * unitPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batchId) { toast.error("Veuillez sélectionner un lot"); return; }
    if (qty <= 0) { toast.error("La quantité doit être supérieure à 0"); return; }
    if (qty > currentStock) { toast.error(`Stock insuffisant. Stock disponible : ${currentStock.toLocaleString("fr-ML")} œufs`); return; }
    if (!form.buyerName.trim()) { toast.error("Le nom de l'acheteur est requis"); return; }

    const notes = `[VENTE STOCK] Vente depuis stock – ${form.buyerName}${form.notes ? " – " + form.notes : ""}`;

    try {
      await createSaleMutation.mutateAsync({
        data: {
          batchId: form.batchId,
          customerId: form.customerId || undefined,
          quantity: qty,
          unitPrice,
          totalAmount,
          buyerName: form.buyerName,
          saleDate: form.date,
          type: "OEUFS",
          notes: form.notes || undefined,
        } as any,
      });

      await createEggMutation.mutateAsync({
        data: {
          batchId: form.batchId,
          date: form.date,
          eggsCollected: 0,
          brokenEggs: 0,
          soldEggs: qty,
          stockEggs: -qty,
          cratesCount: 0,
          unitPrice,
          caisseAmount: totalAmount,
          notes,
        },
      });

      toast.success(`Vente de ${qty.toLocaleString("fr-ML")} œufs enregistrée — ${fmtFcfa(totalAmount)}`);
      onSuccess();
      onClose();
    } catch {
      toast.error("Erreur lors de l'enregistrement de la vente");
    }
  };

  const isPending = createSaleMutation.isPending || createEggMutation.isPending;

  return (
    <ModalWrapper title="Vendre des œufs depuis le stock" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Lot *</label>
          <select
            required
            value={form.batchId}
            onChange={e => setForm({ ...form, batchId: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">Sélectionner un lot</option>
            {stockPerBatch.map(b => (
              <option key={b.batchId} value={b.batchId} disabled={Math.max(0, b.stock) === 0}>
                {b.batchName} — {b.farmName} ({Math.max(0, b.stock).toLocaleString("fr-ML")} œufs dispo.)
              </option>
            ))}
          </select>
          {form.batchId && (
            <div className={`mt-2 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${currentStock > 0 ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              <Package className="w-4 h-4" />
              Stock disponible : {currentStock.toLocaleString("fr-ML")} œufs
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date de vente *</label>
          <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantité d'œufs *</label>
            <input
              required type="number" min="1" max={currentStock || undefined}
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prix unitaire (FCFA/œuf) *</label>
            <input
              required type="number" min="0" step="1"
              value={form.unitPrice}
              onChange={e => setForm({ ...form, unitPrice: e.target.value })}
              placeholder="125"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        {qty > 0 && unitPrice > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Montant total</span>
            <span className="text-xl font-bold text-blue-900">{fmtFcfa(totalAmount)}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Client (optionnel)</label>
          <select
            value={form.customerId}
            onChange={e => {
              const cId = e.target.value;
              const cust = customersData?.data.find(c => c.id === cId);
              setForm({ ...form, customerId: cId, buyerName: cust?.name ?? form.buyerName });
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">— Sélectionner un client existant —</option>
            {customersData?.data.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'acheteur *</label>
          <input
            required type="text"
            value={form.buyerName}
            onChange={e => setForm({ ...form, buyerName: e.target.value })}
            placeholder="Nom du client"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optionnel)</label>
          <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Observations, conditions de vente..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">Annuler</button>
          <button type="submit" disabled={isPending || currentStock === 0} className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md disabled:opacity-50">
            {isPending ? "Enregistrement..." : "Confirmer la vente"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Modal: Approvisionnement (réception d'œufs)            */
/* ──────────────────────────────────────────────────────── */
function ApproModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    batchId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    quantity: "",
    notes: "",
  });

  const createMutation = useCreateEggProduction();
  const { data: batchesData } = useListBatches({ status: "ACTIF", limit: 100 });
  const qty = parseInt(form.quantity, 10) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batchId) { toast.error("Veuillez sélectionner un lot"); return; }
    if (qty <= 0) { toast.error("La quantité doit être supérieure à 0"); return; }

    const notes = `[APPRO] Approvisionnement${form.notes ? " – " + form.notes : ""}`;

    try {
      await createMutation.mutateAsync({
        data: {
          batchId: form.batchId,
          date: form.date,
          eggsCollected: qty,
          brokenEggs: 0,
          soldEggs: 0,
          stockEggs: qty,
          cratesCount: 0,
          unitPrice: 0,
          caisseAmount: 0,
          notes,
        },
      });
      toast.success(`Approvisionnement de ${qty.toLocaleString("fr-ML")} œufs enregistré`);
      onSuccess();
      onClose();
    } catch {
      toast.error("Erreur lors de l'approvisionnement");
    }
  };

  return (
    <ModalWrapper title="Approvisionnement en œufs" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          Utilisez cette fonction pour enregistrer une réception d'œufs (achat, transfert, ajustement de stock) sans passer par la collecte journalière.
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Lot destinataire *</label>
          <select
            required
            value={form.batchId}
            onChange={e => setForm({ ...form, batchId: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="">Sélectionner un lot</option>
            {batchesData?.data.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
          <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Quantité d'œufs reçus *</label>
          <input
            required type="number" min="1"
            value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })}
            placeholder="0"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>

        {qty > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-amber-800">Ajout au stock</span>
            <span className="text-xl font-bold text-amber-900">+{qty.toLocaleString("fr-ML")} œufs</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optionnel)</label>
          <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Source, raison, fournisseur..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">Annuler</button>
          <button type="submit" disabled={createMutation.isPending} className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-md disabled:opacity-50">
            {createMutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Wrapper modal générique                                 */
/* ──────────────────────────────────────────────────────── */
function ModalWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
