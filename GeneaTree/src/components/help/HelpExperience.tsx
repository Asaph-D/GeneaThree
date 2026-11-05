import { ArrowLeft, ArrowRight, Check, GitBranch, MousePointer2, Play, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type HelpPage = 'assistant' | 'demo';
type Mode = 'menu' | 'tour' | 'sandbox' | 'context';
interface Step { target: string; title: string; text: string; illustration: 'question' | 'choices' | 'preview' | 'history' | 'profile' | 'controls'; }

const TOURS: Record<HelpPage, Step[]> = {
  assistant: [
    { target: '[data-tour="assistant-thread"]', title: 'Une question à la fois', text: 'L’assistant construit les relations progressivement. Vos réponses restent dans ce fil.', illustration: 'question' },
    { target: '[data-tour="assistant-choices"]', title: 'Choisir un lien', text: 'Les raccourcis proposent les liens adaptés au contexte : enfant, conjoint, cousin ou grand-parent.', illustration: 'choices' },
    { target: '[data-tour="assistant-preview"]', title: 'Prévisualisation en direct', text: 'Chaque réponse met à jour un arbre fictif avant toute validation.', illustration: 'preview' },
    { target: '[data-tour="assistant-history"]', title: 'Retrouver ses arbres', text: 'L’historique permet de reprendre un arbre importé ou votre dernière sauvegarde.', illustration: 'history' },
  ],
  demo: [
    { target: '[data-tour="demo-settings"]', title: 'Régler la vue', text: 'Changez le point focal, les générations et le type de vue sans modifier les données.', illustration: 'controls' },
    { target: '[data-tour="demo-import"]', title: 'Importer un arbre', text: 'Chargez une archive GeneaTreePro. Elle est enregistrée séparément et reste disponible après actualisation.', illustration: 'controls' },
    { target: '[data-tour="demo-share"]', title: 'Partager avec précision', text: 'Créez un lien public en lecture seule ou invitez un collaborateur avec les droits souhaités.', illustration: 'profile' },
    { target: '[data-tour="demo-export"]', title: 'Exporter et présenter', text: 'Téléchargez les données ou ouvrez le studio PDF haute définition.', illustration: 'preview' },
    { target: '[data-tour="demo-tree"]', title: 'Explorer les personnes', text: 'Cliquez sur un nœud pour consulter son profil et gérer ses relations.', illustration: 'profile' },
    { target: '[data-tour="demo-assistant"]', title: 'Continuer avec l’assistant', text: 'L’arbre courant est transmis directement à l’assistant sans recommencer.', illustration: 'preview' },
  ],
};

export default function HelpExperience({ page, contextText, onBeforeStep, onClose }: { page: HelpPage; contextText?: string; onBeforeStep?: (target: string) => void; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('menu');
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const steps = TOURS[page];
  const step = steps[stepIndex];

  useEffect(() => {
    if (mode !== 'tour') return;
    const update = () => {
      onBeforeStep?.(step.target);
      window.setTimeout(() => {
      const element = document.querySelector(step.target);
      if (!element) { setRect(null); return; }
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      window.setTimeout(() => setRect(element.getBoundingClientRect()), 220);
      }, 120);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [mode, onBeforeStep, step]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [onClose]);

  if (mode === 'tour') return <TourOverlay rect={rect} step={step} stepIndex={stepIndex} count={steps.length} onBack={() => stepIndex === 0 ? setMode('menu') : setStepIndex((value) => value - 1)} onNext={() => stepIndex === steps.length - 1 ? onClose() : setStepIndex((value) => value + 1)} onClose={onClose} />;

  return <div className="fixed inset-0 z-[160] grid place-items-center bg-zinc-950/70 p-4 backdrop-blur-md" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="max-h-[min(760px,92dvh)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-white shadow-2xl dark:bg-zinc-950" role="dialog" aria-modal="true" aria-labelledby="help-experience-title">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-200 bg-white/95 p-5 backdrop-blur dark:border-white/10 dark:bg-zinc-950/95"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500/15 text-sky-500"><Sparkles size={21} /></div><div className="flex-1"><p className="text-[10px] uppercase tracking-[.18em] text-sky-500">Aide interactive</p><h2 id="help-experience-title" className="font-serif text-2xl">{mode === 'sandbox' ? 'Démonstration sans risque' : mode === 'context' ? 'Comprendre cette étape' : 'Comment souhaitez-vous apprendre ?'}</h2></div>{mode !== 'menu' && <button onClick={() => setMode('menu')} className="rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-white/10" aria-label="Retour"><ArrowLeft size={18} /></button>}<button onClick={onClose} className="rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-white/10" aria-label="Fermer"><X size={18} /></button></header>
      {mode === 'menu' && <div className="grid gap-3 p-5 sm:grid-cols-3"><HelpChoice icon={<MousePointer2 />} title="Visite guidée" text="Découvrir les zones importantes pas à pas." onClick={() => { setStepIndex(0); setMode('tour'); }} /><HelpChoice icon={<Play />} title="Démonstration" text="Manipuler une famille fictive et observer les liens." onClick={() => setMode('sandbox')} /><HelpChoice icon={<GitBranch />} title="Cette étape" text="Comprendre la question ou l’écran actuel." onClick={() => setMode('context')} /></div>}
      {mode === 'sandbox' && <FamilySandbox />}
      {mode === 'context' && <div className="p-6"><div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-7 text-sky-950 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">{contextText || (page === 'assistant' ? 'Répondez à la question affichée. Les choix proposés sont adaptés à la relation en cours et la prévisualisation reste modifiable avant validation.' : 'Utilisez les réglages pour explorer l’arbre. Une action de consultation ne modifie jamais les relations familiales.')}</div><Illustration type={page === 'assistant' ? 'question' : 'controls'} /></div>}
    </section>
  </div>;
}

function HelpChoice({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="group rounded-2xl border border-zinc-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-lg dark:border-white/10"><span className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 text-sky-500 group-hover:bg-sky-500 group-hover:text-white dark:bg-white/5">{icon}</span><strong className="mt-4 block text-sm">{title}</strong><span className="mt-2 block text-xs leading-5 text-zinc-500">{text}</span></button>;
}

function TourOverlay({ rect, step, stepIndex, count, onBack, onNext, onClose }: { rect: DOMRect | null; step: Step; stepIndex: number; count: number; onBack: () => void; onNext: () => void; onClose: () => void }) {
  const cardStyle = useMemo(() => {
    if (!rect || window.innerWidth < 640) return { left: 16, right: 16, bottom: 16 };
    const width = 340;
    const left = rect.right + width + 28 < window.innerWidth ? rect.right + 18 : Math.max(16, rect.left - width - 18);
    return { left, top: Math.min(window.innerHeight - 390, Math.max(16, rect.top)), width };
  }, [rect]);
  return <div className="fixed inset-0 z-[170]" role="dialog" aria-modal="true"><button className="absolute right-4 top-4 z-20 rounded-full bg-zinc-950/80 p-2 text-white" onClick={onClose} aria-label="Quitter la visite"><X size={18} /></button>{rect && <div className="pointer-events-none fixed rounded-2xl ring-4 ring-sky-400/80 transition-all duration-300" style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12, boxShadow: '0 0 0 9999px rgba(3,7,18,.78)' }} />} {!rect && <div className="absolute inset-0 bg-zinc-950/80" />}<article className="fixed z-10 rounded-3xl border border-white/15 bg-white p-5 shadow-2xl dark:bg-zinc-950" style={cardStyle}><div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[.18em] text-sky-500">Étape {stepIndex + 1} / {count}</span><span className="flex gap-1">{Array.from({ length: count }, (_, index) => <i key={index} className={`h-1.5 w-5 rounded-full ${index <= stepIndex ? 'bg-sky-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} />)}</span></div><Illustration type={step.illustration} compact /><h3 className="mt-3 font-serif text-xl">{step.title}</h3><p className="mt-2 text-sm leading-6 text-zinc-500">{step.text}</p><div className="mt-5 flex justify-between"><button onClick={onBack} className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 px-3 py-2 text-xs dark:border-white/10"><ArrowLeft size={14} />Retour</button><button onClick={onNext} className="inline-flex items-center gap-1 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white">{stepIndex === count - 1 ? <><Check size={14} />Terminer</> : <>Suivant<ArrowRight size={14} /></>}</button></div></article></div>;
}

function FamilySandbox() {
  const [stage, setStage] = useState(0);
  const descriptions = ['Paul ouvre l’arbre.', 'Marie devient sa conjointe.', 'Alice est reliée à leur union.', 'Jean reste enfant de Paul seulement : aucune filiation n’est inventée.'];
  return <div className="p-5"><div className="overflow-hidden rounded-2xl border border-zinc-200 bg-[#f4f1ea] p-4 dark:border-white/10 dark:bg-[#09090b]"><svg viewBox="0 0 620 280" className="h-auto w-full"><g stroke="currentColor" className="text-zinc-500" fill="none" strokeWidth="2"><path className="transition-all duration-700" d={stage >= 1 ? 'M230 70H390' : 'M230 70H230'} /><path className="transition-all duration-700" d={stage >= 2 ? 'M310 70V145H205V205 M205 145H205' : 'M310 70V70'} /><path className="transition-all duration-700" d={stage >= 3 ? 'M310 70V145H455V205' : 'M310 70V145H310'} /></g>{stage >= 1 && <rect x="304" y="64" width="12" height="12" transform="rotate(45 310 70)" fill="#09090b" stroke="#38bdf8" />}<SandboxNode x={210} y={70} label="Paul" color="#2f6b95" visible /><SandboxNode x={410} y={70} label="Marie" color="#b3485c" visible={stage >= 1} /><SandboxNode x={205} y={220} label="Alice" color="#b3485c" visible={stage >= 2} /><SandboxNode x={455} y={220} label="Jean" color="#2f6b95" visible={stage >= 3} /></svg></div><p className="mt-4 min-h-12 rounded-xl bg-sky-500/10 p-3 text-sm text-sky-800 dark:text-sky-200">{descriptions[stage]}</p><div className="mt-4 flex items-center justify-between"><button onClick={() => setStage((value) => Math.max(0, value - 1))} disabled={stage === 0} className="rounded-xl border border-zinc-200 px-3 py-2 text-xs disabled:opacity-40 dark:border-white/10">Précédent</button><div className="flex gap-1">{descriptions.map((_, index) => <button key={index} onClick={() => setStage(index)} className={`h-2.5 w-2.5 rounded-full ${stage === index ? 'bg-sky-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} aria-label={`Scène ${index + 1}`} />)}</div><button onClick={() => setStage((value) => Math.min(3, value + 1))} disabled={stage === 3} className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Observer</button></div></div>;
}

function SandboxNode({ x, y, label, color, visible }: { x: number; y: number; label: string; color: string; visible: boolean }) { return <g className={`transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`} transform={`translate(${x} ${y})`}><circle r="28" fill={color} stroke="#e4e4e7" strokeWidth="2" /><text y="5" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">{label[0]}</text><text y="48" textAnchor="middle" fill="currentColor" fontSize="13">{label}</text></g>; }

function Illustration({ type, compact = false }: { type: Step['illustration']; compact?: boolean }) {
  const labels: Record<Step['illustration'], string> = { question: 'Question → réponse → lien', choices: 'Parent · Enfant · Conjoint', preview: 'Aperçu vivant de l’arbre', history: 'Arbres et sauvegardes', profile: 'Profil et relations', controls: 'Focus · générations · vue' };
  return <div className={`mt-4 overflow-hidden rounded-2xl border border-sky-500/20 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,.22),transparent_35%),linear-gradient(135deg,rgba(99,102,241,.12),transparent)] ${compact ? 'p-3' : 'p-5'}`}><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-sky-500 text-white"><GitBranch size={17} /></span><div className="h-px flex-1 bg-gradient-to-r from-sky-500 to-indigo-500" /><span className="h-3 w-3 rotate-45 border border-indigo-400" /></div><p className="mt-3 text-xs font-medium text-zinc-600 dark:text-zinc-300">{labels[type]}</p></div>;
}
