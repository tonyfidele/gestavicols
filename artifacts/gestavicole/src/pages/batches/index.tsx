import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useListBatches, useCreateBatch, useDeleteBatch, useListFarms } from "@workspace/api-client-react";
import { Plus, Layers, Loader2, ArrowRight, Activity, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Batches() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { data: batchesData, isLoading, refetch } = useListBatches({ limit: 50 });
  const deleteMutation = useDeleteBatch();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({ batchId: deleteTarget });
      toast.success("Lot supprimé");
      refetch();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteTarget(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIF': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'TERMINE': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'EN_ATTENTE': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Lots</h1>
          <p className="text-slate-500 mt-1">Suivi de vos bandes de volailles</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Nouveau lot
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Identifiant</th>
                  <th className="px-6 py-4 font-semibold">Ferme</th>
                  <th className="px-6 py-4 font-semibold">Espèce</th>
                  <th className="px-6 py-4 font-semibold">Effectif</th>
                  <th className="px-6 py-4 font-semibold">Mortalité</th>
                  <th className="px-6 py-4 font-semibold">Statut</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batchesData?.data.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-500" />
                        {batch.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Démarré le {format(new Date(batch.startDate), "dd MMM yyyy", { locale: fr })}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{batch.farmName}</td>
                    <td className="px-6 py-4 text-slate-600">{batch.species}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{batch.currentCount.toLocaleString()}</div>
                      <div className="text-xs text-slate-500">sur {batch.initialCount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 font-medium ${batch.mortalityRate > 5 ? 'text-red-600' : 'text-emerald-600'}`}>
                        <Activity className="w-3 h-3" /> {batch.mortalityRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(batch.status)}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/batches/${batch.id}`} className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(batch.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
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
          {(!batchesData?.data || batchesData.data.length === 0) && (
            <div className="py-12 text-center">
              <p className="text-slate-500 font-medium">Aucun lot trouvé</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && <CreateBatchModal onClose={() => setIsModalOpen(false)} onSuccess={refetch} />}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmer la suppression</h3>
            <p className="text-slate-600 mb-6">Voulez-vous vraiment supprimer ce lot ? Cette action est irréversible.</p>
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

function CreateBatchModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: "", farmId: "", species: "", initialCount: "", startDate: format(new Date(), 'yyyy-MM-dd') });
  const createMutation = useCreateBatch();
  const { data: farmsData } = useListFarms({ limit: 100 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          name: formData.name,
          farmId: formData.farmId,
          species: formData.species,
          initialCount: parseInt(formData.initialCount, 10),
          startDate: new Date(formData.startDate).toISOString()
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Nouveau Lot</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Référence du lot</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Ex: LOT-2024-01" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ferme</label>
            <select required value={formData.farmId} onChange={e => setFormData({...formData, farmId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option value="">Sélectionner une ferme</option>
              {farmsData?.data.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Espèce</label>
              <input required type="text" value={formData.species} onChange={e => setFormData({...formData, species: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Ex: Poulet de chair" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Effectif initial</label>
              <input required type="number" min="1" value={formData.initialCount} onChange={e => setFormData({...formData, initialCount: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date de démarrage</label>
            <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">Annuler</button>
            <button type="submit" disabled={createMutation.isPending} className="px-6 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-white font-medium shadow-md shadow-primary/20 disabled:opacity-50">
              {createMutation.isPending ? "Création..." : "Démarrer le lot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
