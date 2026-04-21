import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useListFarms, useCreateFarm, useDeleteFarm } from "@workspace/api-client-react";
import { MapPin, Users, Tractor, Plus, Loader2, Trash2, AlertTriangle, CheckCircle, XCircle, ChevronRight, PowerOff, Power } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

type Farm = {
  id: string;
  name: string;
  location: string;
  capacity: number;
  buildingsCount: number;
  activeBatchesCount: number;
  isActive?: boolean;
};

export default function Farms() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Farm | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { data: farmsData, isLoading, refetch } = useListFarms({ limit: 50 });
  const deleteMutation = useDeleteFarm();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({ farmId: deleteTarget.id });
      toast.success(`Ferme "${deleteTarget.name}" supprimée avec toutes ses données`);
      refetch();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggleActive = async (farm: Farm) => {
    setTogglingId(farm.id);
    try {
      const res = await fetch(`/api/farms/${farm.id}/toggle-active`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { isActive: boolean; message: string };
      toast.success(data.message);
      refetch();
    } catch {
      toast.error("Erreur lors du changement de statut");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl lg:text-3xl font-display font-bold text-slate-900">Fermes</h1>
          <p className="text-slate-500 mt-1">Gérez vos sites d'exploitation</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Ajouter
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {farmsData?.data.map((farm) => {
            const active = (farm as Farm).isActive !== false;
            const isToggling = togglingId === farm.id;
            return (
              <div
                key={farm.id}
                className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group relative ${
                  active ? "border-slate-200 hover:border-primary/30" : "border-slate-200 opacity-70"
                }`}
              >
                {/* Toggle active button */}
                <button
                  onClick={() => handleToggleActive(farm as Farm)}
                  disabled={isToggling}
                  className={`absolute top-4 right-20 p-2 rounded-xl transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 ${
                    active
                      ? "text-slate-300 hover:text-amber-500 hover:bg-amber-50"
                      : "text-slate-300 hover:text-emerald-500 hover:bg-emerald-50"
                  }`}
                  title={active ? "Désactiver la ferme" : "Activer la ferme"}
                >
                  {isToggling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : active ? (
                    <PowerOff className="w-4 h-4" />
                  ) : (
                    <Power className="w-4 h-4" />
                  )}
                </button>

                {/* Delete button */}
                <button
                  onClick={() => setDeleteTarget(farm as Farm)}
                  className="absolute top-4 right-12 p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="Supprimer la ferme"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Link href={`/farms/${farm.id}`} className="absolute top-4 right-4 p-2 rounded-xl text-slate-300 hover:text-primary hover:bg-emerald-50 transition-colors" title="Voir le détail">
                  <ChevronRight className="w-4 h-4" />
                </Link>

                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0 ${active ? "bg-emerald-50 text-primary" : "bg-slate-100 text-slate-400"}`}>
                    <Tractor className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 pr-24">{farm.name}</h3>
                    {active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 mt-1">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 mt-1">
                        <XCircle className="w-3 h-3" /> Désactivée
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {farm.location}
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <Users className="w-4 h-4 text-slate-400" />
                    Capacité: {farm.capacity.toLocaleString()}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{farm.buildingsCount}</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Bâtiments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">{farm.activeBatchesCount}</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Lots en cours</p>
                  </div>
                </div>
              </div>
            );
          })}
          {(!farmsData?.data || farmsData.data.length === 0) && (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Tractor className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Aucune ferme trouvée</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && <CreateFarmModal onClose={() => setIsModalOpen(false)} onSuccess={refetch} />}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Supprimer la ferme</h3>
                <p className="text-slate-600">
                  Vous êtes sur le point de supprimer <span className="font-bold text-slate-900">"{deleteTarget.name}"</span>.
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-red-700 mb-2">⚠ Cette action est irréversible et supprimera :</p>
              <ul className="text-sm text-red-600 space-y-1">
                <li>• Tous les <strong>{deleteTarget.buildingsCount}</strong> bâtiment(s)</li>
                <li>• Tous les lots / bandes rattachés</li>
                <li>• Tous les relevés journaliers et vétérinaires</li>
                <li>• Toutes les ventes et dépenses liées</li>
                <li>• Toutes les productions d'œufs</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
              <p className="text-sm text-amber-700">
                💡 <strong>Alternative :</strong> vous pouvez désactiver la ferme au lieu de la supprimer pour conserver toutes les données.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Suppression..." : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function CreateFarmModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: "", location: "", capacity: "" });
  const createMutation = useCreateFarm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          name: formData.name,
          location: formData.location,
          capacity: parseInt(formData.capacity, 10),
        },
      });
      toast.success("Ferme créée avec succès");
      onSuccess();
      onClose();
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Nouvelle Ferme</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom de la ferme</label>
            <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Localisation</label>
            <input required type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Capacité totale</label>
            <input required type="number" min="1" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">Annuler</button>
            <button type="submit" disabled={createMutation.isPending} className="px-6 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-white font-medium shadow-md shadow-primary/20 disabled:opacity-50">
              {createMutation.isPending ? "Création..." : "Créer la ferme"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
