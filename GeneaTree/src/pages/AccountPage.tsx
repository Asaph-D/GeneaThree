import { Download, LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import React from 'react';
import { useAuth } from '../auth/AuthContext';

export default function AccountPage() {
  const { user, configured, signOut } = useAuth();
  if (!user) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="font-serif text-3xl">Votre compte</h1><p className="mt-3 text-zinc-500">Connectez-vous pour retrouver votre profil et vos arbres synchronisés.</p></div>;
  const avatar = user.user_metadata.avatar_url as string | undefined;
  const name = (user.user_metadata.full_name as string | undefined) || user.email;
  const exportProfile = () => {
    const blob = new Blob([JSON.stringify({ id: user.id, email: user.email, profile: user.user_metadata, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'geneatree-compte.json';
    link.click();
    URL.revokeObjectURL(url);
  };
  return <div className="mx-auto w-full max-w-3xl px-4 py-14"><section className="rounded-3xl border border-zinc-200 bg-white/85 p-6 shadow-xl dark:border-white/10 dark:bg-zinc-900/80"><div className="flex items-center gap-4">{avatar ? <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-full bg-primary-100 text-2xl font-bold text-primary-800">{name?.charAt(0).toUpperCase()}</div>}<div><h1 className="text-xl font-semibold">{name}</h1><p className="text-sm text-zinc-500">{user.email}</p><p className="mt-1 flex items-center gap-1 text-xs text-emerald-600"><ShieldCheck size={13} /> Compte synchronisé</p></div></div><div className="mt-8 grid gap-3 sm:grid-cols-2"><button onClick={exportProfile} className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-sm dark:border-white/10"><Download size={16} /> Exporter mon profil</button><button disabled title="La suppression sécurisée sera reliée au backend" className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm text-red-400 opacity-60"><Trash2 size={16} /> Suppression sécurisée</button></div><button onClick={() => void signOut()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white dark:bg-white dark:text-zinc-950"><LogOut size={16} /> Déconnexion</button>{!configured && <p className="mt-4 text-xs text-amber-600">Configurez Supabase pour activer la synchronisation.</p>}</section></div>;
}
