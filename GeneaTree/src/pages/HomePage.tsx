import React, { useEffect, useState } from 'react';
import { gallery, InfiniteRow } from '../components/aceternity/effects';
import Hero from '../components/home/Hero';
import FeaturesSection from '../components/home/FeaturesSection';
import CtaSection from '../components/home/CtaSection';

const strip = [
  { src: gallery.portrait, alt: 'Portrait' },
  ...gallery.scenes.map((src, index) => ({ src, alt: `Scène ${index + 1}` })),
];

const lines = [
  { title: 'Des bandes, pas un enchevêtrement', text: 'Chaque génération reste horizontale. Le regard suit le lignage sans chercher le fil.' },
  { title: 'Le rang de l’union', text: 'Le premier conjoint, puis le suivant. Les enfants restent dans la colonne de leur union.' },
  { title: 'Une question à la fois', text: 'L’assistant demande un prénom, un nom, un lien. La vue se dessine pendant la réponse.' },
  { title: 'Frères et sœurs', text: 'Ils se placent à côté, sous les mêmes parents, dans la même rangée.' },
  { title: 'L’oncle', text: 'C’est le frère du père ou de la mère. Il apparaît à côté de ce parent, sous leur père.' },
  { title: 'Le grand-père', text: 'Le père du père, ou le père de la mère. Il ouvre la rangée au-dessus.' },
];

const HomePage: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(true);
  const line = lines[index];

  useEffect(() => {
    let fade = 0;
    const tick = window.setInterval(() => {
      setShown(false);
      fade = window.setTimeout(() => {
        setIndex((current) => (current + 1) % lines.length);
        setShown(true);
      }, 700);
    }, 5600);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(fade);
    };
  }, []);

  return (
    <div>
      <Hero />
      <div className="relative mx-auto grid max-w-7xl items-start gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="relative min-w-0 overflow-hidden">
          <InfiniteRow images={strip} />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#f4f1ea] via-[#f4f1ea]/85 to-transparent dark:from-[#09090b] dark:via-[#09090b]/85 sm:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#f4f1ea] via-[#f4f1ea]/85 to-transparent dark:from-[#09090b] dark:via-[#09090b]/85 sm:w-24" />
        </div>
        <div className={`transition-opacity duration-700 ${shown ? 'opacity-100' : 'opacity-0'}`}>
          <p className="font-serif text-2xl text-zinc-900 dark:text-zinc-100">{line.title}</p>
          <p className="mt-2 max-w-md text-base leading-relaxed text-zinc-600 dark:text-zinc-300">{line.text}</p>
        </div>
      </div>
      <FeaturesSection />
      <CtaSection />
    </div>
  );
};

export default HomePage;
