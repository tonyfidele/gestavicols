import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useListCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@workspace/api-client-react";
import { Users, Plus, Loader2, Search, Phone, Mail, MapPin, Trash2, Building2, User, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

type CustomerType = "PARTICULIER" | "ENTREPRISE";

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  type: CustomerType;
}

interface CustomerRecord {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  type: CustomerType;
}

function CustomerModal({
  customer,
  onClose,
  onSuccess,
}: {
  customer: CustomerRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!customer;
  const [form, setForm] = useState<CustomerFormData>({
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    address: customer?.address ?? "",
    type: customer?.type ?? "PARTICULIER",
  });
  const { mutate: createCustomer, isPending: creating } = useCreateCustomer();
  const { mutate: updateCustomer, isPending: updating } = useUpdateCustomer();
  const isPending = creating || updating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      type: form.type,
    };
    if (isEdit && customer) {
      updateCustomer(
        { customerId: customer.id, data },
        {
          onSuccess: () => { toast.success("Client mis à jour"); onSuccess(); onClose(); },
          onError: () => toast.error("Erreur lors de la mise à jour"),
        }
      );
    } else {
      createCustomer(
        { data },
        {
          onSuccess: () => { toast.success("Client créé avec succès"); onSuccess(); onClose(); },
          onError: () => toast.error("Erreur lors de la création du client"),
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">
            {isEdit ? "Modifier le client" : "Nouveau Client"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type de client</label>
            <div className="flex gap-3">
              {(["PARTICULIER", "ENTREPRISE"] as CustomerType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                    form.type === t
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {t === "PARTICULIER" ? "Particulier" : "Entreprise"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Nom complet ou raison sociale"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="+223 XX XX XX XX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="email@exemple.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Adresse complète"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {isPending ? (isEdit ? "Mise à jour..." : "Création...") : isEdit ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Customers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<CustomerRecord | null>(null);
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const { data, isLoading, refetch } = useListCustomers({ search: search || undefined, limit: 100 });
  const { mutate: deleteCustomer } = useDeleteCustomer();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Supprimer le client "${name}" ?`)) return;
    deleteCustomer(
      { customerId: id },
      {
        onSuccess: () => { toast.success("Client supprimé"); refetch(); },
        onError: () => toast.error("Erreur lors de la suppression"),
      }
    );
  };

  const openCreate = () => { setEditCustomer(null); setIsModalOpen(true); };
  const openEdit = (c: CustomerRecord) => { setEditCustomer(c); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditCustomer(null); };

  const canEdit = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "COMPTABLE" || user?.role === "CHEF_FERME";
  const canDelete = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  return (
    <AppLayout>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl lg:text-3xl font-display font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 mt-1">Gestion de votre portefeuille clients</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Nouveau client
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data.map((customer) => (
            <div key={customer.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${customer.type === "ENTREPRISE" ? "bg-indigo-100" : "bg-emerald-100"}`}>
                    {customer.type === "ENTREPRISE" ? (
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <User className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{customer.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${customer.type === "ENTREPRISE" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {customer.type === "ENTREPRISE" ? "Entreprise" : "Particulier"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {canEdit && (
                    <button
                      onClick={() => openEdit(customer as CustomerRecord)}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(customer.id, customer.name)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {customer.phone}
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {customer.email}
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {customer.address}
                  </div>
                )}
              </div>
            </div>
          ))}
          {(!data?.data || data.data.length === 0) && (
            <div className="col-span-3 py-16 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Aucun client trouvé</p>
              <p className="text-slate-400 text-sm mt-1">Créez votre premier client pour commencer</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <CustomerModal
          customer={editCustomer}
          onClose={closeModal}
          onSuccess={refetch}
        />
      )}
    </AppLayout>
  );
}
