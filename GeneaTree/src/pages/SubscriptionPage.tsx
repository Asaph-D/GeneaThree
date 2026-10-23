import { Check, Sparkles } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const plans = [
  { name: 'Mémoire', price: 'Gratuit', description: 'Pour commencer et préserver un premier lignage.', features: ['1 arbre familial', 'Assistant guidé', 'Export JSON'], action: 'Commencer' },
  { name: 'Famille', price: '3 500 FCFA', period: '/ mois', description: 'Pour construire ensemble sans limite de générations.', features: ['Arbres illimités', 'Collaboration familiale', 'Exports PDF et image', 'Sauvegarde cloud'], action: 'Choisir Famille', featured: true },
  { name: 'Héritage', price: '35 000 FCFA', period: '/ an', description: 'Pour les grandes familles, associations et chefferies.', features: ['Tout le forfait Famille', 'Gestion avancée des accès', 'Historique des versions', 'Assistance prioritaire'], action: 'Choisir Héritage' },
];

export default function SubscriptionPage() {
  return <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-2xl text-center"><span className="inline-flex items-center gap-2 rounded-full border border-primary-500/25 bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300"><Sparkles size={14} /> Abonnements</span><h1 className="mt-5 font-serif text-4xl sm:text-5xl">Préservez davantage, à votre rythme.</h1><p className="mt-4 text-zinc-600 dark:text-zinc-300">Commencez gratuitement. Passez à un abonnement seulement lorsque votre famille a besoin de collaboration et de sauvegarde cloud.</p></div>
    <div className="mt-12 grid gap-5 lg:grid-cols-3">{plans.map((plan) => <article key={plan.name} className={`relative rounded-3xl border p-6 ${plan.featured ? 'border-primary-500 bg-zinc-950 text-white shadow-2xl' : 'border-zinc-200 bg-white/80 dark:border-white/10 dark:bg-zinc-900/70'}`}>{plan.featured && <span className="absolute right-5 top-5 rounded-full bg-primary-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">Recommandé</span>}<h2 className="text-xl font-semibold">{plan.name}</h2><p className={`mt-2 min-h-12 text-sm ${plan.featured ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-300'}`}>{plan.description}</p><p className="mt-6 text-3xl font-bold">{plan.price}<span className="text-sm font-normal opacity-60">{plan.period}</span></p><ul className="my-7 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex items-center gap-2 text-sm"><Check size={16} className="text-emerald-500" />{feature}</li>)}</ul><Link to="/signin" className={`block rounded-xl px-4 py-3 text-center text-sm font-semibold ${plan.featured ? 'bg-white text-zinc-950' : 'bg-primary-600 text-white'}`}>{plan.action}</Link></article>)}</div>
  </div>;
}
