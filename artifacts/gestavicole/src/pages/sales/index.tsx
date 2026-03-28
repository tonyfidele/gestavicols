import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useListSales, useCreateSale, useListBatches } from "@workspace/api-client-react";
import { Plus, DollarSign, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

export default function Sales() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: salesData, isLoading, refetch } = useListSales({ limit: 50 });

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Ventes</h1>
          <p className="text-slate-500 mt-1">Registre des ventes et transactions</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Enregistrer Vente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Total des ventes (Mois)</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {formatCurrency(salesData?.totalAmount || 0)}
          </p>
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
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Acheteur</th>
                <th className="px-6 py-4 font-semibold">Lot</th>
                <th className="px-6 py-4 font-semibold">Qté</th>
                <th className="px-6 py-4 font-semibold">Prix Unitaire</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesData?.data.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {format(new Date(sale.saleDate), "dd MMM yyyy", { locale: fr })}
                  </td>
                  <td className="px-6 py-4 text-slate-700">{sale.buyerName}</td>
                  <td className="px-6 py-4 text-slate-600">{sale.batchName || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{sale.quantity.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600">{formatCurrency(sale.unitPrice)}</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600">
                    {formatCurrency(sale.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!salesData?.data || salesData.data.length === 0) && (
            <div className="py-12 text-center text-slate-500">Aucune vente enregistrée</div>
          )}
        </div>
      )}

      {isModalOpen && <CreateSaleModal onClose={() => setIsModalOpen(false)} onSuccess={refetch} />}
    </AppLayout>
  );
}

function CreateSaleModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({ 
    batchId: "", quantity: "", unitPrice: "", buyerName: "", saleDate: format(new Date(), 'yyyy-MM-dd'), type: "ANIMAUX" 
  });
  const createMutation = useCreateSale();
  const { data: batches } = useListBatches({ status: "ACTIF" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          batchId: formData.batchId || undefined,
          quantity: parseInt(formData.quantity, 10),
          unitPrice: parseFloat(formData.unitPrice),
          buyerName: formData.buyerName,
          saleDate: new Date(formData.saleDate).toISOString(),
          type: formData.type
        }
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Enregistrer une Vente</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Acheteur</label>
            <input required type="text" value={formData.buyerName} onChange={e => setFormData({...formData, buyerName: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lot (Optionnel)</label>
            <select value={formData.batchId} onChange={e => setFormData({...formData, batchId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200">
              <option value="">Sélectionner un lot</option>
              {batches?.data.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.currentCount} dispo)</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantité</label>
              <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prix Unitaire (€)</label>
              <input required type="number" step="0.01" min="0" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input required type="date" value={formData.saleDate} onChange={e => setFormData({...formData, saleDate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">Annuler</button>
            <button type="submit" disabled={createMutation.isPending} className="px-6 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-white font-medium">
              {createMutation.isPending ? "Création..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
