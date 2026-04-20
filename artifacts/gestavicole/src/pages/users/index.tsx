import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useListUsers, useCreateUser, useDeleteUser, useToggleUserActive } from "@workspace/api-client-react";
import { Plus, Users as UsersIcon, Loader2, Trash2, PowerOff, Power, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const ROLES = ["ADMIN", "CHEF_FERME", "OUVRIER", "VETERINAIRE", "COMPTABLE"];

const getRoleColor = (role: string) => {
  switch (role) {
    case "SUPER_ADMIN": return "bg-red-100 text-red-700 border-red-200";
    case "ADMIN": return "bg-purple-100 text-purple-700 border-purple-200";
    case "CHEF_FERME": return "bg-blue-100 text-blue-700 border-blue-200";
    case "OUVRIER": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "VETERINAIRE": return "bg-cyan-100 text-cyan-700 border-cyan-200";
    case "COMPTABLE": return "bg-orange-100 text-orange-700 border-orange-200";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case "SUPER_ADMIN": return "Super Admin";
    case "ADMIN": return "Administrateur";
    case "CHEF_FERME": return "Chef de ferme";
    case "OUVRIER": return "Ouvrier";
    case "VETERINAIRE": return "Vétérinaire";
    case "COMPTABLE": return "Comptable";
    default: return role;
  }
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string | Date;
};

export default function Users() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const { data: usersData, isLoading, refetch } = useListUsers({ limit: 50 });
  const deleteMutation = useDeleteUser();
  const toggleMutation = useToggleUserActive();
  const { user: currentUser } = useAuth();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({ userId: deleteTarget.id });
      toast.success(`Utilisateur "${deleteTarget.name}" supprimé`);
      refetch();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggleActive = async (user: UserRow) => {
    try {
      await toggleMutation.mutateAsync({ userId: user.id });
      toast.success(user.isActive ? `${user.name} désactivé` : `${user.name} activé`);
      refetch();
    } catch {
      toast.error("Erreur lors de la modification");
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl lg:text-3xl font-display font-bold text-slate-900">Utilisateurs</h1>
          <p className="text-slate-500 mt-1">Gestion des accès et des rôles</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Ajouter utilisateur
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
                  <th className="px-6 py-4 font-semibold">Utilisateur</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Rôle</th>
                  <th className="px-6 py-4 font-semibold">Statut</th>
                  <th className="px-6 py-4 font-semibold">Membre depuis</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersData?.data.map((user) => {
                  const isSelf = user.id === currentUser?.userId;
                  return (
                    <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${!user.isActive ? "opacity-60" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${user.isActive ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"}`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            {isSelf && <p className="text-xs text-primary font-medium">Vous</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${user.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                          {user.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {format(new Date(user.createdAt), "dd MMM yyyy", { locale: fr })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isSelf && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleActive(user as UserRow)}
                              disabled={toggleMutation.isPending}
                              title={user.isActive ? "Désactiver" : "Activer"}
                              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                user.isActive
                                  ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              }`}
                            >
                              {user.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setDeleteTarget(user as UserRow)}
                              disabled={deleteMutation.isPending}
                              title="Supprimer"
                              className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {(!usersData?.data || usersData.data.length === 0) && (
            <div className="py-16 text-center">
              <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && <CreateUserModal onClose={() => setIsModalOpen(false)} onSuccess={refetch} />}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-11 h-11 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Supprimer l'utilisateur</h3>
                <p className="text-slate-600 text-sm">
                  Voulez-vous vraiment supprimer <span className="font-bold text-slate-900">{deleteTarget.name}</span> ? Cette action est irréversible.
                </p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-700">
                💡 Si vous souhaitez empêcher l'accès temporairement, préférez la <strong>désactivation</strong> plutôt que la suppression.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm">Annuler</button>
              <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium text-sm disabled:opacity-50">
                {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "CHEF_FERME" });
  const createMutation = useCreateUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role as "ADMIN" | "CHEF_FERME" | "OUVRIER" | "VETERINAIRE" | "COMPTABLE" | "SUPER_ADMIN",
        },
      });
      toast.success("Utilisateur créé avec succès");
      onSuccess();
      onClose();
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Nouvel Utilisateur</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
            <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Ex: Jean Dupont" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Adresse Email</label>
            <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="jean.dupont@exemple.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
            <input required type="password" minLength={8} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Minimum 8 caractères" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
            <select required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              {ROLES.map((r) => (
                <option key={r} value={r}>{getRoleLabel(r)}</option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">Annuler</button>
            <button type="submit" disabled={createMutation.isPending} className="px-6 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-white font-medium shadow-md shadow-primary/20 disabled:opacity-50">
              {createMutation.isPending ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
