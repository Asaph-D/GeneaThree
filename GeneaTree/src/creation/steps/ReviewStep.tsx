import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { draftToSnapshot, formatRank, generationMap, householdsOf, personName } from '../model';
import { useCreation } from '../CreationContext';
import { saveFamily, usesLocalFamilyService } from '../../services/familyGateway';

const ReviewStep: React.FC = () => {
  const { draft, dispatch } = useCreation();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const generations = generationMap(draft);
  const maxGen = Math.max(0, ...generations.values());
  const bands = Array.from({ length: maxGen + 1 }, (_, index) => index);
  const local = usesLocalFamilyService();

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const snapshot = draftToSnapshot(draft);
      await saveFamily(snapshot.persons, snapshot.marriages);
      if (draft.anchorId) localStorage.setItem('focusPerson', draft.anchorId);
      navigate('/demo');
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary-700 dark:text-primary-300">Lecture</p>
        <h2 className="mt-2 font-serif text-4xl leading-tight">Le lignage avant le dessin.</h2>
        <p className="mt-3 text-base leading-relaxed text-stone-600 dark:text-stone-300">
          Une personne reste une carte. Les demi-frères partagent un parent, pas la même liste d'enfants. Le rang de chaque union est conservé.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Personnes', value: Object.keys(draft.people).length },
          { label: 'Foyers', value: draft.households.length },
          { label: 'Générations', value: Object.keys(draft.people).length ? maxGen + 1 : 0 },
        ].map((stat) => (
          <article key={stat.label} className="rounded-3xl border border-stone-200/80 bg-white/80 px-5 py-4 dark:border-white/10 dark:bg-white/5">
            <p className="font-serif text-4xl">{stat.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-stone-500">{stat.label}</p>
          </article>
        ))}
      </div>

      <div className="space-y-6">
        {bands.map((band) => {
          const members = Object.values(draft.people).filter((person) => generations.get(person.id) === band);
          if (members.length === 0) return null;
          return (
            <section key={band}>
              <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">Génération {band}</h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {members.map((person) => {
                  const own = householdsOf(draft, person.id);
                  const asSpouse = draft.households.filter((household) => household.spouseId === person.id);
                  const detail = own.length
                    ? own
                        .map((household) => {
                          const spouse = household.spouseId ? draft.people[household.spouseId] : null;
                          return `${formatRank(household.rank)} avec ${personName(spouse)} · ${household.childIds.length} enfant${household.childIds.length > 1 ? 's' : ''}`;
                        })
                        .join(' — ')
                    : asSpouse.length
                      ? asSpouse
                          .map(
                            (household) =>
                              `${formatRank(household.rank)} auprès de ${personName(draft.people[household.anchorId])}`
                          )
                          .join(' — ')
                      : 'Sans foyer en propre';
                  return (
                  <li key={person.id} className="rounded-2xl bg-white/75 px-4 py-3 dark:bg-white/5">
                    <p className="font-medium">{personName(person)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-500">
                      {detail}
                    </p>
                  </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="max-w-2xl text-sm leading-relaxed text-stone-500 dark:text-stone-400">
        {local
          ? "L'interrupteur local est actif : l'arbre est gardé sur cet appareil, sans appeler le serveur."
          : 'L’interrupteur local est éteint : l’enregistrement tente de joindre le serveur.'}
      </p>

      {error && <p className="text-sm text-red-700 dark:text-red-300">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: 'set-step', step: 'branches' })}
            className="cursor-pointer rounded-full px-4 py-2.5 text-sm text-stone-500"
          >
            Retour aux branches
          </button>
          {confirmReset ? (
            <button
              type="button"
              onClick={() => dispatch({ type: 'reset' })}
              className="cursor-pointer rounded-full px-4 py-2.5 text-sm text-red-700"
            >
              Confirmer l'effacement
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="cursor-pointer rounded-full px-4 py-2.5 text-sm text-stone-400"
            >
              Recommencer
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || Object.keys(draft.people).length === 0}
          className="cursor-pointer rounded-full bg-primary-700 px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Enregistrement…' : "Enregistrer et ouvrir l'arbre"}
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;
