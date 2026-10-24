import React, { useEffect, useState } from 'react';
import { ChevronDown, GitFork, HelpCircle, Route } from 'lucide-react';
import { Link } from 'react-router-dom';

const items = [
  ['Comment créer mon arbre ?', 'Le bouton Créer ouvre l’assistant guidé. Chaque réponse complète le même arbre que celui affiché dans la Démonstration.'],
  ['Comment ajouter un cousin ?', 'Choisissez Cousin, le parent qui porte cette branche, puis l’oncle ou la tante dont il est l’enfant. Si cet oncle existe déjà, sélectionnez-le. Sinon, créez-le dans le même parcours.'],
  ['Pourquoi demande-t-on parfois le parent commun ?', 'Cette question apparaît uniquement lorsque le père et la mère du parent choisi sont tous les deux inconnus. Elle permet de savoir si le nouvel oncle ou la nouvelle tante appartient à la branche du grand-père ou de la grand-mère.'],
  ['Que se passe-t-il lorsque les grands-parents sont déjà connus ?', 'L’assistant ne repose pas la question. Le nouvel oncle ou la nouvelle tante reçoit automatiquement les mêmes parents connus que Jean ou Claire.'],
  ['Et si un grand-parent a eu plusieurs conjoints ?', 'L’assistant affiche les unions possibles. Vous choisissez celle dont est issu le nouvel oncle ou la nouvelle tante; il peut ainsi être frère, sœur, demi-frère ou demi-sœur du parent sélectionné.'],
  ['Comment rattacher un enfant à la bonne union ?', 'Après avoir choisi le parent, sélectionnez son conjoint ou « sans conjoint ». L’enfant n’est jamais attribué automatiquement à tous les conjoints.'],
  ['Comment attribuer des enfants existants à un nouveau conjoint ?', 'Lors de l’ajout du conjoint dans la Démonstration, activez « Parenter les enfants de X ». Seuls les enfants encore associés à un seul parent reçoivent ce second parent.'],
  ['Que se passe-t-il si j’ouvre l’assistant par erreur ?', 'L’arbre enregistré reste intact. Depuis la Démonstration, l’assistant charge directement cet arbre et les changements ne remplacent la version enregistrée qu’après validation.'],
];

type NodeProps = { name: string; tone?: 'blue' | 'rose' | 'neutral'; muted?: boolean };

function TreeNode({ name, tone = 'neutral', muted = false }: NodeProps) {
  const toneClass = tone === 'blue'
    ? 'border-sky-400/50 bg-sky-500/15 text-sky-800 dark:text-sky-100'
    : tone === 'rose'
      ? 'border-rose-400/50 bg-rose-500/15 text-rose-800 dark:text-rose-100'
      : 'border-zinc-300 bg-white text-zinc-800 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100';
  return <span className={`relative z-10 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${toneClass} ${muted ? 'border-dashed opacity-70' : ''}`}>{name}</span>;
}

function KnownBranchFigure() {
  return (
    <div className="relative mt-5 min-h-52 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-black/20" aria-label="Simulation : ajout d’un cousin du côté de Jean">
      <div className="absolute left-1/2 top-[3.2rem] h-8 w-px bg-zinc-300 dark:bg-zinc-700" />
      <div className="absolute left-[26%] right-[26%] top-[5.2rem] h-px bg-zinc-300 dark:bg-zinc-700" />
      <div className="absolute left-[26%] top-[5.2rem] h-8 w-px bg-zinc-300 dark:bg-zinc-700" />
      <div className="absolute right-[26%] top-[5.2rem] h-8 w-px bg-zinc-300 dark:bg-zinc-700" />
      <div className="absolute right-[26%] top-[8.8rem] h-7 w-px bg-zinc-300 dark:bg-zinc-700" />
      <div className="flex justify-center gap-3"><TreeNode name="Père de Jean" tone="blue" /><TreeNode name="Mère de Jean" tone="rose" /></div>
      <div className="mt-14 flex justify-around"><TreeNode name="Jean" tone="blue" /><TreeNode name="Nouvel oncle" tone="blue" /></div>
      <div className="mt-10 flex justify-end pr-[16%]"><TreeNode name="Nouveau cousin" /></div>
    </div>
  );
}

