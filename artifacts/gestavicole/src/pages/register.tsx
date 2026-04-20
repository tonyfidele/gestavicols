import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({ farmName: "", adminName: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);
    try {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmName: form.farmName,
          adminName: form.adminName,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erreur lors de l'inscription");
        return;
      }

      login(data.token);
      setLocation("/dashboard");
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    "Gestion complète de vos lots de volailles",
    "Suivi de production d'œufs automatisé",
    "Rapports et analytics en temps réel",
    "Multi-utilisateurs avec rôles et permissions",
  ];

  return (
    <div className="min-h-screen w-full flex bg-white">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-emerald-800 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-10 h-10 rounded-xl shadow-lg" />
            <span className="font-display font-bold text-2xl text-white">GESTAVICOLE</span>
          </div>
          <h2 className="text-4xl font-display font-bold text-white mb-4 leading-tight">
            Commencez à gérer votre ferme intelligemment
          </h2>
          <p className="text-emerald-100 text-lg mb-10">
            Rejoignez les éleveurs qui font confiance à GESTAVICOLE pour piloter leur exploitation avicole.
          </p>
          <div className="space-y-4">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-300 mt-0.5 shrink-0" />
                <span className="text-emerald-50 text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
          <p className="text-white text-sm italic leading-relaxed">
            "GESTAVICOLE nous a permis de passer de carnets papier à un suivi digital complet. Nos résultats ont été nettement améliorés."
          </p>
          <p className="text-emerald-200 text-xs mt-3 font-medium">— Chef d'exploitation, Bamako, Mali</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-8 h-8 rounded-lg" />
            <span className="font-display font-bold text-lg text-emerald-700">GESTAVICOLE</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900">Créer votre compte</h1>
            <p className="text-slate-500 mt-1 text-sm">Inscription gratuite · Accès immédiat</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom de votre ferme / exploitation *</label>
              <input
                type="text"
                required
                placeholder="Ex: Ferme Avicole Coulibaly"
                value={form.farmName}
                onChange={e => setForm({ ...form, farmName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Votre nom complet *</label>
              <input
                type="text"
                required
                placeholder="Ex: Amadou Coulibaly"
                value={form.adminName}
                onChange={e => setForm({ ...form, adminName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adresse email *</label>
              <input
                type="email"
                required
                placeholder="vous@exemple.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Minimum 6 caractères"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm pr-11"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer le mot de passe *</label>
              <input
                type="password"
                required
                placeholder="Répétez votre mot de passe"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Création en cours…</> : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Se connecter
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed">
            En créant un compte, vous acceptez les conditions d'utilisation de GESTAVICOLE.
          </p>
        </div>
      </div>
    </div>
  );
}
