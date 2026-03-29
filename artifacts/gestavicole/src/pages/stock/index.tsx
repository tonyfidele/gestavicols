import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useListStock, useCreateStockItem } from "@workspace/api-client-react";
import { Plus, Package, AlertTriangle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const CATEGORIES = ["ALIMENTS", "MEDICAMENTS", "EQUIPEMENT", "AUTRE"];
const UNITS = ["kg", "L", "unité", "sac", "boîte"];

export default function Stock() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: stockData, isLoading, refetch } = useListStock({ limit: 50 });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "ALIMENTS": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "MEDICAMENTS": return "bg-blue-100 text-blue-700 border-blue-200";
      case "EQUIPEMENT": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Stock</h1>
          <p className="text-slate-500 mt-1">Gestion des inventaires et approvisionnements</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Ajouter article
        </button>
      </div>

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
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Article</th>
                <th className="px-6 py-4 font-semibold">Catégorie</th>
                <th className="px-6 py-4 font-semibold">Qté</th>
                <th className="px-6 py-4 font-semibold">Seuil min.</th>
                <th className="px-6 py-4 font-semibold">Prix unitaire</th>
                <th className="px-6 py-4 font-semibold text-right">Valeur totale</th>
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
                      <span className={`font-semibold ${isLow ? "text-red-600" : "text-slate-900"}`}>
                        {item.quantity.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{item.minimumLevel.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {formatCurrency(item.currentValue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!stockData?.data || stockData.data.length === 0) && (
            <div className="py-16 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Aucun article en stock</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && <CreateStockModal onClose={() => setIsModalOpen(false)} onSuccess={refetch} />}
    </AppLayout>
  );
}

function CreateStockModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "", category: "ALIMENTS", quantity: "", unit: "kg", minimumLevel: "", unitPrice: "",
  });
  const createMutation = useCreateStockItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          name: formData.name,
          category: formData.category,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          minimumLevel: parseFloat(formData.minimumLevel),
          unitPrice: parseFloat(formData.unitPrice),
        },
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
          <h2 className="text-lg font-bold text-slate-900">Nouvel Article de Stock</h2>
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
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">Annuler</button>
            <button type="submit" disabled={createMutation.isPending} className="px-6 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-white font-medium shadow-md shadow-primary/20 disabled:opacity-50">
              {createMutation.isPending ? "Ajout..." : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
