import React from "react";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "./sidebar";
import { Redirect } from "wouter";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-w-0">
        <div className="h-16 border-b border-border bg-white flex items-center px-8 sticky top-0 z-30 shadow-sm shadow-black/5">
          <h1 className="font-display font-semibold text-lg text-slate-800">
            {user.tenantName || "Espace de travail"}
          </h1>
        </div>
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
