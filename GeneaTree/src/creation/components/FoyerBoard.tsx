import { Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import { useCreation } from '../CreationContext';
import {
  DraftPerson,
  formatRank,
  householdsOf,
  nextRank,
  personName,
} from '../model';
import PersonForm, { inputClass, labelClass } from './PersonForm';

const emptySpouse = (): Partial<DraftPerson> => ({
  firstName: '',
  lastName: '',
  gender: 'female',
  birthDate: '',
  city: '',
  region: '',
  country: '',
  occupation: '',
  deceased: false,
});

interface FoyerBoardProps {
  anchorId: string;
  title: string;
  lede: string;
}

const FoyerBoard: React.FC<FoyerBoardProps> = ({ anchorId, title, lede }) => {
  const { draft, dispatch } = useCreation();
  const anchor = draft.people[anchorId];
  const households = householdsOf(draft, anchorId);
  const [creating, setCreating] = useState(false);
  const [rank, setRank] = useState(() => nextRank(households, anchorId));
  const [spouse, setSpouse] = useState<Partial<DraftPerson>>(emptySpouse);
  const [childFor, setChildFor] = useState<string | null>(null);
  const [child, setChild] = useState<Partial<DraftPerson>>({ ...emptySpouse(), gender: 'unknown' });
  const [formError, setFormError] = useState('');

  if (!anchor) return null;

  const openCreate = () => {
    setRank(nextRank(householdsOf(draft, anchorId), anchorId));
    setSpouse(emptySpouse());
    setFormError('');
    setCreating(true);
  };

  const submitHousehold = () => {
    if (!spouse.firstName?.trim()) {
      setFormError('Le prénom du conjoint est nécessaire pour ouvrir le foyer.');
      return;
    }
    dispatch({ type: 'add-household', anchorId, spouse, rank });
    setCreating(false);
    setFormError('');
  };

  const submitChild = (householdId: string) => {
    if (!child.firstName?.trim()) {
      setFormError("Le prénom de l'enfant est nécessaire.");
      return;
    }
    dispatch({ type: 'add-child', householdId, child });
    setChild({ ...emptySpouse(), gender: 'unknown' });
    setChildFor(null);
    setFormError('');
  };

  return (
    <section className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-800 dark:text-amber-300">Foyers de {personName(anchor)}</p>
        <h2 className="mt-2 font-serif text-4xl leading-tight text-stone-900 dark:text-stone-50">{title}</h2>
        <p className="mt-3 text-base leading-relaxed text-stone-600 dark:text-stone-300">{lede}</p>
      </header>

      <div className="overflow-x-auto pb-2">
        <div className="mx-auto flex min-w-max flex-col items-center px-2">
          <article className="relative rounded-3xl border border-stone-200/80 bg-white/90 px-8 py-5 text-center shadow-[0_18px_40px_-28px_rgba(28,25,23,0.65)] dark:border-white/10 dark:bg-white/10">
            <p className="font-serif text-2xl text-stone-900 dark:text-white">{personName(anchor)}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">Ancre</p>
          </article>

          {households.length > 0 && <div className="h-8 w-px bg-stone-400/80 dark:bg-stone-500" />}

          {households.length > 0 && (
            <div className="relative flex items-stretch gap-4 pt-6">
              <div className="pointer-events-none absolute left-10 right-10 top-0 h-px bg-stone-400/80 dark:bg-stone-500" />
              {households.map((household) => {
                const spousePerson = household.spouseId ? draft.people[household.spouseId] : null;
                return (
                  <article
                    key={household.id}
                    className="relative w-72 rounded-3xl border border-stone-200/80 bg-white/85 p-5 shadow-[0_16px_40px_-30px_rgba(28,25,23,0.8)] dark:border-white/10 dark:bg-[#1c1917]/80"
                  >
                    <div className="absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 -translate-y-full bg-stone-400/80 dark:bg-stone-500" />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-300">
                          <span className="inline-block h-2.5 w-2.5 rotate-45 bg-amber-700 dark:bg-amber-400" />
                          {formatRank(household.rank)}
                        </p>
                        <h3 className="mt-2 font-serif text-2xl text-stone-900 dark:text-white">
                          {personName(spousePerson)}
                        </h3>
                      </div>
                      <label className="text-right">
                        <span className="block text-[10px] uppercase tracking-wider text-stone-400">Rang</span>
                        <input
                          type="number"
                          min={1}
                          value={household.rank}
                          onChange={(e) =>
                            dispatch({
                              type: 'set-rank',
                              householdId: household.id,
                              rank: Number(e.target.value),
                            })
                          }
                          className="w-14 rounded-lg border border-stone-200 bg-white px-2 py-1 text-center text-sm dark:border-white/10 dark:bg-white/5"
                        />
                      </label>
                    </div>

                    <ul className="mt-4 space-y-2">
                      {household.childIds.map((childId) => (
                        <li
                          key={childId}
                          className="flex items-center justify-between rounded-2xl bg-stone-100/80 px-3 py-2 text-sm dark:bg-white/5"
                        >
                          <span>{personName(draft.people[childId])}</span>
                          <button
                            type="button"
                            aria-label={`Retirer ${personName(draft.people[childId])} de ce foyer`}
                            onClick={() => dispatch({ type: 'remove-child', householdId: household.id, personId: childId })}
                            className="cursor-pointer rounded-full p-1 text-stone-400 hover:bg-white hover:text-stone-800 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                      {household.childIds.length === 0 && (
                        <li className="rounded-2xl border border-dashed border-stone-300 px-3 py-3 text-sm text-stone-500 dark:border-white/15 dark:text-stone-400">
                          Aucun enfant dans ce foyer.
                        </li>
                      )}
                    </ul>

                    {childFor === household.id ? (
                      <div className="mt-4 space-y-3 rounded-2xl bg-stone-50 p-3 dark:bg-white/5">
                        <PersonForm
                          compact
                          idPrefix={`child-${household.id}`}
                          value={{
                            firstName: child.firstName ?? '',
                            lastName: child.lastName ?? '',
                            gender: child.gender ?? 'unknown',
                            birthDate: child.birthDate ?? '',
                            city: child.city ?? '',
                            region: child.region ?? '',
                            country: child.country ?? '',
                            occupation: child.occupation ?? '',
                            deceased: child.deceased ?? false,
                          }}
                          onChange={(patch) => setChild((prev) => ({ ...prev, ...patch }))}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => submitChild(household.id)}
                            className="cursor-pointer rounded-full bg-stone-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-stone-900"
                          >
                            Ajouter l'enfant
                          </button>
                          <button
                            type="button"
                            onClick={() => setChildFor(null)}
                            className="cursor-pointer rounded-full px-3 py-2 text-sm text-stone-500"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setChildFor(household.id);
                          setChild({ ...emptySpouse(), gender: 'unknown' });
                          setFormError('');
                        }}
                        className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 py-2.5 text-sm text-stone-600 transition hover:border-primary-400 hover:text-primary-800 dark:border-white/15 dark:text-stone-300"
                      >
                        <Plus className="h-4 w-4" />
                        Enfant de ce foyer
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'remove-household', householdId: household.id })}
                      title="Les personnes restent dans le lignage, simplement détachées de cette union."
                      className="mt-3 cursor-pointer text-xs text-stone-400 underline-offset-2 hover:text-red-700 hover:underline"
                    >
                      Retirer ce foyer
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {formError && <p className="text-sm text-red-700 dark:text-red-300">{formError}</p>}

      {creating ? (
        <div className="rounded-[28px] border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/80 p-6 shadow-[0_24px_50px_-36px_rgba(146,64,14,0.8)] dark:border-amber-300/20 dark:from-white/5 dark:to-amber-400/5 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="font-serif text-3xl text-stone-900 dark:text-white">Nouveau foyer</h3>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                Le rang distingue les unions d'une même personne. Il ordonne le rail, et il restera disponible pour une lecture du lignage.
              </p>
            </div>
            <label>
              <span className={labelClass}>Rang</span>
              <input
                type="number"
                min={1}
                value={rank}
                onChange={(e) => setRank(Number(e.target.value))}
                className={`${inputClass} w-24`}
              />
            </label>
          </div>
          <div className="mt-6">
            <PersonForm
              idPrefix="new-spouse"
              value={{
                firstName: spouse.firstName ?? '',
                lastName: spouse.lastName ?? '',
                gender: spouse.gender ?? 'female',
                birthDate: spouse.birthDate ?? '',
                city: spouse.city ?? '',
                region: spouse.region ?? '',
                country: spouse.country ?? '',
                occupation: spouse.occupation ?? '',
                deceased: spouse.deceased ?? false,
              }}
              onChange={(patch) => setSpouse((prev) => ({ ...prev, ...patch }))}
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={submitHousehold}
              className="cursor-pointer rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-amber-200 dark:text-stone-900"
            >
              Ouvrir le foyer
            </button>
            <button type="button" onClick={() => setCreating(false)} className="cursor-pointer rounded-full px-4 py-2.5 text-sm text-stone-500">
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openCreate}
          className="group flex w-full cursor-pointer items-center justify-between rounded-[28px] border border-dashed border-stone-300 bg-white/40 px-6 py-5 text-left transition hover:-translate-y-0.5 hover:border-amber-700/40 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <span>
            <span className="block font-serif text-2xl text-stone-900 dark:text-white">Ouvrir un foyer</span>
            <span className="mt-1 block text-sm text-stone-500 dark:text-stone-400">
              Une union, un rang, puis seulement les enfants de cette union.
            </span>
          </span>
          <Plus className="h-6 w-6 text-amber-800 transition group-hover:rotate-90 dark:text-amber-300" />
        </button>
      )}
    </section>
  );
};

export default FoyerBoard;
