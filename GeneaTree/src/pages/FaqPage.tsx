import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="pt-6">
      <dt className="text-lg">
        <button 
          onClick={onToggle}
          className="text-left w-full flex justify-between items-center text-gray-900 dark:text-gray-300 focus:outline-none"
        >
          <span className="font-medium">{question}</span>
          <span className="ml-6 flex-shrink-0">
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-primary-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-primary-500" />
            )}
          </span>
        </button>
      </dt>
      <dd className={`mt-2 pr-12 ${isOpen ? 'block' : 'hidden'}`}>
        <p className="text-gray-600 dark:text-gray-400">
          {answer}
        </p>
      </dd>
    </div>
  );
};

const FaqPage: React.FC = () => {
  const [openItems, setOpenItems] = useState<{ [key: number]: boolean }>({
    0: true,  // First item open by default
  });

  const faqItems = [
    {
      question: "Comment commencer à créer mon arbre généalogique ?",
      answer: "Appuyez sur Commencer. L'assistant pose une question à la fois : un prénom, un nom, un genre, une date. Les oui et non servent seulement à décider s'il faut ouvrir une union, des enfants ou des parents. Chaque réponse libre est enregistrée, puis la vue de la démonstration se construit à côté."
    },
    {
      question: "Puis-je importer mes données depuis d'autres logiciels ?",
      answer: "Absolument ! GeneaTreePro prend en charge l'importation de fichiers GEDCOM, le format standard dans l'industrie de la généalogie. Vous pouvez également importer des données depuis des fichiers CSV ou Excel. Notre système d'importation intelligent vous aide à mapper vos données pour une intégration fluide."
    },
    {
      question: "Mes données sont-elles sécurisées ?",
      answer: "La sécurité de vos données est notre priorité absolue. Toutes les informations sont chiffrées selon les normes les plus élevées et stockées de manière sécurisée. Vous contrôlez entièrement qui peut voir votre arbre généalogique grâce à nos paramètres de confidentialité détaillés. Nous ne partageons jamais vos données avec des tiers sans votre consentement explicite."
    },
    {
      question: "Quelles sont les options d'abonnement disponibles ?",
      answer: "Nous proposons trois formules d'abonnement : Débutant, Familial et Professionnel. Chaque formule offre des fonctionnalités adaptées à différents besoins et budgets. Vous pouvez commencer avec la formule Débutant gratuite qui vous permet de créer un arbre de taille limitée. Consultez notre page de tarification pour plus de détails sur les fonctionnalités incluses dans chaque formule."
    },
    {
      question: "Comment puis-je partager mon arbre avec ma famille ?",
      answer: "Le partage est simple avec GeneaTreePro. Vous pouvez inviter des membres de votre famille par email, générer un lien de partage avec différents niveaux d'accès (lecture seule, édition limitée, édition complète), ou exporter votre arbre dans différents formats pour le partager hors ligne. Vous pouvez également créer un site web familial public ou privé directement depuis notre plateforme."
    }
  ];

  const toggleItem = (index: number) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Questions fréquentes</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Les réponses à vos questions
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-white/80 bg-white/80 px-6 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
          <dl className="divide-y divide-zinc-200 dark:divide-white/10">
            {faqItems.map((item, index) => (
              <FaqItem
                key={index}
                question={item.question}
                answer={item.answer}
                isOpen={!!openItems[index]}
                onToggle={() => toggleItem(index)}
              />
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;