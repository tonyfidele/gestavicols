import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useListBatches, useListVeterinaryRecords, useCreateVeterinaryRecord } from "@workspace/api-client-react";
import { Stethoscope, Plus, Loader2, Calendar, Syringe, Pill, AlertCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function CreateVetRecordModal({ batchId, onClose, onSuccess }: { batchId: string; onClose: () => void; onSuccess: () => void }) {
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
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Nouvel Enregistrement Vétérinaire</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50">
              {isPending ? "Création..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BatchVetRecords({ batchId, batchName }: { batchId: string; batchName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, refetch } = useListVeterinaryRecords(batchId, { query: { enabled: isOpen } });

  const typeIcon = (type: string) => {
    if (type === "VACCIN") return <Syringe className="w-4 h-4 text-blue-500" />;
    if (type === "TRAITEMENT") return <Pill className="w-4 h-4 text-orange-500" />;
    return <Stethoscope className="w-4 h-4 text-emerald-500" />;
  };

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      VACCIN: "bg-blue-100 text-blue-700",
      TRAITEMENT: "bg-orange-100 text-orange-700",
      CONTROLE: "bg-emerald-100 text-emerald-700",
      AUTRE: "bg-slate-100 text-slate-700",
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[type] ?? "bg-slate-100 text-slate-700"}`}>{type}</span>;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Stethoscope className="w-5 h-5 text-teal-500" />
          <span className="font-semibold text-slate-900">{batchName}</span>
          {data && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{data.total} enregistrements</span>}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="border-t border-slate-100">
          <div className="p-4 flex justify-end">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-emerald-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
          {data?.data.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun enregistrement vétérinaire</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data?.data.map((record) => (
                <div key={record.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{typeIcon(record.type)}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {typeBadge(record.type)}
                          <span className="text-xs text-slate-400">
                            {format(new Date(record.date), "dd MMM yyyy", { locale: fr })}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900">{record.description}</p>
                        {record.medication && <p className="text-xs text-slate-500 mt-0.5">Médicament: {record.medication} {record.dosage && `· Dose: ${record.dosage}`}</p>}
                        {record.treatment && <p className="text-xs text-slate-500">Traitement: {record.treatment}</p>}
                        <p className="text-xs text-slate-400 mt-1">Dr. {record.veterinarianName}</p>
                      </div>
                    </div>
                    {record.nextVisit && (
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                          <Calendar className="w-3 h-3" />
                          Prochain: {format(new Date(record.nextVisit), "dd/MM/yyyy")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {isModalOpen && <CreateVetRecordModal batchId={batchId} onClose={() => setIsModalOpen(false)} onSuccess={refetch} />}
    </div>
  );
}

export default function Veterinary() {
  const { data: batchesData, isLoading } = useListBatches({ status: "ACTIF", limit: 50 });

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Module Vétérinaire</h1>
          <p className="text-slate-500 mt-1">Suivi sanitaire et protocoles vaccinaux de vos bandes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-5 text-white">
          <Stethoscope className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{batchesData?.total ?? 0}</p>
          <p className="text-teal-100 text-sm mt-1">Bandes actives sous surveillance</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Syringe className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-slate-600">Vaccinations</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">Actif</p>
          <p className="text-xs text-slate-400 mt-1">Registre obligatoire tenu</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-slate-600">Alertes</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">0</p>
          <p className="text-xs text-slate-400 mt-1">Rappels en attente</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Historique par bande active</h2>
          {batchesData?.data.map((batch) => (
            <BatchVetRecords key={batch.id} batchId={batch.id} batchName={`${batch.name} — ${batch.farmName}`} />
          ))}
          {(!batchesData?.data || batchesData.data.length === 0) && (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
              <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Aucune bande active</p>
              <p className="text-slate-400 text-sm mt-1">Créez une bande pour suivre le dossier vétérinaire</p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
