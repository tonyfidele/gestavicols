import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth, hasRole } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Tractor, 
  Layers, 
  DollarSign, 
  Package, 
  CreditCard, 
  Users, 
  ShieldAlert,
  LogOut,
  Stethoscope,
  UserCheck,
  BarChart3,
  UsersRound,
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navGroups = [
    {
      label: "Exploitation",
      items: [
        { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "ADMIN", "CHEF_FERME", "COMPTABLE"] },
        { name: "Fermes", href: "/farms", icon: Tractor, roles: ["SUPER_ADMIN", "ADMIN", "CHEF_FERME"] },
        { name: "Lots (Bandes)", href: "/batches", icon: Layers, roles: ["SUPER_ADMIN", "ADMIN", "CHEF_FERME", "OUVRIER", "VETERINAIRE"] },
      ],
    },
    {
      label: "Production & Ventes",
      items: [
        { name: "Ventes", href: "/sales", icon: DollarSign, roles: ["SUPER_ADMIN", "ADMIN", "COMPTABLE", "CHEF_FERME"] },
        { name: "Clients", href: "/customers", icon: UsersRound, roles: ["SUPER_ADMIN", "ADMIN", "COMPTABLE", "CHEF_FERME"] },
        { name: "Stock", href: "/stock", icon: Package, roles: ["SUPER_ADMIN", "ADMIN", "CHEF_FERME"] },
      ],
    },
    {
      label: "Finances & RH",
      items: [
        { name: "Dépenses", href: "/expenses", icon: CreditCard, roles: ["SUPER_ADMIN", "ADMIN", "COMPTABLE"] },
        { name: "RH & Salaires", href: "/hr", icon: UserCheck, roles: ["SUPER_ADMIN", "ADMIN", "COMPTABLE"] },
        { name: "Analytics", href: "/analytics", icon: BarChart3, roles: ["SUPER_ADMIN", "ADMIN", "COMPTABLE"] },
      ],
    },
    {
      label: "Santé & Admin",
      items: [
        { name: "Vétérinaire", href: "/veterinary", icon: Stethoscope, roles: ["SUPER_ADMIN", "ADMIN", "CHEF_FERME", "VETERINAIRE"] },
        { name: "Utilisateurs", href: "/users", icon: Users, roles: ["SUPER_ADMIN", "ADMIN"] },
        { name: "Audit", href: "/audit", icon: ShieldAlert, roles: ["SUPER_ADMIN", "ADMIN"] },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col fixed left-0 top-0 z-40">
      <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
        <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Gestavicole" className="w-8 h-8 rounded-lg shadow-sm" />
        <span className="font-display font-bold text-xl tracking-tight text-primary">GESTAVICOLE</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(item => hasRole(user, item.roles));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-3">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                  return (
                    <Link key={item.href} href={item.href} className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}>
                      <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
          <p className="text-sm font-bold text-foreground truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <span className="mt-1.5 inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
