import React, { useEffect } from 'react';
import { ArrowRight, BookOpen, Camera, HeartHandshake, Megaphone, ScanLine } from 'lucide-react';
import { Link } from 'react-router-dom';

const placements = [
  { icon: ScanLine, title: 'Numérisation d’archives', text: 'Présentez vos services de restauration, de classement ou de numérisation familiale.' },
  { icon: Camera, title: 'Portraits & souvenirs', text: 'Mettez en avant photographes, studios et artisans de la mémoire.' },
  { icon: BookOpen, title: 'Recherche généalogique', text: 'Faites découvrir chercheurs, associations et ressources historiques locales.' },
];

const CreationPage: React.FC = () => {
  useEffect(() => { document.title = 'Découvrir — GeneaTreePro'; }, []);

  return (
    <main className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_65%)]" />
      <div className="relative mx-auto max-w-6xl">
        <section className="rounded-[2rem] border border-white/80 bg-white/80 px-6 py-12 shadow-[0_30px_90px_-50px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/75 sm:px-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary-700 dark:bg-primary-500/10 dark:text-primary-200"><Megaphone size={14} /> Espace partenaires</span>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl text-zinc-950 dark:text-white sm:text-6xl">Les services qui font vivre les histoires familiales.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">L’ancien atelier devient une vitrine dédiée aux professionnels, associations et initiatives utiles aux familles GeneaTreePro.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/assistant?new=1" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700">Créer mon arbre <ArrowRight size={16} /></Link>
            <a href="mailto:partenaires@geneatreepro.com" className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"><HeartHandshake size={16} /> Devenir partenaire</a>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {placements.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-3xl border border-zinc-200/80 bg-white/75 p-6 backdrop-blur dark:border-white/10 dark:bg-zinc-950/65">
              <Icon className="h-6 w-6 text-primary-600 dark:text-primary-300" />
              <h2 className="mt-5 font-serif text-2xl text-zinc-950 dark:text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{text}</p>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">Emplacement disponible</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
};

export default CreationPage;
