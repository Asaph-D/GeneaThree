import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export const gallery = {
  portrait: '/gallery/portrait.jpg',
  scenes: [1, 2, 3, 4, 5, 6, 7, 8].map((index) => `/gallery/scene-${index}.jpg`),
};

export const Spotlight: React.FC<{ className?: string }> = ({ className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const move = (event: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      node.style.setProperty('--sx', `${event.clientX - rect.left}px`);
      node.style.setProperty('--sy', `${event.clientY - rect.top}px`);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return (
    <div ref={ref} className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/25 blur-3xl" style={{ left: 'var(--sx, 20%)', top: 'var(--sy, 12%)' }} />
      <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-amber-200/20 blur-3xl dark:bg-amber-400/10" />
    </div>
  );
};

export const BackgroundBeams: React.FC = () => (
  <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-30" viewBox="0 0 800 400" preserveAspectRatio="none" aria-hidden>
    {['M-20,320 C180,80 320,360 820,40', 'M-20,80 C220,300 420,20 820,260', 'M40,400 C200,180 500,420 780,80'].map((d, index) => (
      <path key={d} d={d} fill="none" stroke={index === 1 ? '#f6b455' : '#38bdf8'} strokeWidth="1.2" className="genea-beam" style={{ animationDelay: `${index * -2}s` }} />
    ))}
  </svg>
);

export const WaveDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`pointer-events-none text-[#f4f1ea] dark:text-[#09090b] ${className}`}>
    <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="block h-20 w-full sm:h-28" aria-hidden>
      <path fill="currentColor" d="M0,72 C180,120 320,8 560,48 C820,92 980,8 1440,64 L1440,120 L0,120 Z" />
    </svg>
  </div>
);

export const Meteors: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
    {[0, 1, 2, 3, 4].map((index) => (
      <span
        key={index}
        className="genea-meteor absolute top-0 h-0.5 w-24 bg-gradient-to-r from-transparent to-sky-300"
        style={{ left: `${12 + index * 18}%`, animationDelay: `${index * 0.7}s` }}
      />
    ))}
  </div>
);

export const Lamp: React.FC<{ kicker: string; title: string; text: string }> = ({ kicker, title, text }) => (
  <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 pt-16 text-center">
    <div className="pointer-events-none absolute top-0 h-40 w-[28rem] rounded-full bg-primary-400/30 blur-3xl dark:bg-primary-500/20" />
    <p className="relative text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">{kicker}</p>
    <h1 className="relative mt-3 bg-gradient-to-b from-zinc-950 to-zinc-500 bg-clip-text font-serif text-5xl leading-[1.05] text-transparent dark:from-white dark:to-zinc-400 sm:text-6xl">
      {title}
    </h1>
    <p className="relative mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">{text}</p>
  </div>
);

export const MovingBorder: React.FC<{ to: string; children: React.ReactNode; className?: string }> = ({ to, children, className = '' }) => (
  <Link to={to} className={`relative inline-flex overflow-hidden rounded-full p-[1px] ${className}`}>
    <span className="genea-spin absolute inset-[-100%] bg-[conic-gradient(from_90deg,transparent_40%,#38bdf8_50%,#f6b455_58%,transparent_70%)]" />
    <span className="relative inline-flex items-center rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-zinc-950">
      {children}
    </span>
  </Link>
);

export const InfiniteRow: React.FC<{ images: { src: string; alt: string }[]; frameClass?: string }> = ({ images, frameClass = 'h-28 w-44 sm:h-36 sm:w-56' }) => {
  const loop = [...images, ...images];
  return (
    <div className="overflow-hidden">
      <div className="genea-marquee flex w-max gap-3">
        {loop.map((image, index) => (
          <img key={`${image.src}-${index}`} src={image.src} alt={image.alt} className={`shrink-0 rounded-2xl object-cover shadow-sm ${frameClass}`} />
        ))}
      </div>
    </div>
  );
};

export const TiltCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const move = (event: React.MouseEvent) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.transform = `rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
  };
  return (
    <div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={() => { if (ref.current) ref.current.style.transform = ''; }}
      className={`transition-transform duration-200 ${className}`}
    >
      {children}
    </div>
  );
};

interface SwitchItem {
  src: string;
  title: string;
  caption: string;
}

export const ImageSwitch: React.FC<{ items: SwitchItem[] }> = ({ items }) => {
  const [index, setIndex] = useState(0);
  const current = items[index] ?? items[0];
  return (
    <div>
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-zinc-950 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.55)] dark:border-white/10">
        <img key={current.src} src={current.src} alt={current.title} className="aspect-[4/5] w-full object-cover object-[center_22%]" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/80 to-transparent p-4 text-white">
          <p className="font-serif text-2xl">{current.title}</p>
          <p className="text-sm text-white/80">{current.caption}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item, itemIndex) => (
          <button
            key={item.src}
            type="button"
            onClick={() => setIndex(itemIndex)}
            className={`overflow-hidden rounded-xl border ${itemIndex === index ? 'border-primary-500 ring-2 ring-primary-400' : 'border-transparent opacity-70 hover:opacity-100'}`}
            aria-label={item.title}
          >
            <img src={item.src} alt="" className="h-14 w-16 object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};
