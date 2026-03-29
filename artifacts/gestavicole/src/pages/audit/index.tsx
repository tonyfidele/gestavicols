import React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useListAuditLogs } from "@workspace/api-client-react";
import { ShieldAlert, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  const { data: auditData, isLoading } = useListAuditLogs({ limit: 50 });

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900">Journal d'audit</h1>
        <p className="text-slate-500 mt-1">Historique de toutes les actions sensibles</p>
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
    </AppLayout>
  );
}