function UnknownBranchFigure() {
  return (
    <div className="relative mt-5 min-h-52 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-black/20" aria-label="Simulation : ajout d’un cousin lorsque les parents de Claire sont inconnus">
      <div className="absolute left-1/2 top-[3.2rem] h-8 w-px bg-zinc-300 dark:bg-zinc-700" />
      <div className="absolute left-[26%] right-[26%] top-[5.2rem] h-px bg-zinc-300 dark:bg-zinc-700" />
      <div className="absolute left-[26%] top-[5.2rem] h-8 w-px bg-zinc-300 dark:bg-zinc-700" />
      <div className="absolute right-[26%] top-[5.2rem] h-8 w-px bg-zinc-300 dark:bg-zinc-700" />
      <div className="absolute right-[26%] top-[8.8rem] h-7 w-px bg-zinc-300 dark:bg-zinc-700" />
      <div className="flex justify-center"><TreeNode name="Père ou mère à préciser" muted /></div>
      <div className="mt-14 flex justify-around"><TreeNode name="Claire" tone="rose" /><TreeNode name="Nouvel oncle / tante" muted /></div>
      <div className="mt-10 flex justify-end pr-[13%]"><TreeNode name="Nouveau cousin" /></div>
    </div>
  );
}

const FaqPage: React.FC = () => {
  const [open, setOpen] = useState(0);
  useEffect(() => { document.title = 'Guide et FAQ — GeneaTreePro'; }, []);

  return (
    <main className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_65%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          <HelpCircle className="mx-auto h-8 w-8 text-primary-600" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">Mode d’emploi</p>
          <h1 className="mt-2 font-serif text-4xl text-zinc-950 dark:text-white sm:text-5xl">Comprendre les branches familiales</h1>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-600 dark:text-zinc-300">Des simulations concrètes pour comprendre ce que l’assistant déduit et ce qu’il doit encore vous demander.</p>
        </div>

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-zinc-200/80 bg-white/80 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
            <div className="flex items-center gap-3"><GitFork className="text-emerald-600" /><h2 className="font-serif text-2xl">Parenté déjà connue</h2></div>
            <KnownBranchFigure />
            <ol className="mt-5 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              <li><strong>1.</strong> Choisir Cousin, puis Jean.</li>
              <li><strong>2.</strong> Choisir « Un nouvel oncle ».</li>
              <li><strong>3.</strong> L’assistant reprend automatiquement les parents connus de Jean.</li>
              <li><strong>4.</strong> Saisir directement l’oncle, puis son enfant.</li>
            </ol>
          </article>

          <article className="rounded-3xl border border-zinc-200/80 bg-white/80 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
            <div className="flex items-center gap-3"><HelpCircle className="text-amber-600" /><h2 className="font-serif text-2xl">Parenté encore inconnue</h2></div>
            <UnknownBranchFigure />
            <ol className="mt-5 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              <li><strong>1.</strong> Choisir Cousin, puis Claire.</li>
              <li><strong>2.</strong> Choisir « Un nouvel oncle » ou « Une nouvelle tante ».</li>
              <li><strong>3.</strong> Préciser si le parent commun est le père ou la mère de Claire.</li>
              <li><strong>4.</strong> Nommer ce grand-parent, puis l’oncle ou la tante et enfin le cousin.</li>
            </ol>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-primary-200 bg-primary-50/70 p-6 dark:border-primary-500/20 dark:bg-primary-500/5">
          <div className="flex items-center gap-3"><Route className="text-primary-600" /><h2 className="font-serif text-2xl">Règle de décision</h2></div>
          <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">L’assistant ne demande une information que si elle ne peut pas être déduite sans ambiguïté. Un parent connu est réutilisé; un parent inconnu est créé explicitement; un enfant est toujours rattaché à une personne ou à une union précise.</p>
        </section>

        <div className="mt-8 overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/80 px-5 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70 sm:px-7">
          {items.map(([question, answer], index) => (
            <section key={question} className="border-b border-zinc-200/80 py-1 last:border-0 dark:border-white/10">
              <button type="button" onClick={() => setOpen(open === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 py-5 text-left font-semibold text-zinc-900 dark:text-white" aria-expanded={open === index}>
                {question}<ChevronDown className={`h-5 w-5 shrink-0 text-primary-600 transition-transform ${open === index ? 'rotate-180' : ''}`} />
              </button>
              {open === index && <p className="max-w-4xl pb-5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{answer}</p>}
            </section>
          ))}
        </div>
        <div className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-300">Prêt à essayer ? <Link to="/assistant?new=1" className="font-semibold text-primary-700 hover:underline dark:text-primary-300">Créer mon arbre</Link></div>
      </div>
    </main>
  );
};

export default FaqPage;
