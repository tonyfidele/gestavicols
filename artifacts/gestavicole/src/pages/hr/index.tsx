import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useListSalaries, useCreateSalary, useUpdateSalary, useDeleteSalary, useListUsers } from "@workspace/api-client-react";
import { Users, Plus, Loader2, DollarSign, CheckCircle, Clock, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function CreateSalaryModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const currentDate = new Date();
  const [form, setForm] = useState({
    userId: "",
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    baseSalary: 0,
    bonuses: 0,
    deductions: 0,
    paymentStatus: "EN_ATTENTE" as "EN_ATTENTE" | "PAYE" | "ANNULE",
    notes: "",
  });
  const { mutate: createSalary, isPending } = useCreateSalary();
  const { data: usersData } = useListUsers({ limit: 100 });

  const netSalary = form.baseSalary + form.bonuses - form.deductions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId) { toast.error("Veuillez sélectionner un employé"); return; }
    createSalary(
      { data: form },
      {
        onSuccess: () => { toast.success("Fiche de salaire créée"); onSuccess(); onClose(); },
        onError: () => toast.error("Erreur lors de la création"),
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Nouvelle Fiche de Salaire</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Employé *</label>
            <select
              required
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sélectionner un employé</option>
              {usersData?.data.filter(u => u.role !== "SUPER_ADMIN").map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mois</label>
              <select
                value={form.month}
                onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Année</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Salaire de base (FCFA) *</label>
            <input
              type="number"
              required
              min="0"
              value={form.baseSalary}
              onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Primes (FCFA)</label>
              <input
                type="number"
                min="0"
                value={form.bonuses}
                onChange={(e) => setForm({ ...form, bonuses: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Retenues (FCFA)</label>
              <input
                type="number"
                min="0"
                value={form.deductions}
                onChange={(e) => setForm({ ...form, deductions: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-emerald-700">Salaire net calculé</span>
              <span className="text-xl font-bold text-emerald-700">{netSalary.toLocaleString("fr-ML")} FCFA</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
            <select
              value={form.paymentStatus}
              onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="EN_ATTENTE">En attente</option>
              <option value="PAYE">Payé</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Remarques éventuelles..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50">
              {isPending ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HR() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const { data, isLoading, refetch } = useListSalaries({ month: selectedMonth, year: selectedYear, limit: 100 });
  const { mutate: updateSalary } = useUpdateSalary();
  const deleteMutation = useDeleteSalary();

  const handleMarkPaid = (id: string) => {
    updateSalary(
      { salaryId: id, data: { paymentStatus: "PAYE", paymentDate: new Date().toISOString().split("T")[0] } },
      {
        onSuccess: () => { toast.success("Salaire marqué comme payé"); refetch(); },
        onError: () => toast.error("Erreur"),
      }
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({ salaryId: deleteTarget });
      toast.success("Fiche de salaire supprimée");
      refetch();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteTarget(null);
    }
  };

  const totalNetSalary = data?.data.reduce((sum, s) => sum + (s.netSalary ?? 0), 0) ?? 0;
  const paidCount = data?.data.filter(s => s.paymentStatus === "PAYE").length ?? 0;
  const pendingCount = data?.data.filter(s => s.paymentStatus === "EN_ATTENTE").length ?? 0;

  const statusBadge = (status: string) => {
    switch (status) {
      case "PAYE": return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3" />Payé</span>;
      case "EN_ATTENTE": return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700"><Clock className="w-3 h-3" />En attente</span>;
      case "ANNULE": return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700"><XCircle className="w-3 h-3" />Annulé</span>;
      default: return null;
    }
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Ressources Humaines</h1>
          <p className="text-slate-500 mt-1">Gestion des salaires et du personnel</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Nouvelle fiche
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Masse salariale</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalNetSalary.toLocaleString("fr-ML")} FCFA</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Salaires payés</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{paidCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">En attente</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {[2023, 2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Employé</th>
                  <th className="px-6 py-4 font-semibold">Rôle</th>
                  <th className="px-6 py-4 font-semibold">Base</th>
                  <th className="px-6 py-4 font-semibold">Primes</th>
                  <th className="px-6 py-4 font-semibold">Retenues</th>
                  <th className="px-6 py-4 font-semibold">Net</th>
                  <th className="px-6 py-4 font-semibold">Statut</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.data.map((salary) => (
                  <tr key={salary.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-medium text-slate-900">{salary.userName || "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{salary.userRole || "—"}</td>
                    <td className="px-6 py-4 text-slate-700">{(salary.baseSalary ?? 0).toLocaleString("fr-ML")} FCFA</td>
                    <td className="px-6 py-4 text-emerald-600">+{(salary.bonuses ?? 0).toLocaleString("fr-ML")}</td>
                    <td className="px-6 py-4 text-red-500">-{(salary.deductions ?? 0).toLocaleString("fr-ML")}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{(salary.netSalary ?? 0).toLocaleString("fr-ML")} FCFA</td>
                    <td className="px-6 py-4">{statusBadge(salary.paymentStatus)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {salary.paymentStatus === "EN_ATTENTE" && (
                          <button
                            onClick={() => handleMarkPaid(salary.id)}
                            className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
                          >
                            Marquer payé
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(salary.id)}
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
          {(!data?.data || data.data.length === 0) && (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Aucune fiche de salaire pour cette période</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && <CreateSalaryModal onClose={() => setIsModalOpen(false)} onSuccess={refetch} />}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmer la suppression</h3>
            <p className="text-slate-600 mb-6">Voulez-vous vraiment supprimer cette fiche de salaire ?</p>
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
