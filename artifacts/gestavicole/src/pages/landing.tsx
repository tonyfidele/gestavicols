import React from "react";
import { Link } from "wouter";
import {
  LayoutDashboard, Layers, Package, DollarSign, BarChart3,
  Stethoscope, Egg, Users, CheckCircle2, ArrowRight, Tractor,
  ShieldCheck, Globe, Zap
} from "lucide-react";

const FEATURES = [
  { icon: LayoutDashboard, title: "Tableau de bord", desc: "Vue d'ensemble en temps réel de toutes vos fermes et indicateurs clés." },
  { icon: Layers, title: "Gestion des Lots", desc: "Suivez chaque bande de volailles de l'entrée à la sortie avec historique complet." },
  { icon: Egg, title: "Production d'Œufs", desc: "Enregistrez la collecte, les casses, les ventes et calculez le montant caisse automatiquement." },
  { icon: Package, title: "Gestion du Stock", desc: "Gérez aliments, médicaments et équipements avec alertes de rupture de stock." },
  { icon: DollarSign, title: "Ventes & Clients", desc: "Facturez vos clients, suivez les paiements et analysez vos revenus." },
  { icon: Stethoscope, title: "Module Vétérinaire", desc: "Carnet sanitaire digital, vaccinations, traitements et bilans de santé." },
  { icon: BarChart3, title: "Analytics & Rapports", desc: "Rapports PDF détaillés, graphiques et analyses de performance par ferme." },
  { icon: Users, title: "Multi-utilisateurs", desc: "Gérez vos équipes avec des rôles : Admin, Chef de ferme, Ouvrier, Vétérinaire…" },
];

const STATS = [
  { value: "100%", label: "Multi-tenant sécurisé" },
  { value: "10+", label: "Modules intégrés" },
  { value: "FCFA", label: "Devise locale Mali" },
  { value: "24/7", label: "Disponible partout" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl shadow-sm" />
            <span className="font-display font-bold text-sm sm:text-xl text-emerald-700 tracking-tight">GESTAVICOLE</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors px-2 sm:px-3 py-2 whitespace-nowrap">
              Se connecter
            </Link>
            <Link href="/register" className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5 whitespace-nowrap">
              Commencer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register" className="sm:hidden flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm transition-all whitespace-nowrap">
              S'inscrire <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-slate-50 pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" /> Plateforme SaaS avicole pour l'Afrique de l'Ouest
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-slate-900 leading-tight mb-6">
            Gérez vos fermes avicoles<br />
            <span className="text-emerald-600">intelligemment</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            GESTAVICOLE est la solution complète pour les éleveurs de volailles au Mali et en Afrique de l'Ouest. 
            Suivi des lots, production d'œufs, stocks, ventes, finances et santé animale — tout en un.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-emerald-200 transition-all hover:-translate-y-1 text-base w-full sm:w-auto justify-center">
              Créer mon compte gratuitement <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-emerald-300 text-slate-700 font-semibold px-8 py-4 rounded-2xl transition-all text-base w-full sm:w-auto justify-center">
              J'ai déjà un compte
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-4">Aucune carte bancaire requise · Inscription en 1 minute</p>
        </div>
      </section>

      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-display font-extrabold text-emerald-600">{s.value}</p>
                <p className="text-sm text-slate-500 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Une suite complète d'outils pensés pour la réalité des éleveurs en Afrique de l'Ouest.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all group">
                <div className="w-10 h-10 bg-emerald-50 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <f.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mb-4">
              Pourquoi choisir GESTAVICOLE ?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Globe, title: "Conçu pour l'Afrique", desc: "Interface en français, devise FCFA, adapté aux réalités du terrain en Afrique de l'Ouest." },
              { icon: ShieldCheck, title: "Données sécurisées", desc: "Isolation totale des données par ferme. Vos informations restent confidentielles et protégées." },
              { icon: Tractor, title: "Multi-fermes", desc: "Gérez plusieurs fermes depuis un seul compte. Comparez les performances en un coup d'œil." },
            ].map((item) => (
              <div key={item.title} className="text-center p-8 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-5">
                  <item.icon className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-3">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-emerald-600 to-emerald-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
            Prêt à moderniser votre élevage ?
          </h2>
          <p className="text-emerald-100 text-lg mb-10">
            Rejoignez les éleveurs qui gèrent leur ferme avec GESTAVICOLE. Inscription gratuite, sans engagement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="flex items-center gap-2 justify-center bg-white text-emerald-700 font-bold px-8 py-4 rounded-2xl shadow-xl transition-all hover:-translate-y-1 text-base">
              Créer mon compte <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="flex items-center gap-2 justify-center border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-2xl transition-all hover:bg-white/10 text-base">
              Se connecter
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {["Inscription gratuite", "Données isolées par ferme", "Accès multi-utilisateurs", "Export Excel & PDF"].map((t) => (
              <div key={t} className="flex items-center gap-2 text-emerald-100 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-7 h-7 rounded-lg" />
            <span className="font-display font-bold text-white text-sm">GESTAVICOLE</span>
          </div>
          <p className="text-slate-500 text-sm text-center">
            © {new Date().getFullYear()} GESTAVICOLE — Plateforme SaaS de gestion avicole pour l'Afrique de l'Ouest
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">Connexion</Link>
            <Link href="/register" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">S'inscrire</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
