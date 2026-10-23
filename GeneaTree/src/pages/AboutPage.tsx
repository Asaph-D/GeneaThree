import React, { useEffect } from 'react';
import { Bot, GitBranch, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const principles = [
  { icon: GitBranch, title: 'Des liens précis', text: 'Chaque enfant peut être associé à l’union exacte de ses parents, même lorsque plusieurs conjoints se succèdent.' },
  { icon: Bot, title: 'Deux portes, un arbre', text: 'L’assistant guide la saisie et la Démonstration permet de visualiser, corriger et enrichir le même lignage.' },
  { icon: ShieldCheck, title: 'Aucune perte accidentelle', text: 'L’arbre validé et le brouillon de l’assistant restent séparés jusqu’à votre confirmation.' },
];

const AboutPage: React.FC = () => {
  useEffect(() => { document.title = 'À propos — GeneaTreePro'; }, []);

  return (
    <main className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.2),transparent_65%)]" />
      <div className="relative mx-auto max-w-6xl">
        <section className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">À propos</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-zinc-950 dark:text-white sm:text-6xl">Rendre les histoires familiales simples à construire et justes à relire.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">GeneaTreePro relie une saisie guidée à une vue interactive. L’objectif est clair : représenter les personnes, les unions et les filiations sans imposer une structure artificielle.</p>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {principles.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-3xl border border-zinc-200/80 bg-white/80 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-200"><Icon size={21} /></div>
              <h2 className="mt-5 font-serif text-2xl text-zinc-950 dark:text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{text}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 flex flex-col items-start justify-between gap-6 rounded-3xl bg-zinc-950 px-7 py-8 text-white dark:bg-white dark:text-zinc-950 sm:flex-row sm:items-center">
          <div><p className="font-serif text-2xl">Votre histoire peut commencer maintenant.</p><p className="mt-1 text-sm text-zinc-300 dark:text-zinc-600">L’assistant vous accompagne, la Démonstration vous laisse la main.</p></div>
          <Link to="/assistant?new=1" className="shrink-0 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:from-sky-400 hover:to-indigo-500">Créer mon arbre</Link>
        </section>
      </div>
    </main>
  );
};

export default AboutPage;
