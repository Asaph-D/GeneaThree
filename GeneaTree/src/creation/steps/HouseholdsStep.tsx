import React from 'react';
import { useCreation } from '../CreationContext';
import FoyerBoard from '../components/FoyerBoard';

const HouseholdsStep: React.FC = () => {
  const { draft, dispatch } = useCreation();
  if (!draft.anchorId) return null;

  return (
    <div className="space-y-10">
      <FoyerBoard
        anchorId={draft.anchorId}
        title="Chaque union a son couloir."
        lede="Les enfants naissent dans un foyer. Un second conjoint n'hérite pas des enfants du premier : il ouvre une autre union, avec son rang. Peu d'épouses, le rail les garde autour de l'ancre. Beaucoup d'épouses, l'ordre de rang les aligne sans les mélanger."
      />
      <div className="flex flex-wrap justify-between gap-3">
        <button
          type="button"
          onClick={() => dispatch({ type: 'set-step', step: 'origin' })}
          className="cursor-pointer rounded-full px-4 py-2.5 text-sm text-stone-500"
        >
          Retour à l'origine
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'set-step', step: 'branches' })}
          className="cursor-pointer rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-stone-900"
        >
          Étendre les branches
        </button>
      </div>
    </div>
  );
};

export default HouseholdsStep;
