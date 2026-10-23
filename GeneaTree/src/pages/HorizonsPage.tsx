import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { gallery, InfiniteRow, Lamp, Meteors, MovingBorder, Spotlight, TiltCard } from '../components/aceternity/effects';

const sections = [
  {
    kicker: 'Opportunités',
    title: 'Ce que le lignage peut relier',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    items: [
      { title: 'Registres et récits', text: 'Faire entrer un acte, une date orale ou un lieu sans forcer une forme unique de foyer.' },
      { title: 'Unions au rang', text: 'Garder l’ordre des conjoints et les enfants de chaque union, chacun dans sa colonne.' },
      { title: 'Lecture partagée', text: 'Montrer le même arbre à la famille, avec un focus, des générations et un export.' },
    ],
  },
  {
    kicker: 'À venir',
    title: 'La suite du chantier',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
    items: [
      { title: 'Import GEDCOM', text: 'Reprendre un fichier existant et le poser sur la vue en bandes, sans perdre les unions.' },
      { title: 'Récit attaché', text: 'Une note, une voix ou une photo à côté du portrait, sans quitter la fiche.' },
      { title: 'Lieux', text: 'Relier une naissance à un village, puis retrouver les personnes nées au même endroit.' },
    ],
  },
  {
    kicker: 'Partenaires',
    title: 'Avec qui avancer',
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80',
    items: [
      { title: 'Familles', text: 'Celles qui tiennent le rang des unions et les prénoms tels qu’ils se disent.' },
      { title: 'Associations', text: 'Les cercles qui collectent les récits et veulent une lecture claire, pas un tableur.' },
      { title: 'Chercheurs', text: 'Ceux qui comparent des branches, des générations et des foyers recomposés.' },
    ],
  },
];

const online = [
  'https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80',
];

const HorizonsPage: React.FC = () => {
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Horizons — GeneaTreePro';
  }, []);

  const strip = [
    { src: gallery.portrait, alt: 'Portrait' },
    ...gallery.scenes.map((src, index) => ({ src, alt: `Scène ${index + 1}` })),
    ...online.map((src, index) => ({ src, alt: `Horizon ${index + 1}` })),
  ];

  return (
    <div className="relative overflow-hidden">
      <Spotlight />
      <Lamp
        kicker="Horizons"
        title="Ce qui s’ouvre autour de l’arbre"
        text="La création se fait avec l’assistant. Ici, les images, les pistes et les personnes avec qui avancer."
      />

      <div className="relative mx-auto mt-12 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-3 md:grid-cols-4 md:grid-rows-2">
          <TiltCard className="relative min-h-64 overflow-hidden rounded-3xl md:col-span-2 md:row-span-2">
            <img src={gallery.portrait} alt="Portrait" className="h-full min-h-64 w-full object-cover" />
            <p className="absolute bottom-4 left-4 font-serif text-3xl text-white">Le portrait qui ouvre</p>
          </TiltCard>
          {gallery.scenes.slice(0, 2).map((src, index) => (
            <div key={src} className="relative min-h-40 overflow-hidden rounded-3xl">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <p className="absolute bottom-3 left-3 text-sm text-white">Scène {index + 1}</p>
            </div>
          ))}
          {online.slice(0, 2).map((src) => (
            <div key={src} className="relative min-h-40 overflow-hidden rounded-3xl">
              <img src={src} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>

        <div className="mt-8">
          <InfiniteRow images={strip} />
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3" onMouseLeave={() => setFocus(null)}>
          {sections.map((section) => (
            <article
              key={section.kicker}
              onMouseEnter={() => setFocus(section.kicker)}
              className={`overflow-hidden rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl transition duration-300 dark:border-white/10 dark:bg-zinc-950/70 ${focus && focus !== section.kicker ? 'scale-[0.98] opacity-45' : 'opacity-100'}`}
            >
              <img src={section.image} alt="" className="h-40 w-full object-cover" />
              <div className="p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">{section.kicker}</p>
                <h2 className="mt-2 font-serif text-2xl text-zinc-950 dark:text-white">{section.title}</h2>
                <ul className="mt-4 space-y-3">
                  {section.items.map((item) => (
                    <li key={item.title}>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{item.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div className="relative mt-10 overflow-hidden rounded-3xl border border-white/80 bg-zinc-950 px-6 py-10 text-white dark:border-white/10">
          <Meteors />
          <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-serif text-3xl">Le prochain pas se prend avec l’assistant.</p>
              <p className="mt-2 max-w-xl text-sm text-white/70">Les images restent ici. Le prénom, le nom et les unions se posent dans la conversation.</p>
            </div>
            <MovingBorder to="/assistant">Commencer un arbre</MovingBorder>
          </div>
          <Link to="/demo" className="relative mt-4 inline-flex text-sm text-sky-200">Voir la démonstration</Link>
        </div>
      </div>
      <div className="h-16" />
    </div>
  );
};

export default HorizonsPage;
