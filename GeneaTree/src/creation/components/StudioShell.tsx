import { Moon, Sun, Trees } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCreation } from '../CreationContext';
import { STEPS, StepId, anchorReady, canOpenStep, personName } from '../model';

const StudioShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { draft, dispatch } = useCreation();
  const anchor = draft.anchorId ? draft.people[draft.anchorId] : null;
  const peopleCount = Object.keys(draft.people).length;
  const [dark, setDark] = useState(() => document.body.classList.contains('dark'));

  const go = (step: StepId) => dispatch({ type: 'set-step', step });

  const toggleTheme = () => {
    const next = !document.body.classList.contains('dark');
    document.body.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDark(next);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f3eee6] text-stone-900 dark:bg-[#100e0c] dark:text-stone-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.18),transparent_52%),radial-gradient(ellipse_at_bottom_right,rgba(180,83,9,0.14),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(28,25,23,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(28,25,23,0.05)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-25 dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium">
            <Trees className="h-5 w-5 text-primary-700 dark:text-primary-300" />
            <span>
              GeneaTree<span className="text-primary-700 dark:text-primary-300">Pro</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? 'Passer au thème clair' : 'Passer au thème sombre'}
              className="cursor-pointer rounded-full border border-stone-300/80 bg-white/70 p-2 dark:border-white/10 dark:bg-white/10"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <p className="hidden text-xs uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400 sm:block">
              Brouillon sur cet appareil
              {anchorReady(draft) && anchor ? ` · ${personName(anchor)}` : ''}
              {peopleCount > 0 ? ` · ${peopleCount} personne${peopleCount > 1 ? 's' : ''}` : ''}
            </p>
          </div>
        </header>

        <div className="mt-8 grid flex-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="Étapes de l'atelier" className="lg:sticky lg:top-6 lg:self-start">
            <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              {STEPS.map((step) => {
                const active = draft.step === step.id;
                const enabled = canOpenStep(step.id, draft);
                return (
                  <li key={step.id} className="min-w-[9.5rem] lg:min-w-0">
                    <button
                      type="button"
                      disabled={!enabled}
                      onClick={() => go(step.id)}
                      aria-current={active ? 'step' : undefined}
                      className={`w-full cursor-pointer rounded-2xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        active
                          ? 'border-stone-900 bg-stone-900 text-white shadow-lg dark:border-white dark:bg-white dark:text-stone-900'
                          : 'border-transparent bg-white/50 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10'
                      }`}
                    >
                      <span className={`block text-[10px] uppercase tracking-[0.18em] ${active ? 'text-white/70 dark:text-stone-500' : 'text-stone-400'}`}>
                        {step.index}
                      </span>
                      <span className="mt-1 block font-serif text-xl leading-none">{step.title}</span>
                      <span className={`mt-1 block text-xs ${active ? 'text-white/75 dark:text-stone-600' : 'text-stone-500'}`}>
                        {step.hint}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <main className="min-w-0 pb-16">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default StudioShell;
