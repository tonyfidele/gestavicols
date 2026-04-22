import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useListExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useListFarms, useListBatches } from "@workspace/api-client-react";
import { Plus, CreditCard, Loader2, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ExportMenu } from "@/components/ui/export-menu";
import { exportToExcel, exportToPDF } from "@/lib/export";

const CATEGORIES = [
  "ALIMENTS",
  "MEDICAMENTS",
  "SALAIRES",
  "VETERINAIRE",
  "MAINTENANCE",
  "ENERGIE",
  "MAIN_OEUVRE",
  "EQUIPEMENT",
  "TRANSPORT",
  "AUTRE",
];

type Expense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  batchId?: string;
  farmId?: string;
  farmName?: string | null;
};

const EMPTY_FORM = {
  category: "ALIMENTS", description: "", amount: "",
  date: format(new Date(), "yyyy-MM-dd"), batchId: "", farmId: "",
};

export default function Expenses() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: expensesData, isLoading, refetch } = useListExpenses({ limit: 100 });
  const deleteMutation = useDeleteExpense();

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({ expenseId: deleteTarget });
      toast.success("Dépense supprimée");
      refetch();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteTarget(null);
    }
  };

  const COLS = [
    { header: "Date", key: "date", width: 13 },
    { header: "Ferme", key: "farmName", width: 20 },
    { header: "Description", key: "description", width: 30 },
    { header: "Catégorie", key: "category", width: 15 },
    { header: "Montant (FCFA)", key: "amount", width: 18 },
  ];

  const getExportRows = () =>
    (expensesData?.data ?? []).map((e) => ({
      date: format(new Date(e.date), "dd/MM/yyyy"),
      farmName: (e as Expense).farmName || "—",
      description: e.description,
      category: e.category,
      amount: e.amount,
    }));

  const handleExcel = () => exportToExcel("rapport_depenses", "Dépenses", COLS, getExportRows());
  const handlePdf = () => exportToPDF("rapport_depenses", "Rapport des Dépenses", `Total : ${formatCurrency(expensesData?.totalAmount || 0)} — ${expensesData?.total || 0} dépenses`, COLS, getExportRows());

  return (
    <AppLayout>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl lg:text-3xl font-display font-bold text-slate-900">Dépenses</h1>
          <p className="text-slate-500 mt-1">Suivi des charges et dépenses d'exploitation</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportMenu onExcel={handleExcel} onPdf={handlePdf} disabled={isLoading || !expensesData?.data?.length} />
          <button
            onClick={() => { setEditExpense(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" /> Enregistrer dépense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Nombre de dépenses</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{expensesData?.total || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Montant total</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(expensesData?.totalAmount || 0)}</p>
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
                  <th className="px-6 py-4 font-semibold">Ferme</th>
                  <th className="px-6 py-4 font-semibold">Description</th>
                  <th className="px-6 py-4 font-semibold">Catégorie</th>
                  <th className="px-6 py-4 font-semibold">Montant</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expensesData?.data.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {format(new Date(expense.date), "dd MMM yyyy", { locale: fr })}
                    </td>
                    <td className="px-6 py-4">
                      {(expense as Expense).farmName
                        ? <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">{(expense as Expense).farmName}</span>
                        : <span className="text-slate-300 text-xs">—</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-slate-700">{expense.description}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-red-600">{formatCurrency(expense.amount)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditExpense(expense as Expense); setIsModalOpen(true); }}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(expense.id)}
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
          {(!expensesData?.data || expensesData.data.length === 0) && (
            <div className="py-16 text-center">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Aucune dépense enregistrée</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <ExpenseModal
          expense={editExpense}
          onClose={() => { setIsModalOpen(false); setEditExpense(null); }}
          onSuccess={refetch}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmer la suppression</h3>
            <p className="text-slate-600 mb-6">Voulez-vous vraiment supprimer cette dépense ?</p>
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

function ExpenseModal({ expense, onClose, onSuccess }: { expense: Expense | null; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!expense;
  const [formData, setFormData] = useState(
    expense
      ? {
          category: expense.category,
          description: expense.description,
          amount: String(expense.amount),
          date: expense.date.split("T")[0],
          batchId: expense.batchId || "",
          farmId: expense.farmId || "",
        }
      : { ...EMPTY_FORM }
  );
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const { data: farmsData } = useListFarms({ limit: 100 });
  const { data: batchesData } = useListBatches({ limit: 100 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString(),
      batchId: formData.batchId || undefined,
      farmId: formData.farmId || undefined,
    };
    try {
      if (isEdit && expense) {
        await updateMutation.mutateAsync({ expenseId: expense.id, data: payload });
        toast.success("Dépense mise à jour");
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast.success("Dépense enregistrée");
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
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Modifier la dépense" : "Nouvelle Dépense"}</h2>
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
