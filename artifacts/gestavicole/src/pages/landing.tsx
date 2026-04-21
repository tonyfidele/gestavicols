import React from "react";
import { Link } from "wouter";
import {
  LayoutDashboard, Layers, Package, DollarSign, BarChart3,
  Stethoscope, Egg, Users, CheckCircle2, ArrowRight, Tractor,
  ShieldCheck, Globe, Zap, UserCheck, CreditCard, ChevronRight,
  TrendingUp, Lock, Smartphone,
} from "lucide-react";

const FEATURE_GROUPS = [
  {
    label: "Production",
    color: "emerald",
    items: [
      { icon: Layers, title: "Gestion des Lots", desc: "Suivez chaque bande de volailles de l'entrée à la sortie avec historique complet des mouvements." },
      { icon: Egg, title: "Production d'Œufs", desc: "Enregistrez la collecte, les casses et calculez automatiquement le montant caisse journalier." },
      { icon: Package, title: "Stock & Aliments", desc: "Gérez aliments, médicaments et équipements avec alertes de rupture de stock en temps réel." },
    ],
  },
  {
    label: "Finance",
    color: "blue",
    items: [
      { icon: DollarSign, title: "Ventes & Clients", desc: "Facturez vos clients, suivez les paiements et analysez vos revenus par lot ou par ferme." },
      { icon: CreditCard, title: "Dépenses", desc: "Catégorisez toutes vos charges et comparez budgets prévisionnels et dépenses réelles." },
      { icon: UserCheck, title: "RH & Salaires", desc: "Gérez vos employés, calculez les salaires et générez des bulletins de paie en PDF." },
    ],
  },
  {
    label: "Pilotage",
    color: "violet",
    items: [
      { icon: BarChart3, title: "Analytics & Rapports", desc: "Tableaux de bord visuels, rapports PDF détaillés et comparaisons de performance entre fermes." },
      { icon: Stethoscope, title: "Santé Animale", desc: "Carnet sanitaire digital, vaccinations, traitements et bilans de santé par lot." },
      { icon: Users, title: "Multi-utilisateurs", desc: "Définissez des rôles précis : Admin, Chef de ferme, Ouvrier, Vétérinaire, Comptable." },
    ],
  },
];

