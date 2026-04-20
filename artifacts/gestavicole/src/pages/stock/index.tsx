import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  useListStock,
  useCreateStockItem,
  useUpdateStockItem,
  useDeleteStockItem,
  useListStockMovements,
  useCreateStockMovement,
  useListBatches,
} from "@workspace/api-client-react";
import { Plus, Package, AlertTriangle, Loader2, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, History, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ExportMenu } from "@/components/ui/export-menu";
import { exportToExcel, exportToPDF } from "@/lib/export";
import { format } from "date-fns";
import type { StockMovement, Stock } from "@workspace/api-client-react";

const CATEGORIES = ["ALIMENTS", "MEDICAMENTS", "EQUIPEMENT", "AUTRE"];
const UNITS = ["kg", "L", "unité", "sac", "boîte"];

type StockItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minimumLevel: number;
  unitPrice: number;
  currentValue: number;
};

const EMPTY_FORM = { name: "", category: "ALIMENTS", quantity: "", unit: "kg", minimumLevel: "", unitPrice: "" };

export default function StockPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [consumptionModal, setConsumptionModal] = useState(false);
  const [mouvementsItem, setMouvementsItem] = useState<StockItem | null>(null);

  const { data: stockData, isLoading, refetch } = useListStock({ limit: 100 });
  const deleteMutation = useDeleteStockItem();

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "ALIMENTS": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "MEDICAMENTS": return "bg-blue-100 text-blue-700 border-blue-200";
      case "EQUIPEMENT": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({ stockId: deleteTarget });
      toast.success("Article supprimé");
      refetch();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteTarget(null);
    }
  };

  const totalValue = stockData?.data?.reduce((s, i) => s + (i.currentValue || 0), 0) || 0;
  const lowItems = stockData?.data?.filter(i => i.quantity < i.minimumLevel) || [];

  const COLS = [
    { header: "Article", key: "name", width: 25 },
    { header: "Catégorie", key: "category", width: 15 },
    { header: "Quantité", key: "quantity", width: 12 },
    { header: "Unité", key: "unit", width: 10 },
    { header: "Seuil min.", key: "minimumLevel", width: 12 },
    { header: "Prix unit. (FCFA)", key: "unitPrice", width: 18 },
    { header: "Valeur totale (FCFA)", key: "currentValue", width: 20 },
    { header: "Statut", key: "status", width: 12 },
  ];

  const getExportRows = () =>
    (stockData?.data ?? []).map((item) => ({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      minimumLevel: item.minimumLevel,
      unitPrice: item.unitPrice,
      currentValue: item.currentValue,
      status: item.quantity <= item.minimumLevel ? "Stock faible" : "Normal",
    }));

  const handleExcel = () => exportToExcel("rapport_stock", "Stock", COLS, getExportRows());
  const handlePdf = () => exportToPDF("rapport_stock", "Rapport de Stock", `${stockData?.total || 0} articles — Valeur totale : ${formatCurrency(totalValue)}`, COLS, getExportRows());

  return (
    <AppLayout>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl lg:text-3xl font-display font-bold text-slate-900">Stock</h1>
          <p className="text-slate-500 mt-1">Gestion des inventaires et approvisionnements</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportMenu onExcel={handleExcel} onPdf={handlePdf} disabled={isLoading || !stockData?.data?.length} />
          <button
            onClick={() => setConsumptionModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5"
          >
            <ShoppingBag className="w-5 h-5" /> Consommation
          </button>
          <button
            onClick={() => { setEditItem(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" /> Ajouter article
          </button>
        </div>
      </div>

      {/* Alerte stock faible */}
      {lowItems.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-bold text-red-700">Alerte — {lowItems.length} article(s) en stock faible</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowItems.map(i => (
              <span key={i.id} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                {i.name} : {i.quantity} {i.unit} (min. {i.minimumLevel})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Articles en stock</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stockData?.total || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
          <p className="text-sm font-medium text-slate-500">Alertes stock faible</p>
          <p className="text-3xl font-bold text-red-600 mt-2 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7" /> {stockData?.lowStockCount || 0}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Valeur totale du stock</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(totalValue)}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Article</th>
                  <th className="px-6 py-4 font-semibold">Catégorie</th>
                  <th className="px-6 py-4 font-semibold">Qté</th>
                  <th className="px-6 py-4 font-semibold">Seuil min.</th>
                  <th className="px-6 py-4 font-semibold">Prix unit.</th>
                  <th className="px-6 py-4 font-semibold">Valeur totale</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockData?.data.map((item) => {
                  const isLow = item.quantity < item.minimumLevel;
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${isLow ? "bg-red-50/40" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isLow && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold text-lg ${isLow ? "text-red-600" : "text-slate-900"}`}>
                          {item.quantity.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">{item.unit}</span>
                        {isLow && (
                          <div className="text-xs text-red-500 font-medium mt-0.5">⚠ Stock faible</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{item.minimumLevel.toLocaleString()} {item.unit}</td>
                      <td className="px-6 py-4 text-slate-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(item.currentValue)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setMouvementsItem(item as StockItem)}
                            className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Historique"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditItem(item as StockItem); setIsModalOpen(true); }}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item.id)}
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
          {(!stockData?.data || stockData.data.length === 0) && (
            <div className="py-16 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Aucun article en stock</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <StockModal
          item={editItem}
          onClose={() => { setIsModalOpen(false); setEditItem(null); }}
          onSuccess={refetch}
        />
      )}

      {consumptionModal && (
        <ConsommationModal
          stockItems={stockData?.data ?? []}
          onClose={() => setConsumptionModal(false)}
          onSuccess={refetch}
        />
      )}

      {mouvementsItem && (
        <MouvementsModal
          item={mouvementsItem}
          onClose={() => setMouvementsItem(null)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmer la suppression</h3>
            <p className="text-slate-600 mb-6">Voulez-vous vraiment supprimer cet article du stock ?</p>
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

function StockModal({ item, onClose, onSuccess }: { item: StockItem | null; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!item;
  const [formData, setFormData] = useState(
    item
      ? { name: item.name, category: item.category, quantity: String(item.quantity), unit: item.unit, minimumLevel: String(item.minimumLevel), unitPrice: String(item.unitPrice) }
      : { ...EMPTY_FORM }
  );
  const createMutation = useCreateStockItem();
  const updateMutation = useUpdateStockItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      category: formData.category,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      minimumLevel: parseFloat(formData.minimumLevel),
      unitPrice: parseFloat(formData.unitPrice),
    };
    try {
      if (isEdit && item) {
        await updateMutation.mutateAsync({ stockId: item.id, data: payload });
        toast.success("Article mis à jour");
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast.success("Article ajouté");
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Modifier l'article" : "Nouvel Article de Stock"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'article</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Ex: Aliment démarrage" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
              <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unité</label>
              <select required value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantité</label>
              <input required type="number" min="0" step="0.01" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Seuil minimum</label>
              <input required type="number" min="0" step="0.01" value={formData.minimumLevel} onChange={e => setFormData({ ...formData, minimumLevel: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prix unitaire (FCFA)</label>
            <input required type="number" min="0" step="0.01" value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">Annuler</button>
            <button type="submit" disabled={isPending} className="px-6 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-white font-medium shadow-md shadow-primary/20 disabled:opacity-50">
              {isPending ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConsommationModal({
  stockItems,
  onClose,
  onSuccess,
}: {
  stockItems: Stock[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const alimentItems = stockItems.filter(i => i.category === "ALIMENTS");
  const [formData, setFormData] = useState({
    stockItemId: alimentItems[0]?.id ?? "",
    batchId: "",
    type: "SORTIE" as "ENTREE" | "SORTIE",
    quantity: "",
    movementDate: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  const { data: batchesData } = useListBatches({ limit: 100, status: "ACTIF" });
  const createMovement = useCreateStockMovement();

  const selectedStock = stockItems.find(i => i.id === formData.stockItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stockItemId || !formData.quantity) return;
    try {
      const result = await createMovement.mutateAsync({
        data: {
          stockItemId: formData.stockItemId,
          batchId: formData.batchId || undefined,
          type: formData.type,
          quantity: parseFloat(formData.quantity),
          movementDate: formData.movementDate,
          notes: formData.notes || undefined,
        },
      });
      const action = formData.type === "SORTIE" ? "Consommation enregistrée" : "Entrée enregistrée";
      toast.success(`${action} — nouveau stock : ${result.newQuantity} ${selectedStock?.unit ?? ""}`);
      if (result.isLowStock) {
        toast.warning(`⚠ Stock faible pour ${selectedStock?.name}`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">Mouvement de Stock</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type de mouvement */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "SORTIE" })}
              className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${formData.type === "SORTIE" ? "bg-amber-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              <ArrowDownCircle className="w-4 h-4" /> Consommation (Sortie)
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "ENTREE" })}
              className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${formData.type === "ENTREE" ? "bg-emerald-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              <ArrowUpCircle className="w-4 h-4" /> Approvisionnement (Entrée)
            </button>
          </div>

          {/* Article */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Article de stock</label>
            <select
              required
              value={formData.stockItemId}
              onChange={e => setFormData({ ...formData, stockItemId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
            >
              <option value="">— Sélectionner —</option>
              {stockItems.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.quantity} {s.unit} dispo)
                </option>
              ))}
            </select>
            {selectedStock && selectedStock.quantity < selectedStock.minimumLevel && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Stock actuellement faible !
              </p>
            )}
          </div>

          {/* Bande (lot) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bande / Lot <span className="text-slate-400 font-normal">(optionnel)</span>
            </label>
            <select
              value={formData.batchId}
              onChange={e => setFormData({ ...formData, batchId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
            >
              <option value="">— Aucune bande —</option>
              {batchesData?.data.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.farmName} ({b.currentCount.toLocaleString()} animaux)
                </option>
              ))}
            </select>
          </div>

          {/* Quantité et date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quantité {selectedStock ? `(${selectedStock.unit})` : ""}
              </label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                required
                type="date"
                value={formData.movementDate}
                onChange={e => setFormData({ ...formData, movementDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes <span className="text-slate-400 font-normal">(optionnel)</span></label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              placeholder="Remarques..."
            />
          </div>

          {/* Aperçu */}
          {selectedStock && formData.quantity && (
            <div className={`rounded-xl p-3 text-sm ${formData.type === "SORTIE" ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-200"}`}>
              <p className="font-medium text-slate-700">
                {formData.type === "SORTIE" ? "Après consommation" : "Après réception"} :
                {" "}<span className={`font-bold ${formData.type === "SORTIE" ? "text-amber-700" : "text-emerald-700"}`}>
                  {Math.max(0, selectedStock.quantity + (formData.type === "SORTIE" ? -parseFloat(formData.quantity || "0") : parseFloat(formData.quantity || "0"))).toFixed(2)} {selectedStock.unit}
                </span>
                {formData.type === "SORTIE" && parseFloat(formData.quantity || "0") > 0 && (selectedStock.quantity - parseFloat(formData.quantity)) < selectedStock.minimumLevel && (
                  <span className="ml-2 text-red-600 font-bold">⚠ Sera en dessous du seuil minimum !</span>
                )}
              </p>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">Annuler</button>
            <button
              type="submit"
              disabled={createMovement.isPending}
              className={`px-6 py-2 rounded-xl text-white font-medium shadow-md disabled:opacity-50 ${formData.type === "SORTIE" ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" : "bg-primary hover:bg-emerald-600 shadow-primary/20"}`}
            >
              {createMovement.isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MouvementsModal({ item, onClose }: { item: StockItem; onClose: () => void }) {
  const { data, isLoading } = useListStockMovements({ stockItemId: item.id, limit: 30 });

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Historique — {item.name}</h2>
            <p className="text-sm text-slate-500">Stock actuel : <span className="font-bold text-slate-900">{item.quantity} {item.unit}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : !data?.data?.length ? (
            <div className="py-12 text-center text-slate-500">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p>Aucun mouvement enregistré</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Qté</th>
                  <th className="px-4 py-3 font-semibold">Bande / Lot</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((m: StockMovement) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-700">{m.movementDate}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 font-bold text-xs ${m.type === "SORTIE" ? "text-amber-600" : "text-emerald-600"}`}>
                        {m.type === "SORTIE" ? <ArrowDownCircle className="w-3.5 h-3.5" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
                        {m.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {m.type === "SORTIE" ? "-" : "+"}{m.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.batchName ?? <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-3 text-slate-500">{m.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium">Fermer</button>
        </div>
      </div>
    </div>
  );
}
