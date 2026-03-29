import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useListExpenses, useCreateExpense, useListFarms, useListBatches } from "@workspace/api-client-react";
import { Plus, CreditCard, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

const CATEGORIES = ["ALIMENTS", "MEDICAMENTS", "ENERGIE", "MAIN_OEUVRE", "EQUIPEMENT", "TRANSPORT", "AUTRE"];

export default function Expenses() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: expensesData, isLoading, refetch } = useListExpenses({ limit: 50 });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "ALIMENTS": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "MEDICAMENTS": return "bg-blue-100 text-blue-700 border-blue-200";
      case "ENERGIE": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "MAIN_OEUVRE": return "bg-purple-100 text-purple-700 border-purple-200";
      case "EQUIPEMENT": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "TRANSPORT": return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Dépenses</h1>
          <p className="text-slate-500 mt-1">Suivi des charges et dépenses d'exploitation</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Enregistrer dépense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Total dépenses</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{expensesData?.total || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Montant total</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {formatCurrency(expensesData?.totalAmount || 0)}
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
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Catégorie</th>
                <th className="px-6 py-4 font-semibold text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expensesData?.data.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {format(new Date(expense.date), "dd MMM yyyy", { locale: fr })}
                  </td>
                  <td className="px-6 py-4 text-slate-700">{expense.description}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">
                    {formatCurrency(expense.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!expensesData?.data || expensesData.data.length === 0) && (
            <div className="py-16 text-center">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Aucune dépense enregistrée</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && <CreateExpenseModal onClose={() => setIsModalOpen(false)} onSuccess={refetch} />}
    </AppLayout>
  );
}

function CreateExpenseModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    category: "ALIMENTS", description: "", amount: "",
    date: format(new Date(), "yyyy-MM-dd"), batchId: "", farmId: "",
  });
  const createMutation = useCreateExpense();
  const { data: farmsData } = useListFarms({ limit: 100 });
  const { data: batchesData } = useListBatches({ status: "ACTIF", limit: 100 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          category: formData.category,
          description: formData.description,
          amount: parseFloat(formData.amount),
          date: new Date(formData.date).toISOString(),
          batchId: formData.batchId || undefined,
          farmId: formData.farmId || undefined,
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
          <h2 className="text-lg font-bold text-slate-900">Nouvelle Dépense</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
            <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input required type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Ex: Achat aliment starter 50 sacs" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Montant (FCFA)</label>
              <input required type="number" min="0" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ferme (optionnel)</label>
            <select value={formData.farmId} onChange={e => setFormData({ ...formData, farmId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option value="">Sélectionner une ferme</option>
              {farmsData?.data.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lot (optionnel)</label>
            <select value={formData.batchId} onChange={e => setFormData({ ...formData, batchId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option value="">Sélectionner un lot</option>
              {batchesData?.data.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">Annuler</button>
            <button type="submit" disabled={createMutation.isPending} className="px-6 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-white font-medium shadow-md shadow-primary/20 disabled:opacity-50">
              {createMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
