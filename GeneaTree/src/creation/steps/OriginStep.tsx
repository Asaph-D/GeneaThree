import React from 'react';
import { useCreation } from '../CreationContext';
import { DraftPerson, personName } from '../model';
import PersonForm from '../components/PersonForm';

const SelfSketch = () => (
  <svg viewBox="0 0 140 72" className="h-16 w-28 text-primary-700 dark:text-primary-300" aria-hidden>
    <circle cx="70" cy="14" r="7" fill="currentColor" />
    <path d="M70 21 V34 H28 H112" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M28 34 V46 M112 34 V46" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="28" cy="56" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="112" cy="56" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const FounderSketch = () => (
  <svg viewBox="0 0 160 78" className="h-16 w-32 text-amber-800 dark:text-amber-300" aria-hidden>
    <circle cx="80" cy="12" r="7" fill="currentColor" />
    <path d="M80 19 V30 H22 H80 H138" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M22 30 V42 M80 30 V42 M138 30 V42" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <rect x="16" y="46" width="12" height="12" transform="rotate(45 22 52)" fill="currentColor" />
    <rect x="74" y="46" width="12" height="12" transform="rotate(45 80 52)" fill="currentColor" />
    <rect x="132" y="46" width="12" height="12" transform="rotate(45 138 52)" fill="currentColor" />
  </svg>
);

const OriginStep: React.FC = () => {
  const { draft, dispatch } = useCreation();
  const anchor = draft.anchorId ? draft.people[draft.anchorId] : null;

  const choose = (origin: 'self' | 'founder') => dispatch({ type: 'set-origin', origin });

  const patch = (next: Partial<DraftPerson>) => {
    if (!draft.anchorId) return;
    dispatch({ type: 'update-person', id: draft.anchorId, patch: next });
  };

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary-700 dark:text-primary-300">Atelier</p>
        <h1 className="mt-2 font-serif text-5xl leading-[1.05] text-stone-900 dark:text-stone-50">
          Composer un lignage, foyer par foyer.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-stone-600 dark:text-stone-300">
          On ne demande plus « avez-vous des cousins ? ». On place une personne, puis chacune de ses unions, puis les enfants de cette union seulement.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => choose('self')}
          className={`group relative cursor-pointer overflow-hidden rounded-[28px] border p-6 text-left transition duration-300 hover:-translate-y-1 ${
            draft.origin === 'self'
              ? 'border-primary-600 bg-white shadow-[0_24px_50px_-28px_rgba(3,105,161,0.7)] dark:bg-white/10'
              : 'border-stone-200/80 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/5'
          }`}
        >
          <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-primary-400/25 blur-2xl" />
          <SelfSketch />
          <h2 className="mt-4 font-serif text-3xl">Je pars de moi</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            Vos foyers, vos enfants, puis les branches que vous décidez d'ouvrir. Vous restez une seule carte, même si une union rejoint un cousin.
          </p>
        </button>

        <button
          type="button"
          onClick={() => choose('founder')}
          className={`group relative cursor-pointer overflow-hidden rounded-[28px] border p-6 text-left transition duration-300 hover:-translate-y-1 ${
            draft.origin === 'founder'
              ? 'border-amber-700 bg-white shadow-[0_24px_50px_-28px_rgba(146,64,14,0.65)] dark:bg-white/10'
              : 'border-stone-200/80 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/5'
          }`}
        >
          <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-amber-400/30 blur-2xl" />
          <FounderSketch />
          <h2 className="mt-4 font-serif text-3xl">Un fondateur</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            Un ancêtre, un chef, une chefferie. Plusieurs épouses, chacune avec son rang et ses enfants, sans les réunir dans une fausse fratrie.
          </p>
        </button>
      </div>

      {anchor && (
        <section className="rounded-[28px] border border-stone-200/80 bg-white/80 p-6 shadow-[0_20px_50px_-36px_rgba(28,25,23,0.7)] dark:border-white/10 dark:bg-white/5 sm:p-8">
          <h2 className="font-serif text-3xl">
            {draft.origin === 'founder' ? 'Le fondateur' : 'Vous'}
          </h2>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {anchor.firstName.trim() ? personName(anchor) : 'Le prénom suffit pour continuer. Le reste peut attendre.'}
          </p>
          <div className="mt-6">
            <PersonForm idPrefix="anchor" value={anchor} onChange={patch} />
          </div>
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              disabled={!anchor.firstName.trim()}
              onClick={() => dispatch({ type: 'set-step', step: 'households' })}
              className="cursor-pointer rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-stone-900"
            >
              Composer les foyers
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default OriginStep;
