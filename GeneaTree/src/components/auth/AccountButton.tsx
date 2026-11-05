import { LogIn, LogOut, Settings, UserRound } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function AccountButton() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error'>('saved');
  const host = useRef<HTMLDivElement>(null);
  const avatar = user?.user_metadata.avatar_url as string | undefined;
  const name = (user?.user_metadata.full_name as string | undefined) || user?.email || 'Mon compte';

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => !host.current?.contains(event.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  useEffect(() => {
    const update = (event: Event) => setSaveState((event as CustomEvent<'saving' | 'saved' | 'error'>).detail);
    window.addEventListener('geneatree:save-state', update);
    return () => window.removeEventListener('geneatree:save-state', update);
  }, []);

  if (loading) return <span className="h-9 w-9 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />;
  if (!user) {
    return (
      <Link to="/signin" aria-label="Se connecter" className="grid h-9 w-9 place-items-center rounded-full border border-zinc-300 text-zinc-700 hover:border-primary-500 hover:text-primary-600 dark:border-white/15 dark:text-zinc-200">
        <LogIn size={17} />
      </Link>
    );
  }

  return (
    <div ref={host} className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={`Ouvrir mon compte, arbre ${saveState === 'saved' ? 'sauvegardé' : saveState === 'saving' ? 'en cours de sauvegarde' : 'non sauvegardé'}`} className="relative grid h-9 w-9 overflow-visible rounded-full border-2 border-primary-500 bg-primary-100 text-sm font-bold text-primary-800">
        <span className={`absolute -bottom-0.5 -right-0.5 z-10 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-950 ${saveState === 'saved' ? 'bg-emerald-500' : saveState === 'saving' ? 'animate-pulse bg-amber-400' : 'bg-red-500'}`} />
        {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" className="h-full w-full overflow-hidden rounded-full object-cover" /> : name.charAt(0).toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-[70] w-64 rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-3 py-2 dark:border-white/10">
            <p className="truncate text-sm font-semibold">{name}</p><p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>
          <Link to="/account" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"><UserRound size={16} /> Profil</Link>
          <Link to="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"><Settings size={16} /> Paramètres</Link>
          <button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><LogOut size={16} /> Déconnexion</button>
        </div>
      )}
    </div>
  );
}