const STATS = [
  { value: "10+", label: "Modules métier", icon: LayoutDashboard },
  { value: "5", label: "Rôles utilisateurs", icon: Users },
  { value: "FCFA", label: "Devise locale", icon: TrendingUp },
  { value: "100%", label: "Données sécurisées", icon: Lock },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Créez votre compte", desc: "Inscription gratuite en moins d'une minute. Aucune carte bancaire requise." },
  { step: "02", title: "Ajoutez vos fermes", desc: "Enregistrez vos fermes, bâtiments et lots de volailles en quelques clics." },
  { step: "03", title: "Gérez au quotidien", desc: "Saisissez la production, les ventes, les dépenses et suivez vos KPIs en temps réel." },
  { step: "04", title: "Analysez & exportez", desc: "Générez des rapports PDF/Excel et prenez de meilleures décisions grâce aux données." },
];

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string; badgeText: string }> = {
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", badge: "bg-emerald-600", badgeText: "text-white" },
  blue:    { bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-200",    badge: "bg-blue-600",    badgeText: "text-white" },
  violet:  { bg: "bg-violet-50",  text: "text-violet-600",  border: "border-violet-200",  badge: "bg-violet-600",  badgeText: "text-white" },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-8 h-8 rounded-xl shadow-sm" />
            <span className="font-display font-extrabold text-xl text-emerald-700 tracking-tight">GESTAVICOLE</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors px-3 py-2">
              Se connecter
            </Link>
            <Link href="/register" className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-100 transition-all hover:-translate-y-0.5">
              Commencer <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-slate-50 pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-2 rounded-full mb-8 shadow-sm">
            <Zap className="w-3.5 h-3.5 fill-emerald-500" />
            Plateforme SaaS avicole · Mali & Afrique de l'Ouest
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
            La gestion de vos fermes<br />
            <span className="text-emerald-600">enfin simplifiée</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            GESTAVICOLE centralise la production d'œufs, la gestion des lots, des stocks, des ventes 
            et des finances — en français, en FCFA, pour les éleveurs d'Afrique de l'Ouest.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/register" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-emerald-200 transition-all hover:-translate-y-1 text-base w-full sm:w-auto justify-center">
              Créer mon compte gratuitement <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-emerald-300 text-slate-700 font-semibold px-8 py-4 rounded-2xl transition-all text-base w-full sm:w-auto justify-center">
              J'ai déjà un compte
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
            {["Gratuit pour commencer", "Sans carte bancaire", "Inscription en 1 minute"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-14 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-3xl font-display font-extrabold text-emerald-600">{s.value}</p>
                <p className="text-xs text-slate-500 font-medium text-center">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES BY GROUP ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mb-4">
              Un outil pour chaque aspect de votre élevage
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Des modules intégrés couvrant la production, les finances et le pilotage — sans avoir besoin de plusieurs logiciels.
            </p>
          </div>
          <div className="space-y-10">
            {FEATURE_GROUPS.map((group) => {
              const c = colorMap[group.color];
              return (
                <div key={group.label}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${c.badge} ${c.badgeText} tracking-wider uppercase`}>
                      {group.label}
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {group.items.map((f) => (
                      <div key={f.title} className={`bg-white rounded-2xl p-6 border ${c.border} hover:shadow-md transition-all group`}>
                        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-4`}>
                          <f.icon className={`w-5 h-5 ${c.text}`} />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mb-4">
              Démarrez en 4 étapes simples
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Aucune formation requise. Vous êtes opérationnel en moins d'une heure.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="relative">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 h-full hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                  <div className="text-4xl font-display font-extrabold text-emerald-100 mb-3 leading-none">{item.step}</div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 z-10 -translate-y-1/2">
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mb-4">
              Pourquoi les éleveurs choisissent GESTAVICOLE
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: "Conçu pour l'Afrique", desc: "Interface 100% en français, devise FCFA, adapté aux réalités du terrain en Afrique de l'Ouest. Pas un outil occidental inadapté." },
              { icon: ShieldCheck, title: "Données isolées & sécurisées", desc: "Chaque organisation a ses données totalement cloisonnées. Vos informations restent confidentielles et inaccessibles aux autres." },
              { icon: Tractor, title: "Multi-fermes & Multi-équipes", desc: "Gérez plusieurs fermes depuis un compte unique. Invitez votre équipe avec des droits d'accès précis selon le rôle." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-3">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 to-emerald-800 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
            Prêt à moderniser votre élevage ?
          </h2>
          <p className="text-emerald-100 text-lg mb-10 leading-relaxed">
            Rejoignez les éleveurs qui pilotent leur activité avec GESTAVICOLE.<br />
            Gratuit pour commencer, sans engagement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href="/register" className="flex items-center gap-2 justify-center bg-white text-emerald-700 font-bold px-8 py-4 rounded-2xl shadow-xl transition-all hover:-translate-y-1 text-base">
              Créer mon compte gratuitement <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="flex items-center gap-2 justify-center border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-2xl transition-all hover:bg-white/10 text-base">
              Se connecter
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {["Inscription gratuite", "Données isolées par ferme", "Accès multi-utilisateurs", "Export Excel & PDF"].map((t) => (
              <div key={t} className="flex items-center gap-2 text-emerald-100 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2.5">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-8 h-8 rounded-xl" />
              <span className="font-display font-extrabold text-white text-lg">GESTAVICOLE</span>
            </div>
            <p className="text-slate-500 text-sm text-center">
              Plateforme SaaS de gestion avicole pour l'Afrique de l'Ouest
            </p>
            <div className="flex items-center gap-5">
              <Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">Connexion</Link>
              <Link href="/register" className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm font-semibold transition-colors">
                S'inscrire <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 text-center">
            <p className="text-slate-600 text-xs">© {new Date().getFullYear()} GESTAVICOLE · Tous droits réservés</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
