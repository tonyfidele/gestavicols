import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  useGetBatch,
  useListDailyRecords,
  useCreateDailyRecord,
  useListVeterinaryRecords,
  useCreateVeterinaryRecord,
  useUpdateBatch,
} from "@workspace/api-client-react";
import { Loader2, ArrowLeft, Layers, Activity, Egg, Droplets, Thermometer, Plus, Syringe, Pill, Calendar, SkullIcon, XCircle, CheckCircle2, Pencil } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/lib/auth-context";

function AddDailyRecordModal({ batchId, onClose, onSuccess }: { batchId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    mortality: 0,
    feedConsumption: 0,
    waterConsumption: 0,
    eggsCollected: undefined as number | undefined,
    averageWeight: undefined as number | undefined,
    temperature: undefined as number | undefined,
    notes: "",
  });
  const { mutate: createRecord, isPending } = useCreateDailyRecord();
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRecord(
      {
        batchId,
        data: {
          date: form.date,
          mortality: form.mortality,
          feedConsumption: form.feedConsumption,
          waterConsumption: form.waterConsumption,
          eggsCollected: form.eggsCollected,
          averageWeight: form.averageWeight,
          temperature: form.temperature,
          notes: form.notes || undefined,
          recordedBy: user!.id,
        },
      },
      {
        onSuccess: () => { toast.success("Relevé journalier enregistré"); onSuccess(); onClose(); },
        onError: () => toast.error("Erreur lors de l'enregistrement"),
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Relevé Journalier</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
            <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mortalité</label>
              <input type="number" min="0" value={form.mortality} onChange={(e) => setForm({ ...form, mortality: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Température (°C)</label>
              <input type="number" step="0.1" value={form.temperature ?? ""} onChange={(e) => setForm({ ...form, temperature: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="ex: 25.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Aliment consommé (kg)</label>
              <input type="number" min="0" step="0.1" value={form.feedConsumption} onChange={(e) => setForm({ ...form, feedConsumption: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Eau consommée (L)</label>
              <input type="number" min="0" step="0.1" value={form.waterConsumption} onChange={(e) => setForm({ ...form, waterConsumption: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Œufs collectés</label>
              <input type="number" min="0" value={form.eggsCollected ?? ""} onChange={(e) => setForm({ ...form, eggsCollected: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Pour pondeuses" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Poids moyen (kg)</label>
              <input type="number" min="0" step="0.01" value={form.averageWeight ?? ""} onChange={(e) => setForm({ ...form, averageWeight: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Pour chair" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Observations..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Annuler</button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50">
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickMortalityModal({ batchId, onClose, onSuccess }: { batchId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    mortality: 1,
    notes: "",
  });
  const { mutate: createRecord, isPending } = useCreateDailyRecord();
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.mortality <= 0) { toast.error("Veuillez saisir un nombre de mortalités supérieur à 0"); return; }
    createRecord(
      {
        batchId,
        data: {
          date: form.date,
          mortality: form.mortality,
          feedConsumption: 0,
          waterConsumption: 0,
          notes: form.notes || undefined,
          recordedBy: user!.id,
        },
      },
      {
        onSuccess: () => { toast.success(`${form.mortality} mortalité(s) enregistrée(s)`); onSuccess(); onClose(); },
        onError: () => toast.error("Erreur lors de l'enregistrement"),
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <SkullIcon className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Enregistrer mortalité</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de morts</label>
            <input type="number" required min="1" value={form.mortality} onChange={(e) => setForm({ ...form, mortality: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 text-center text-2xl font-bold text-red-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cause / Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200" placeholder="Cause suspectée..." />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">Annuler</button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddVetRecordModal({ batchId, onClose, onSuccess }: { batchId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "VACCIN",
    description: "",
    treatment: "",
    medication: "",
    dosage: "",
    nextVisit: "",
    veterinarianName: "",
  });
  const { mutate: createRecord, isPending } = useCreateVeterinaryRecord();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRecord(
      {
        batchId,
        data: {
          date: form.date,
          type: form.type,
          description: form.description,
          treatment: form.treatment || undefined,
          medication: form.medication || undefined,
          dosage: form.dosage || undefined,
          nextVisit: form.nextVisit || undefined,
          veterinarianName: form.veterinarianName,
        },
      },
      {
        onSuccess: () => { toast.success("Enregistrement vétérinaire créé"); onSuccess(); onClose(); },
        onError: () => toast.error("Erreur lors de la création"),
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
              <Syringe className="w-4 h-4 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Nouvel Enregistrement Vétérinaire</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="VACCIN">Vaccination</option>
                <option value="TRAITEMENT">Traitement</option>
                <option value="CONTROLE">Contrôle sanitaire</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Description de l'intervention..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Médicament</label>
              <input type="text" value={form.medication} onChange={(e) => setForm({ ...form, medication: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Nom du produit" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dosage</label>
              <input type="text" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="ex: 1ml/10kg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Traitement prescrit</label>
            <input type="text" value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Description du traitement" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prochain contrôle</label>
              <input type="date" value={form.nextVisit} onChange={(e) => setForm({ ...form, nextVisit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vétérinaire *</label>
              <input type="text" required value={form.veterinarianName} onChange={(e) => setForm({ ...form, veterinarianName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Nom du vétérinaire" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Annuler</button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50">
              {isPending ? "Création..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TerminateBatchModal({ batchId, batchName, onClose, onSuccess }: { batchId: string; batchName: string; onClose: () => void; onSuccess: () => void }) {
  const updateMutation = useUpdateBatch();

  const handleConfirm = async () => {
    try {
      await updateMutation.mutateAsync({
        batchId,
        data: {
          status: "TERMINE" as any,
          endDate: new Date().toISOString(),
        },
      });
      toast.success("Bande clôturée avec succès");
      onSuccess();
      onClose();
    } catch {
      toast.error("Erreur lors de la clôture");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <XCircle className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Clôturer la bande</h2>
        </div>
        <p className="text-slate-600 mb-2">
          Vous êtes sur le point de clôturer la bande <span className="font-bold text-slate-900">"{batchName}"</span>.
        </p>
        <p className="text-sm text-slate-500 mb-6">
          Le statut passera à <span className="font-semibold text-slate-700">Terminé</span> et la date de clôture sera enregistrée à aujourd'hui. Vous pourrez toujours consulter l'historique.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">Annuler</button>
          <button onClick={handleConfirm} disabled={updateMutation.isPending} className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
            {updateMutation.isPending ? "Clôture..." : "Confirmer la clôture"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [isMortalityModalOpen, setIsMortalityModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [isVetModalOpen, setIsVetModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"daily" | "vet">("daily");

  const {
    data: batchData,
    isLoading: batchLoading,
    isError: batchError,
    refetch: refetchBatch,
  } = useGetBatch(id ?? "", { query: { enabled: !!id } });

  const { data: dailyRecords, refetch: refetchDaily, isLoading: dailyLoading } = useListDailyRecords(id ?? "", { limit: 30 }, { query: { enabled: !!id } });
  const { data: vetRecords, refetch: refetchVet, isLoading: vetLoading } = useListVeterinaryRecords(id ?? "", { query: { enabled: !!id } });

  const batch = batchData;

  const chartData = (dailyRecords?.data ?? []).slice().reverse().map((r) => ({
    date: format(new Date(r.date), "dd/MM"),
    mortalité: r.mortality,
    aliment: r.feedConsumption,
    œufs: r.eggsCollected ?? 0,
    temp: r.temperature ?? 0,
  }));

  const handleRefreshAll = () => {
    refetchBatch();
    refetchDaily();
    refetchVet();
  };

  if (!id) {
    return (
      <AppLayout>
        <div className="text-center py-24">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Identifiant de bande manquant</p>
          <Link href="/batches" className="text-primary hover:underline text-sm mt-2 inline-block">← Retour aux lots</Link>
        </div>
      </AppLayout>
    );
  }

  if (batchLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  if (batchError || !batch) {
    return (
      <AppLayout>
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Bande introuvable</h2>
          <p className="text-slate-500 mb-4">Cette bande n'existe pas ou vous n'avez pas les permissions pour y accéder.</p>
          <Link href="/batches" className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Retour aux lots
          </Link>
        </div>
      </AppLayout>
    );
  }

  const statusColor = batch.status === "ACTIF" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : batch.status === "TERMINE" ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-amber-100 text-amber-700 border-amber-200";
  const statusLabel = batch.status === "ACTIF" ? "Actif" : batch.status === "TERMINE" ? "Terminé" : "En attente";
  const isActive = batch.status === "ACTIF";
  const isPending = batch.status === "EN_ATTENTE";

  return (
    <AppLayout>
      <div className="mb-6">
        <Link href="/batches" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour aux lots
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Layers className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900">{batch.name}</h1>
              <p className="text-slate-500">{batch.farmName} · {batch.species}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>{statusLabel}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(isActive || isPending) && (
              <button
                onClick={() => setIsMortalityModalOpen(true)}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-medium transition-all text-sm"
              >
                <SkullIcon className="w-4 h-4" /> Mortalité
              </button>
            )}
            {isActive && (
              <>
                <button
                  onClick={() => setIsDailyModalOpen(true)}
                  className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all text-sm"
                >
                  <Plus className="w-4 h-4" /> Relevé du jour
                </button>
                <button
                  onClick={() => setIsTerminateModalOpen(true)}
                  className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2.5 rounded-xl font-medium transition-all text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Clôturer la bande
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Effectif actuel</p>
          <p className="text-2xl font-bold text-slate-900">{batch.currentCount.toLocaleString()}</p>
          <p className="text-xs text-slate-400">sur {batch.initialCount.toLocaleString()} initiaux</p>
        </div>
        <div className={`rounded-2xl border p-5 ${batch.mortalityRate > 5 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Taux mortalité</p>
          <p className={`text-2xl font-bold ${batch.mortalityRate > 5 ? "text-red-600" : "text-emerald-600"}`}>{batch.mortalityRate}%</p>
          <p className="text-xs text-slate-400">{batch.mortalityRate > 5 ? "⚠ Élevé" : "✓ Normal"}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Relevés journaliers</p>
          <p className="text-2xl font-bold text-slate-900">{dailyRecords?.total ?? 0}</p>
          <p className="text-xs text-slate-400">enregistrements</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Suivi vétérinaire</p>
          <p className="text-2xl font-bold text-slate-900">{vetRecords?.total ?? 0}</p>
          <p className="text-xs text-slate-400">interventions</p>
        </div>
      </div>

      {batch.status === "TERMINE" && batch.endDate && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-slate-500 shrink-0" />
          <div>
            <p className="font-semibold text-slate-700">Bande clôturée</p>
            <p className="text-sm text-slate-500">Exercice terminé le {format(new Date(batch.endDate), "dd MMMM yyyy", { locale: fr })}</p>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Évolution mortalité (30 derniers relevés)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip />
              <Line type="monotone" dataKey="mortalité" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("daily")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "daily" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Relevés journaliers ({dailyRecords?.total ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("vet")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "vet" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Suivi vétérinaire ({vetRecords?.total ?? 0})
        </button>
      </div>

      {activeTab === "daily" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {dailyLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : dailyRecords?.data.length === 0 ? (
            <div className="py-12 text-center">
              <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Aucun relevé journalier</p>
              {(isActive || isPending) && (
                <button onClick={() => setIsDailyModalOpen(true)} className="mt-3 text-primary text-sm hover:underline">+ Ajouter le premier relevé</button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Mortalité</th>
                    <th className="px-5 py-3 font-semibold">Aliment (kg)</th>
                    <th className="px-5 py-3 font-semibold">Eau (L)</th>
                    <th className="px-5 py-3 font-semibold">Œufs</th>
                    <th className="px-5 py-3 font-semibold">Poids moy.</th>
                    <th className="px-5 py-3 font-semibold">Temp. (°C)</th>
                    <th className="px-5 py-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyRecords?.data.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 text-sm">
                      <td className="px-5 py-3 font-medium text-slate-900">{format(new Date(r.date), "dd MMM yyyy", { locale: fr })}</td>
                      <td className="px-5 py-3">
                        <span className={`font-bold ${r.mortality > 0 ? "text-red-600" : "text-slate-400"}`}>{r.mortality}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{r.feedConsumption} kg</td>
                      <td className="px-5 py-3 text-slate-600">{r.waterConsumption} L</td>
                      <td className="px-5 py-3 text-slate-600">{r.eggsCollected ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-600">{r.averageWeight ? `${r.averageWeight} kg` : "—"}</td>
                      <td className="px-5 py-3 text-slate-600">{r.temperature ? `${r.temperature}°C` : "—"}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs max-w-xs truncate">{r.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "vet" && (
        <div className="space-y-3">
          {(isActive || isPending) && (
            <div className="flex justify-end">
              <button
                onClick={() => setIsVetModalOpen(true)}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Ajouter un suivi vétérinaire
              </button>
            </div>
          )}
          {vetLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : vetRecords?.data.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
              <Syringe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Aucun enregistrement vétérinaire</p>
              {(isActive || isPending) && (
                <button onClick={() => setIsVetModalOpen(true)} className="mt-3 text-teal-600 text-sm hover:underline">+ Ajouter le premier enregistrement</button>
              )}
            </div>
          ) : (
            vetRecords?.data.map((record) => (
              <div key={record.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {record.type === "VACCIN" ? <Syringe className="w-5 h-5 text-blue-500 mt-0.5" /> : <Pill className="w-5 h-5 text-orange-500 mt-0.5" />}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${record.type === "VACCIN" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>{record.type}</span>
                        <span className="text-xs text-slate-400">{format(new Date(record.date), "dd MMM yyyy", { locale: fr })}</span>
                      </div>
                      <p className="font-semibold text-slate-900">{record.description}</p>
                      {record.medication && <p className="text-sm text-slate-500 mt-0.5">{record.medication} {record.dosage && `— ${record.dosage}`}</p>}
                      <p className="text-sm text-slate-400 mt-1">Dr. {record.veterinarianName}</p>
                    </div>
                  </div>
                  {record.nextVisit && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                      <Calendar className="w-3 h-3" /> Rappel: {format(new Date(record.nextVisit), "dd/MM/yyyy")}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isDailyModalOpen && <AddDailyRecordModal batchId={id ?? ""} onClose={() => setIsDailyModalOpen(false)} onSuccess={handleRefreshAll} />}
      {isMortalityModalOpen && <QuickMortalityModal batchId={id ?? ""} onClose={() => setIsMortalityModalOpen(false)} onSuccess={handleRefreshAll} />}
      {isVetModalOpen && <AddVetRecordModal batchId={id ?? ""} onClose={() => setIsVetModalOpen(false)} onSuccess={() => { refetchVet(); refetchBatch(); }} />}
      {isTerminateModalOpen && batch && (
        <TerminateBatchModal
          batchId={id ?? ""}
          batchName={batch.name}
          onClose={() => setIsTerminateModalOpen(false)}
          onSuccess={() => { refetchBatch(); }}
        />
      )}
    </AppLayout>
  );
}
