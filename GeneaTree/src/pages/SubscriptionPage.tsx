import { Check, CreditCard, Loader2, ShieldCheck, Sparkles, X } from 'lucide-react';
import React, { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getPaymentStatus, initiatePayment, MobileOperator, PaidPlanCode, PaymentState } from '../services/paymentService';

const PAYMENT_VALIDATION_SECONDS = 180;

const plans = [
  { name: 'Mémoire', price: 'Gratuit', description: 'Pour commencer et préserver un premier lignage.', features: ['1 arbre familial', 'Assistant guidé', 'Export JSON'], action: 'Commencer' },
  { name: 'Famille', code: 'FAMILY_MONTHLY' as PaidPlanCode, amount: 3500, price: '3 500 FCFA', period: '/ mois', description: 'Pour construire ensemble sans limite de générations.', features: ['Arbres illimités', 'Collaboration familiale', 'Exports PDF et image', 'Sauvegarde cloud'], action: 'Choisir Famille', featured: true },
  { name: 'Héritage', code: 'HERITAGE_YEARLY' as PaidPlanCode, amount: 35000, price: '35 000 FCFA', period: '/ an', description: 'Pour les grandes familles, associations et chefferies.', features: ['Tout le forfait Famille', 'Gestion avancée des accès', 'Historique des versions', 'Assistance prioritaire'], action: 'Choisir Héritage' },
];

export default function SubscriptionPage() {
  const [selected, setSelected] = useState<(typeof plans)[number] | null>(null);
  return <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-2xl text-center"><span className="inline-flex items-center gap-2 rounded-full border border-primary-500/25 bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300"><Sparkles size={14} /> Abonnements</span><h1 className="mt-5 font-serif text-4xl sm:text-5xl">Préservez davantage, à votre rythme.</h1><p className="mt-4 text-zinc-600 dark:text-zinc-300">Payez simplement par MTN MoMo ou Orange Money.</p></div>
    <div className="mt-12 grid gap-5 lg:grid-cols-3">{plans.map((plan) => <article key={plan.name} className={`relative rounded-3xl border p-6 ${plan.featured ? 'border-primary-500 bg-zinc-950 text-white shadow-2xl' : 'border-zinc-200 bg-white/80 dark:border-white/10 dark:bg-zinc-900/70'}`}>{plan.featured && <span className="absolute right-5 top-5 rounded-full bg-primary-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">Recommandé</span>}<h2 className="text-xl font-semibold">{plan.name}</h2><p className={`mt-2 min-h-12 text-sm ${plan.featured ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-300'}`}>{plan.description}</p><p className="mt-6 text-3xl font-bold">{plan.price}<span className="text-sm font-normal opacity-60">{plan.period}</span></p><ul className="my-7 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex items-center gap-2 text-sm"><Check size={16} className="text-emerald-500" />{feature}</li>)}</ul>{plan.code ? <button onClick={() => setSelected(plan)} className={`w-full rounded-xl px-4 py-3 text-sm font-semibold ${plan.featured ? 'bg-white text-zinc-950' : 'bg-primary-600 text-white'}`}>{plan.action}</button> : <Link to="/assistant" className="block rounded-xl bg-primary-600 px-4 py-3 text-center text-sm font-semibold text-white">{plan.action}</Link>}</article>)}</div>
    {selected?.code && <PaymentModal plan={selected as typeof selected & { code: PaidPlanCode; amount: number }} onClose={() => setSelected(null)} />}
  </div>;
}

function MtnLogo() { return <span aria-hidden className="grid h-7 w-9 place-items-center rounded-md bg-[#ffcb05] text-[10px] font-black italic text-black">MTN</span>; }
function OrangeLogo() { return <span aria-hidden className="grid h-7 w-7 place-items-center rounded-sm bg-[#ff7900] text-[8px] font-bold text-white">orange</span>; }

