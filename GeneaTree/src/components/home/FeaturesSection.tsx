import React from 'react';
import FeatureCard from './FeatureCard';
import { Network as Network2, FolderEdit as UserEdit, File as FileExport, UploadCloud as CloudUpload, Search, Puzzle } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Network2 />,
      title: "Visualisation avancée",
      description: "Explorez votre arbre avec plusieurs modes de visualisation adaptés à vos besoins : arbre traditionnel, radial, ou chronologique.",
      items: [
        "Distinction visuelle des genres",
        "Zoom et navigation fluides",
        "Infobulles détaillées"
      ]
    },
    {
      icon: <UserEdit />,
      title: "Édition professionnelle",
      description: "Gérez facilement les informations familiales complètes avec notre éditeur intuitif et notre système de relations avancé.",
      items: [
        "Ajout d'attributs personnalisés",
        "Relations familiales complexes",
        "Historique des modifications"
      ]
    },
    {
      icon: <FileExport />,
      title: "Export & Partage",
      description: "Exportez votre arbre dans divers formats et partagez-le facilement avec votre famille ou d'autres chercheurs.",
      items: [
        "PDF haute qualité",
        "Formats GEDCOM, CSV, JSON",
        "Partage privé ou public"
      ]
    },
    {
      icon: <CloudUpload />,
      title: "Sauvegarde sécurisée",
      description: "Toutes vos données sont sauvegardées en toute sécurité dans le cloud avec des options de restauration complètes.",
      items: [
        "Synchronisation multi-appareils",
        "Sauvegarde automatique",
        "Historique de versions"
      ]
    },
    {
      icon: <Search />,
      title: "Recherche intelligente",
      description: "Trouvez rapidement n'importe quel membre de votre famille grâce à notre moteur de recherche avancé.",
      items: [
        "Filtres multiples",
        "Recherche par période",
        "Recherche par lieu"
      ]
    },
    {
      icon: <Puzzle />,
      title: "Intégration facile",
      description: "Connectez-vous avec d'autres services généalogiques et importez facilement vos données existantes.",
      items: [
        "Import GEDCOM",
        "API pour développeurs",
        "Compatibilité multi-formats"
      ]
    }
  ];

  return (
    <div id="features" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Fonctionnalités</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Une expérience généalogique complète
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">
            Des outils professionnels pour explorer, sauvegarder et partager votre histoire familiale
          </p>
        </div>

        <div className="mt-16">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                items={feature.items}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;