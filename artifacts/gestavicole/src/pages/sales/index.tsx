import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useListSales, useCreateSale, useUpdateSale, useDeleteSale, useListBatches } from "@workspace/api-client-react";
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ExportMenu } from "@/components/ui/export-menu";
import { exportToExcel, exportToPDF } from "@/lib/export";

type Sale = {
  id: string;
  batchId?: string;
  batchName?: string;
  buyerName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: string;
  type: string;
};

const EMPTY_FORM = {
  batchId: "", quantity: "", unitPrice: "", buyerName: "",
  saleDate: format(new Date(), "yyyy-MM-dd"), type: "ANIMAUX",
};

export default function Sales() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editSale, setEditSale] = useState<Sale | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: salesData, isLoading, refetch } = useListSales({ limit: 100 });
  const deleteMutation = useDeleteSale();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({ saleId: deleteTarget });
      toast.success("Vente supprimée");
      refetch();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteTarget(null);
    }
  };

  const COLS = [
    { header: "Date", key: "date", width: 15 },
    { header: "Acheteur", key: "buyerName", width: 25 },
    { header: "Lot", key: "batchName", width: 20 },
    { header: "Type", key: "type", width: 12 },
    { header: "Quantité", key: "quantity", width: 12 },
    { header: "Prix Unitaire (FCFA)", key: "unitPrice", width: 20 },
    { header: "Total (FCFA)", key: "totalAmount", width: 18 },
  ];

  const getExportRows = () =>
    (salesData?.data ?? []).map((s) => ({
      date: format(new Date(s.saleDate), "dd/MM/yyyy"),
      buyerName: s.buyerName,
      batchName: s.batchName ?? "—",
      type: s.type,
      quantity: s.quantity,
      unitPrice: s.unitPrice,
      totalAmount: s.totalAmount,
    }));

  const handleExcel = () => exportToExcel("rapport_ventes", "Ventes", COLS, getExportRows());
  const handlePdf = () => exportToPDF("rapport_ventes", "Rapport des Ventes", `Total : ${formatCurrency(salesData?.totalAmount || 0)} — ${salesData?.total || 0} transactions`, COLS, getExportRows());

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Ventes</h1>
          <p className="text-slate-500 mt-1">Registre des ventes et transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportMenu onExcel={handleExcel} onPdf={handlePdf} disabled={isLoading || !salesData?.data?.length} />
          <button
            onClick={() => { setEditSale(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" /> Enregistrer Vente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Total des ventes</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{formatCurrency(salesData?.totalAmount || 0)}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Transactions</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{salesData?.total || 0}</p>
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
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Acheteur</th>
                  <th className="px-6 py-4 font-semibold">Lot</th>
                  <th className="px-6 py-4 font-semibold">Qté</th>
                  <th className="px-6 py-4 font-semibold">Prix Unitaire</th>
                  <th className="px-6 py-4 font-semibold">Total</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesData?.data.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {format(new Date(sale.saleDate), "dd MMM yyyy", { locale: fr })}
                    </td>
                    <td className="px-6 py-4 text-slate-700">{sale.buyerName}</td>
                    <td className="px-6 py-4 text-slate-600">{sale.batchName || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{sale.quantity.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-600">{formatCurrency(sale.unitPrice)}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(sale.totalAmount)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditSale(sale as Sale); setIsModalOpen(true); }}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(sale.id)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(!salesData?.data || salesData.data.length === 0) && (
            <div className="py-12 text-center text-slate-500">Aucune vente enregistrée</div>
          )}
        </div>
      )}

      {isModalOpen && (
        <SaleModal
          sale={editSale}
          onClose={() => { setIsModalOpen(false); setEditSale(null); }}
          onSuccess={refetch}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmer la suppression</h3>
            <p className="text-slate-600 mb-6">Voulez-vous vraiment supprimer cette vente ?</p>
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

function SaleModal({ sale, onClose, onSuccess }: { sale: Sale | null; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!sale;
  const [formData, setFormData] = useState(
    sale
      ? {
          batchId: sale.batchId || "",
          quantity: String(sale.quantity),
          unitPrice: String(sale.unitPrice),
          buyerName: sale.buyerName,
          saleDate: sale.saleDate.split("T")[0],
          type: sale.type,
        }
      : { ...EMPTY_FORM }
  );
  const createMutation = useCreateSale();
  const updateMutation = useUpdateSale();
  const { data: batches } = useListBatches({ limit: 100 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      batchId: formData.batchId || undefined,
      quantity: parseInt(formData.quantity, 10),
      unitPrice: parseFloat(formData.unitPrice),
      buyerName: formData.buyerName,
      saleDate: new Date(formData.saleDate).toISOString(),
      type: formData.type,
    };
    try {
      if (isEdit && sale) {
        await updateMutation.mutateAsync({ saleId: sale.id, data: payload });
        toast.success("Vente mise à jour");
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast.success("Vente enregistrée");
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
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Modifier la vente" : "Enregistrer une Vente"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Acheteur</label>
            <input required type="text" value={formData.buyerName} onChange={e => setFormData({ ...formData, buyerName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lot (Optionnel)</label>
            <select value={formData.batchId} onChange={e => setFormData({ ...formData, batchId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option value="">Sélectionner un lot</option>
              {batches?.data.map(b => <option key={b.id} value={b.id}>{b.name} ({b.currentCount} dispo)</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantité</label>
              <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prix Unitaire (FCFA)</label>
              <input required type="number" step="0.01" min="0" value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input required type="date" value={formData.saleDate} onChange={e => setFormData({ ...formData, saleDate: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">Annuler</button>
            <button type="submit" disabled={isPending} className="px-6 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-white font-medium disabled:opacity-50">
              {isPending ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