function PaymentModal({ plan, onClose }: { plan: { name: string; code: PaidPlanCode; amount: number }; onClose: () => void }) {
  const { user } = useAuth();
  const [method, setMethod] = useState<MobileOperator>('MTN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [payment, setPayment] = useState<PaymentState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(PAYMENT_VALIDATION_SECONDS);
  const paymentReference = payment?.reference;
  const paymentStatus = payment?.status;
  useEffect(() => {
    if (!paymentReference || paymentStatus !== 'PENDING' || payment?.redirectUrl) return;
    const timer = window.setInterval(async () => { try { setPayment(await getPaymentStatus(paymentReference)); } catch { /* keep polling */ } }, 4000);
    return () => window.clearInterval(timer);
  }, [paymentReference, paymentStatus, payment?.redirectUrl]);
  useEffect(() => {
    if (!paymentReference || paymentStatus !== 'PENDING') return;
    const timer = window.setInterval(() => setRemainingSeconds((seconds) => {
      if (seconds > 1) return seconds - 1;
      window.clearInterval(timer);
      getPaymentStatus(paymentReference)
        .then((latest) => setPayment(latest.status === 'PENDING' ? { ...latest, status: 'CANCELLED', message: "Le délai de validation est expiré. Aucun paiement n'a été confirmé." } : latest))
        .catch(() => setPayment((current) => current ? { ...current, status: 'CANCELLED', message: "Le délai de validation est expiré. Aucun paiement n'a été confirmé." } : current));
      return 0;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [paymentReference, paymentStatus]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      setRemainingSeconds(PAYMENT_VALIDATION_SECONDS);
      setPayment(await initiatePayment({ planCode: plan.code, phoneNumber, operator: method, email: user?.email }));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Paiement impossible.'); }
    finally { setBusy(false); }
  }
  const inputClass = 'mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-sky-400';
  return <div className="fixed inset-0 z-[130] grid place-items-center bg-black/75 p-4 backdrop-blur-md" role="dialog" aria-modal="true">
    <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[.18em] text-sky-400">Paiement sécurisé</p><h2 className="mt-1 font-serif text-2xl">Forfait {plan.name}</h2><p className="mt-1 text-zinc-400">{plan.amount.toLocaleString('fr-FR')} FCFA</p></div><button onClick={onClose} aria-label="Fermer" className="rounded-xl border border-white/10 p-2"><X size={18} /></button></div>
      {payment ? <PaymentProgress payment={payment} remainingSeconds={remainingSeconds} onRetry={() => { setPayment(null); setError(''); }} /> : <form onSubmit={submit} className="mt-6 space-y-4"><div className="grid grid-cols-3 gap-2">
        <MethodButton active={method === 'MTN'} onClick={() => setMethod('MTN')} icon={<MtnLogo />} label="MoMo" />
        <MethodButton active={method === 'ORANGE'} onClick={() => setMethod('ORANGE')} icon={<OrangeLogo />} label="Money" />
        <button type="button" disabled title="Bientôt disponible" className="relative flex min-w-0 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/10 px-2 py-3 text-sm font-semibold opacity-45"><CreditCard size={24} /><span>Carte</span><span className="absolute -top-2 right-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] uppercase">Bientôt</span></button>
      </div>
      <label className="block text-sm text-zinc-300">Numéro Mobile Money<input autoFocus required inputMode="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="6XX XX XX XX" className={inputClass} /></label>
      {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}<button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 font-semibold disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={18} />} Payer {plan.amount.toLocaleString('fr-FR')} FCFA</button><p className="flex items-center justify-center gap-2 text-center text-xs text-zinc-400"><ShieldCheck size={14} /> Vos informations de paiement sont protégées durant toute l’opération.</p></form>}
    </div>
  </div>;
}

function MethodButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button type="button" onClick={onClick} className={`flex min-w-0 items-center justify-center gap-2 rounded-xl border px-2 py-3 text-sm font-semibold ${active ? 'border-sky-400 bg-sky-400/15' : 'border-white/10'}`}>{icon}<span>{label}</span></button>;
}

function PaymentProgress({ payment, remainingSeconds, onRetry }: { payment: PaymentState; remainingSeconds: number; onRetry: () => void }) {
  const pending = payment.status === 'PENDING';
  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;
  return <div className="mt-8 text-center">{pending ? <Loader2 className="mx-auto animate-spin text-sky-400" size={42} /> : <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${payment.status === 'SUCCESSFUL' ? 'bg-emerald-500' : 'bg-red-500'}`}>{payment.status === 'SUCCESSFUL' ? <Check /> : <X />}</div>}<h3 className="mt-4 text-lg font-semibold">{pending ? 'Validation en attente' : payment.status === 'SUCCESSFUL' ? 'Paiement confirmé' : 'Paiement non abouti'}</h3><p className="mt-2 text-sm text-zinc-400">{pending ? 'Confirmez la demande reçue sur votre téléphone. Cette fenêtre se met à jour automatiquement.' : payment.message || `Référence : ${payment.reference}`}</p>{pending && <p className="mt-3 font-mono text-lg font-semibold text-sky-300" aria-live="polite">{countdown}</p>}{!pending && payment.status !== 'SUCCESSFUL' && <button type="button" onClick={onRetry} className="mt-5 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/10">Essayer à nouveau</button>}</div>;
}
