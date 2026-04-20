import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useListAuditLogs, useClearAuditLogs } from "@workspace/api-client-react";
import { ShieldAlert, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const getActionColor = (action: string) => {
  if (action.includes("CREATE")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (action.includes("UPDATE")) return "bg-blue-100 text-blue-700 border-blue-200";
  if (action.includes("DELETE")) return "bg-red-100 text-red-700 border-red-200";
  if (action.includes("LOGIN")) return "bg-purple-100 text-purple-700 border-purple-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const getEntityLabel = (entity: string) => {
  const labels: Record<string, string> = {
    FARM: "Ferme", BATCH: "Lot", SALE: "Vente", STOCK: "Stock",
    EXPENSE: "Dépense", USER: "Utilisateur", BUILDING: "Bâtiment",
    DAILY_RECORD: "Enregistrement", VET_RECORD: "Fiche vétérinaire", AUTH: "Authentification",
  };
  return labels[entity] || entity;
};

export default function Audit() {
  const [showConfirm, setShowConfirm] = useState(false);
  const { data: auditData, isLoading, refetch } = useListAuditLogs({ limit: 50 });
  const { mutate: clearLogs, isPending: isClearing } = useClearAuditLogs();

  const handleClear = () => {
    clearLogs(undefined, {
      onSuccess: () => {
        toast.success("Journal d'audit vidé avec succès");
        setShowConfirm(false);
        refetch();
      },
      onError: () => {
        toast.error("Erreur lors de la suppression du journal");
        setShowConfirm(false);
      },
    });
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl lg:text-xl lg:text-3xl font-display font-bold text-slate-900">Journal d'audit</h1>
          <p className="text-slate-500 mt-1">Historique de toutes les actions sensibles</p>
        </div>
        {(auditData?.total ?? 0) > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm border border-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Vider le journal
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Total événements</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{auditData?.total || 0}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Date & Heure</th>
                <th className="px-6 py-4 font-semibold">Utilisateur</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Entité</th>
                <th className="px-6 py-4 font-semibold">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditData?.data.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm">
                    <p className="font-medium text-slate-900">{format(new Date(log.createdAt), "dd MMM yyyy", { locale: fr })}</p>
                    <p className="text-slate-500">{format(new Date(log.createdAt), "HH:mm:ss")}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {(log.userName || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{log.userName || "Système"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {getEntityLabel(log.entity)}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                    {log.entityId ? `ID: ${log.entityId.slice(0, 8)}...` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!auditData?.data || auditData.data.length === 0) && (
            <div className="py-16 text-center">
              <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Aucun événement dans le journal d'audit</p>
            </div>
          )}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Vider le journal d'audit</h3>
                <p className="text-slate-600 text-sm">
                  Cette action supprimera définitivement les <strong>{auditData?.total}</strong> enregistrement(s) du journal. Elle est irréversible.
                </p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
              <p className="text-sm text-red-700 font-medium">⚠ Toutes les traces d'activité seront perdues.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleClear}
                disabled={isClearing}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
              >
                {isClearing ? "Suppression..." : "Vider définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
