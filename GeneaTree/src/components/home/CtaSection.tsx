import React from 'react';
import { Link } from 'react-router-dom';
import { MovingBorder } from '../aceternity/effects';

const CtaSection: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-white/80 bg-white/80 px-6 py-8 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-serif text-3xl text-zinc-950 dark:text-white">Prêt à ouvrir un lignage ?</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">L'assistant démarre au premier prénom. La vue de la démonstration suit.</p>
        </div>
        <div className="flex gap-3">
          <MovingBorder to="/assistant">Commencer</MovingBorder>
          <Link to="/quick-start" className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 dark:border-white/15 dark:text-zinc-100">
            Horizons
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CtaSection;
