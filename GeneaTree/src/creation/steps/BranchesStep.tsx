import React, { useMemo, useState } from 'react';
import { useCreation } from '../CreationContext';
import FoyerBoard from '../components/FoyerBoard';
import PersonForm from '../components/PersonForm';
import {
  DraftPerson,
  formatRank,
  originHousehold,
  personName,
  personSummary,
} from '../model';

const panelLabel = 'mb-3 text-xs font-medium uppercase tracking-[0.14em] text-stone-500';

const emptyAdult = (gender: DraftPerson['gender']): Partial<DraftPerson> => ({
  firstName: '',
  lastName: '',
  gender,
  birthDate: '',
  city: '',
  region: '',
  country: '',
  occupation: '',
  deceased: false,
});

const BranchesStep: React.FC = () => {
  const { draft, dispatch } = useCreation();
  const people = useMemo(() => Object.values(draft.people), [draft.people]);
  const [selectedId, setSelectedId] = useState(draft.anchorId ?? people[0]?.id ?? '');
  const [panel, setPanel] = useState<'foyers' | 'origine'>('foyers');
  const [anchor, setAnchor] = useState<Partial<DraftPerson>>(emptyAdult('male'));
  const [spouse, setSpouse] = useState<Partial<DraftPerson>>(emptyAdult('female'));
  const [withSpouse, setWithSpouse] = useState(true);
  const [error, setError] = useState('');

  const selected = draft.people[selectedId];
  const origin = selected ? originHousehold(draft, selected.id) : undefined;

  const choose = (id: string) => {
    setSelectedId(id);
    setPanel('foyers');
    setError('');
  };

  const createOrigin = () => {
    if (!selected) return;
    if (!anchor.firstName?.trim()) {
      setError('Le prénom du parent qui ouvre le foyer est nécessaire.');
      return;
    }
    if (withSpouse && !spouse.firstName?.trim()) {
      setError("Le prénom de l'autre parent est nécessaire, ou décochez cette option.");
      return;
    }
    dispatch({
      type: 'attach-origin',
      personId: selected.id,
      anchor,
      spouse: withSpouse ? spouse : null,
      rank: 1,
    });
    setAnchor(emptyAdult('male'));
    setSpouse(emptyAdult('female'));
    setError('');
  };

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary-700 dark:text-primary-300">Branches</p>
        <h2 className="mt-2 font-serif text-4xl leading-tight">Ouvrir une personne, pas une catégorie.</h2>
        <p className="mt-3 text-base leading-relaxed text-stone-600 dark:text-stone-300">
          Un oncle est le frère du parent, dans le foyer d'origine. Un cousin est l'enfant du foyer de cet oncle. On ne les ajoute pas sur la même liste que les fils.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-2">
          {people.map((person) => {
            const active = person.id === selectedId;
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => choose(person.id)}
                className={`w-full cursor-pointer rounded-2xl border px-3 py-3 text-left transition ${
                  active
                    ? 'border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-stone-900'
                    : 'border-stone-200/80 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/5'
                }`}
              >
                <span className="block font-medium">{personName(person)}</span>
                <span className={`mt-1 block text-xs leading-relaxed ${active ? 'text-white/70 dark:text-stone-500' : 'text-stone-500'}`}>
                  {personSummary(draft, person.id)}
                </span>
              </button>
            );
          })}
        </aside>

        {selected && (
          <div className="min-w-0 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-full bg-white/80 p-1 dark:bg-white/10">
                <button
                  type="button"
                  onClick={() => setPanel('foyers')}
                  className={`cursor-pointer rounded-full px-4 py-2 text-sm ${panel === 'foyers' ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'text-stone-600 dark:text-stone-300'}`}
                >
                  Ses foyers
                </button>
                <button
                  type="button"
                  onClick={() => setPanel('origine')}
                  className={`cursor-pointer rounded-full px-4 py-2 text-sm ${panel === 'origine' ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'text-stone-600 dark:text-stone-300'}`}
                >
                  Son origine
                </button>
              </div>
              {selected.id !== draft.anchorId && (
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'remove-person', personId: selected.id });
                    setSelectedId(draft.anchorId ?? '');
                  }}
                  className="cursor-pointer text-sm text-stone-400 hover:text-red-700"
                >
                  Retirer {personName(selected)}
                </button>
              )}
            </div>

            {panel === 'foyers' && (
              <FoyerBoard
                key={selected.id}
                anchorId={selected.id}
                title={`Les unions de ${personName(selected)}`}
                lede="Même règle que pour le fondateur : un foyer, un rang, les enfants de cette union seulement. Une épouse peut ensuite être sélectionnée pour ouvrir ses propres foyers."
              />
            )}

            {panel === 'origine' && origin && (
              <section className="rounded-[28px] border border-stone-200/80 bg-white/80 p-6 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.16em] text-amber-800 dark:text-amber-300">{formatRank(origin.rank)}</p>
                <h3 className="mt-2 font-serif text-3xl">
                  {personName(draft.people[origin.anchorId])}
                  {origin.spouseId ? ` et ${personName(draft.people[origin.spouseId])}` : ''}
                </h3>
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                  {personName(selected)} est enfant de ce foyer
                  {origin.childIds.length > 1
                    ? `, avec ${origin.childIds.filter((id) => id !== selected.id).map((id) => personName(draft.people[id])).join(', ')}`
                    : ''}
                  .
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(origin.anchorId);
                    setPanel('foyers');
                  }}
                  className="mt-5 cursor-pointer rounded-full bg-stone-900 px-5 py-2.5 text-sm text-white dark:bg-white dark:text-stone-900"
                >
                  Modifier ce foyer
                </button>
              </section>
            )}

            {panel === 'origine' && !origin && (
              <section className="rounded-[28px] border border-stone-200/80 bg-white/80 p-6 dark:border-white/10 dark:bg-white/5 sm:p-8">
                <h3 className="font-serif text-3xl">D'où vient {personName(selected)} ?</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                  Créez le foyer des parents. {personName(selected)} y entre comme enfant. Les frères et sœurs s'ajoutent ensuite dans ce foyer, pas à côté des cousins.
                </p>
                <div className="mt-6 space-y-6">
                  <div>
                    <p className={panelLabel}>Parent qui ouvre le foyer</p>
                    <PersonForm
                      compact
                      idPrefix="origin-anchor"
                      value={{
                        firstName: anchor.firstName ?? '',
                        lastName: anchor.lastName ?? '',
                        gender: anchor.gender ?? 'male',
                        birthDate: anchor.birthDate ?? '',
                        city: anchor.city ?? '',
                        region: anchor.region ?? '',
                        country: anchor.country ?? '',
                        occupation: anchor.occupation ?? '',
                        deceased: anchor.deceased ?? false,
                      }}
                      onChange={(patch) => setAnchor((prev) => ({ ...prev, ...patch }))}
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-3 text-sm">
                    <input type="checkbox" checked={withSpouse} onChange={(e) => setWithSpouse(e.target.checked)} />
                    Ajouter l'autre parent dans ce même foyer
                  </label>
                  {withSpouse && (
                    <div>
                      <p className={panelLabel}>Autre parent</p>
                      <PersonForm
                        compact
                        idPrefix="origin-spouse"
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
                  )}
                </div>
                {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
                <button
                  type="button"
                  onClick={createOrigin}
                  className="mt-6 cursor-pointer rounded-full bg-amber-800 px-5 py-2.5 text-sm font-medium text-white"
                >
                  Rattacher à ce foyer
                </button>
              </section>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-between gap-3">
        <button
          type="button"
          onClick={() => dispatch({ type: 'set-step', step: 'households' })}
          className="cursor-pointer rounded-full px-4 py-2.5 text-sm text-stone-500"
        >
          Retour aux foyers
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'set-step', step: 'review' })}
          className="cursor-pointer rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-stone-900"
        >
          Lire le lignage
        </button>
      </div>
    </div>
  );
};

export default BranchesStep;
