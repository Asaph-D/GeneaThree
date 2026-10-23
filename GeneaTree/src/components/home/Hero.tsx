import React from 'react';
import { Link } from 'react-router-dom';
import { BackgroundBeams, MovingBorder, Spotlight, WaveDivider } from '../aceternity/effects';

const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden">
      <Spotlight />
      <BackgroundBeams />
      <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-16 sm:px-6 lg:px-8 lg:pt-20">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">GeneaTree Pro</p>
          <h1 className="mt-3 bg-gradient-to-br from-zinc-950 via-zinc-800 to-primary-800 bg-clip-text font-serif text-4xl leading-[1.02] text-transparent dark:from-white dark:via-zinc-100 dark:to-sky-200 sm:text-5xl lg:text-6xl">
            Explorez votre histoire familiale
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
            Un assistant pose les questions une à une. La démonstration dessine le lignage à mesure que les réponses arrivent.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <MovingBorder to="/assistant?new=1">Créer mon arbre</MovingBorder>
            <Link to="/demo" className="rounded-full border border-zinc-300 bg-white/80 px-4 py-2.5 text-sm font-medium text-zinc-900 backdrop-blur hover:border-primary-400 dark:border-white/15 dark:bg-zinc-950/70 dark:text-zinc-100">
              Voir la démonstration
            </Link>
          </div>
        </div>
      </div>
      <WaveDivider className="absolute inset-x-0 bottom-0" />
    </section>
  );
};

export default Hero;
