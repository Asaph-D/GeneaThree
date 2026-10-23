import React, { useEffect, useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const items = [
  ['Comment créer mon arbre ?', 'Le bouton Créer ouvre un nouvel assistant guidé. Il recueille les personnes une à une, puis enregistre le résultat dans la Démonstration.'],
  ['Puis-je continuer directement dans la Démonstration ?', 'Oui. Activez le mode édition, choisissez une personne, puis ajoutez un parent, un conjoint ou un enfant. Un enfant est rattaché à l’union que vous sélectionnez.'],
  ['Que se passe-t-il si j’ouvre l’assistant par erreur ?', 'Votre arbre enregistré n’est pas effacé. Le bouton « Reprendre mon arbre » vous ramène immédiatement à la Démonstration, et le brouillon de l’assistant est conservé séparément.'],
  ['Comment attribuer des enfants existants à un nouveau conjoint ?', 'Lors de l’ajout du conjoint, activez « Parenter les enfants de X ». Seuls les enfants qui ne sont encore associés à aucune union reçoivent ce second parent.'],
  ['Où mes modifications sont-elles enregistrées ?', 'La Démonstration enregistre chaque modification du lignage. Selon la configuration du site, le stockage est local ou transmis au service GeneaTreePro.'],
  ['Puis-je partager ou imprimer mon arbre ?', 'Oui. Les commandes de la Démonstration permettent de partager, d’imprimer et d’exporter la vue en PDF.'],
];

const FaqPage: React.FC = () => {
  const [open, setOpen] = useState(0);
  useEffect(() => { document.title = 'FAQ — GeneaTreePro'; }, []);

  return (
    <main className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_65%)]" />
      <div className="relative mx-auto max-w-4xl">
        <div className="text-center">
          <HelpCircle className="mx-auto h-8 w-8 text-primary-600" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">Aide</p>
          <h1 className="mt-2 font-serif text-4xl text-zinc-950 dark:text-white sm:text-5xl">Questions fréquentes</h1>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-600 dark:text-zinc-300">Des réponses courtes, conformes au fonctionnement actuel de GeneaTreePro.</p>
        </div>
        <div className="mt-10 overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/80 px-5 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70 sm:px-7">
          {items.map(([question, answer], index) => (
            <section key={question} className="border-b border-zinc-200/80 py-1 last:border-0 dark:border-white/10">
              <button type="button" onClick={() => setOpen(open === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 py-5 text-left font-semibold text-zinc-900 dark:text-white" aria-expanded={open === index}>
                {question}<ChevronDown className={`h-5 w-5 shrink-0 text-primary-600 transition-transform ${open === index ? 'rotate-180' : ''}`} />
              </button>
              {open === index && <p className="max-w-3xl pb-5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{answer}</p>}
            </section>
          ))}
        </div>
        <div className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-300">Prêt à essayer ? <Link to="/assistant?new=1" className="font-semibold text-primary-700 hover:underline dark:text-primary-300">Créer mon arbre</Link></div>
      </div>
    </main>
  );
};

export default FaqPage;
