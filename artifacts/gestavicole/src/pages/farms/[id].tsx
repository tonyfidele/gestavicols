import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetFarm, useListBuildings, useCreateBuilding, useListBatches } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Building2, Plus, Loader2, Tractor, MapPin, Users, Layers, CheckCircle, XCircle, Trash2, PowerOff, Power } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function AddBuildingModal({ farmId, onClose, onSuccess }: { farmId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", type: "CHAIR", capacity: "" });
  const { mutate, isPending } = useCreateBuilding();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      { farmId, data: { name: form.name, type: form.type, capacity: parseInt(form.capacity, 10) } },
      {
        onSuccess: () => { toast.success("Bâtiment ajouté avec succès"); onSuccess(); onClose(); },
        onError: () => toast.error("Erreur lors de la création"),
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Nouveau Bâtiment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom du bâtiment</label>
            <input
              required type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Hangar A"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select
              value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
            >
              <option value="CHAIR">Chair</option>
              <option value="PONTE">Ponte</option>
              <option value="MIXTE">Mixte</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Capacité (têtes)</label>
            <input
              required type="number" min="1" value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              placeholder="Ex: 5000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">Annuler</button>
            <button type="submit" disabled={isPending} className="px-6 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-white font-medium shadow-md shadow-primary/20 disabled:opacity-50">
              {isPending ? "Création..." : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const typeLabel: Record<string, string> = { CHAIR: "Chair", PONTE: "Ponte", MIXTE: "Mixte" };
const typeColor: Record<string, string> = {
  CHAIR: "bg-orange-100 text-orange-700",
  PONTE: "bg-blue-100 text-blue-700",
  MIXTE: "bg-purple-100 text-purple-700",
};

export default function FarmDetail() {
  const { id } = useParams<{ id: string }>();
  const [isAddBuilding, setIsAddBuilding] = useState(false);

  const { data: farmData, isLoading: farmLoading, refetch: refetchFarm } = useGetFarm(id ?? "", { query: { enabled: !!id } });
  const { data: buildings, isLoading: bldLoading, refetch: refetchBld } = useListBuildings(id ?? "", { query: { enabled: !!id } });
  const { data: batchesData, isLoading: batchLoading } = useListBatches({ farmId: id, limit: 5 }, { query: { enabled: !!id } });

  const farm = farmData;
  const isActive = (farm as (typeof farmData & { isActive?: boolean }) | undefined)?.isActive !== false;
  const [isToggling, setIsToggling] = useState(false);

  const handleRefresh = () => { refetchFarm(); refetchBld(); };

  const handleToggleActive = async () => {
    if (!farm) return;
    setIsToggling(true);
    try {
      const res = await fetch(`/api/farms/${farm.id}/toggle-active`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { isActive: boolean; message: string };
      toast.success(data.message);
      refetchFarm();
    } catch {
      toast.error("Erreur lors du changement de statut");
    } finally {
      setIsToggling(false);
    }
  };

  if (farmLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  if (!farm) {
    return (
      <AppLayout>
        <div className="text-center py-24 text-slate-500">Ferme introuvable.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <Link href="/farms" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour aux fermes
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center flex-shrink-0">
                <Tractor className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-display font-bold text-slate-900">{farm.name}</h1>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle className="w-3 h-3" /> Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                      <XCircle className="w-3 h-3" /> Inactif
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{farm.location}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />Capacité: {farm.capacity.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-slate-800">{farm.buildingsCount}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Bâtiments</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-600">{farm.activeBatchesCount}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Lots en cours</p>
                </div>
              </div>
              <button
                onClick={handleToggleActive}
                disabled={isToggling}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 ${
                  isActive
                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                }`}
                title={isActive ? "Désactiver la ferme" : "Activer la ferme"}
              >
                {isToggling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isActive ? (
                  <PowerOff className="w-4 h-4" />
                ) : (
                  <Power className="w-4 h-4" />
                )}
                {isActive ? "Désactiver" : "Activer"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-400" />
                <h2 className="font-bold text-slate-900">Bâtiments</h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{buildings?.data.length ?? 0}</span>
              </div>
              <button
                onClick={() => setIsAddBuilding(true)}
                className="flex items-center gap-1.5 text-sm bg-primary hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>

            {bldLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : !buildings?.data.length ? (
              <div className="py-16 text-center text-slate-400">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Aucun bâtiment enregistré</p>
                <button onClick={() => setIsAddBuilding(true)} className="mt-2 text-primary text-sm hover:underline">+ Ajouter le premier bâtiment</button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {buildings.data.map((b) => {
                  const pct = b.capacity > 0 ? Math.min(100, Math.round((b.currentOccupancy / b.capacity) * 100)) : 0;
                  return (
                    <div key={b.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{b.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[b.type] ?? "bg-slate-100 text-slate-600"}`}>
                            {typeLabel[b.type] ?? b.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{b.currentOccupancy.toLocaleString()} / {b.capacity.toLocaleString()}</p>
                        <div className="w-28 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct > 80 ? "bg-red-400" : pct > 50 ? "bg-amber-400" : "bg-emerald-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{pct}% occupé</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-slate-400" />
                <h2 className="font-bold text-slate-900">Lots récents</h2>
              </div>
              <Link href={`/batches?farmId=${id}`} className="text-xs text-primary hover:underline">Voir tout</Link>
            </div>
            {batchLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : !batchesData?.data.length ? (
              <div className="py-10 text-center text-slate-400">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun lot</p>
                <Link href="/batches" className="mt-1 text-xs text-primary hover:underline block">+ Créer un lot</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {batchesData.data.map((b) => (
                  <Link key={b.id} href={`/batches/${b.id}`} className="block px-6 py-3 hover:bg-slate-50 transition-colors">
                    <p className="font-medium text-slate-900 text-sm">{b.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        b.status === "ACTIF" ? "bg-emerald-100 text-emerald-700" :
                        b.status === "EN_ATTENTE" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>{b.status === "EN_ATTENTE" ? "En attente" : b.status === "ACTIF" ? "Actif" : "Terminé"}</span>
                      <span className="text-xs text-slate-400">{b.currentCount.toLocaleString()} têtes</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isAddBuilding && (
        <AddBuildingModal farmId={id ?? ""} onClose={() => setIsAddBuilding(false)} onSuccess={handleRefresh} />
      )}
    </AppLayout>
  );
}
