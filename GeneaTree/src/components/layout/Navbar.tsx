import { Menu, Moon, Sun, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

interface NavbarProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const links = [
  { to: '/quick-start', label: 'Horizons' },
  { to: '/atelier', label: 'Découvrir' },
  { to: '/demo', label: 'Démonstration' },
  { to: '/about', label: 'À propos' },
  { to: '/faq', label: 'FAQ' },
];

const desktopLink = 'rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-zinc-700 transition-colors duration-300 hover:bg-zinc-100 hover:text-primary-700 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-primary-300';
const mobileLink = 'block rounded-xl px-3 py-3 text-[15px] font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800';

const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const close = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isMenuOpen]);

  const themeButton = (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
      aria-label={darkMode ? 'Passer au thème clair' : 'Passer au thème sombre'}
    >
      {darkMode ? <Sun className="h-5 w-5 text-yellow-300" /> : <Moon className="h-5 w-5" />}
    </button>
  );

  return (
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl transition-colors duration-300 dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="rounded-lg px-1 py-1.5">
            <span className="flex items-center">
              <img src="/brand/geneatree-mark.svg" alt="" className="h-7 w-7" />
              <span className="ml-2 text-base font-semibold text-zinc-900 dark:text-white">
                GeneaTree<span className="text-primary-600">Pro</span>
              </span>
            </span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={darkMode ? 'Passer au thème clair' : 'Passer au thème sombre'}
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-300" /> : <Moon className="h-5 w-5 text-zinc-600" />}
            </button>
            {links.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `${desktopLink} ${isActive ? 'bg-zinc-100 text-primary-700 dark:bg-zinc-800 dark:text-primary-300' : ''}`}>
                {item.label}
              </NavLink>
            ))}
            <Link to="/assistant?new=1" className="ml-3 inline-flex items-center rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(79,70,229,0.9)] transition hover:from-sky-400 hover:to-indigo-500">
              Créer
            </Link>
          </div>
          <div className="flex items-center gap-1 md:hidden">
            {themeButton}
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="px-3 pb-3 md:hidden">
          <div className="rounded-2xl border border-zinc-200/80 bg-[#f4f1ea]/95 p-2 shadow-[0_24px_50px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) => `${mobileLink} ${isActive ? 'bg-white text-primary-800 dark:bg-zinc-900 dark:text-primary-200' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/assistant?new=1"
              onClick={() => setIsMenuOpen(false)}
              className="mt-1 block rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-3 py-3 text-center text-[15px] font-semibold text-white hover:from-sky-400 hover:to-indigo-500"
            >
              Créer
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
