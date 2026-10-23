import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { BackgroundBeams, gallery, ImageSwitch, Spotlight } from '../components/aceternity/effects';

const people = [
  { src: gallery.portrait, title: 'Portrait', caption: 'Image d’ouverture de la plateforme' },
  ...gallery.scenes.slice(0, 5).map((src, index) => ({
    src,
    title: `Atelier ${index + 1}`,
    caption: 'Image provisoire, en attendant les portraits de l’équipe',
  })),
];

const AboutPage: React.FC = () => {
  useEffect(() => {
    document.title = 'À propos — GeneaTreePro';
  }, []);

  return (
    <div id="about" className="relative overflow-hidden py-16">
      <Spotlight />
      <BackgroundBeams />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base font-semibold uppercase tracking-wide text-primary-600">À propos</h2>
          <p className="mt-2 bg-gradient-to-b from-zinc-950 to-zinc-500 bg-clip-text font-serif text-5xl text-transparent dark:from-white dark:to-zinc-400">
            Notre histoire
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-zinc-600 dark:text-zinc-300">
            GeneaTreePro est né d’une passion pour l’histoire familiale et la technologie
          </p>
        </div>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-2">
          <ImageSwitch items={people} />
          <div>
            <div className="space-y-6 text-zinc-600 dark:text-zinc-300">
              <p>
                GeneaTreePro a été fondé en 2020 par une équipe de passionnés de généalogie et de développeurs. La mission est de rendre la lecture d’un lignage claire, y compris quand les unions se succèdent.
              </p>
              <p>
                L’histoire familiale est un patrimoine à préserver et à partager. La plateforme sert à poser les personnes, les rangs et les récits, puis à les relire dans la même vue.
              </p>
              <p>
                Les images se relaient : le portrait d’ouverture, puis des vues provisoires en attendant les portraits de celles et ceux qui construisent l’outil.
              </p>
            </div>
            <div className="mt-10 rounded-3xl border border-white/80 bg-white/80 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
              <h3 className="font-serif text-2xl text-zinc-950 dark:text-white">Notre vision</h3>
              <ul className="mt-4 space-y-3 text-zinc-600 dark:text-zinc-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 mt-0.5 h-5 w-5 text-primary-500" />
                  <span>Rendre la généalogie lisible, foyer après foyer</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 mt-0.5 h-5 w-5 text-primary-500" />
                  <span>Garder le rang des unions et le prénom tel qu’il se dit</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 mt-0.5 h-5 w-5 text-primary-500" />
                  <span>Relier les familles, les associations et les chercheurs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
