import { AlertCircle, Check, Copy, Link, Loader2 as LoaderCircle, Mail, ShieldCheck, UserRoundCog, X } from 'lucide-react';
import { useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import { Marriage, Person, TreeViewOptions } from '../../types/family';

interface TreeAccess { id: string; name: string; role: 'OWNER' | 'COLLABORATOR' | 'READER'; }
interface AccountResponse { trees: TreeAccess[]; }
export interface ShareModalProps { onClose: () => void; accessToken: string | null; persons: Person[]; marriages: Marriage[]; treeOptions: TreeViewOptions; }

export default function ShareModal({ onClose, accessToken, persons, marriages, treeOptions }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'READER' | 'COLLABORATOR'>('READER');
  const [shareUrl, setShareUrl] = useState('');
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [busy, setBusy] = useState<'link' | 'invite' | null>(null);
  const [copied, setCopied] = useState(false);
  const request = async <T,>(path: string, body?: unknown, method: 'POST' | 'PUT' = 'POST'): Promise<T> => {
    if (!accessToken) throw new Error('Connectez-vous pour partager cet arbre.');
    const response = await fetch(`${API_BASE_URL}${path}`, { method, headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail || 'Le partage est momentanément indisponible.');
    return response.json() as Promise<T>;
  };
  const ownerTree = async () => {
    const account = await request<AccountResponse>('/auth/sync');
    const tree = account.trees.find((candidate) => candidate.role === 'OWNER');
    if (!tree) throw new Error('Aucun arbre administrable trouvé.');
    const place = (value?: Person['birthPlace'] | string) => typeof value === 'string'
      ? value
      : [value?.city, value?.region, value?.country].filter(Boolean).join(', ');
    await request(`/trees/${tree.id}/family`, {
      version: 1,
      persons: persons.map((person) => ({
        ...person,
        birthPlace: place(person.birthPlace),
        deathPlace: place(person.deathPlace),
        email: person.contact?.email,
        phone: person.contact?.phone,
      })),
      marriages: marriages.map((marriage) => ({ ...marriage, location: place(marriage.location) })),
    }, 'PUT');
    return tree;
  };
  const createLink = async () => {
    setBusy('link'); setStatus(null);
    try {
      const tree = await ownerTree();
      const result = await request<{ token: string }>(`/trees/${tree.id}/share-link`);
      const publicUrl = new URL(`/shared/${result.token}`, window.location.origin);
      publicUrl.searchParams.set('focus', treeOptions.focusPersonId);
      publicUrl.searchParams.set('generations', String(treeOptions.generations));
      publicUrl.searchParams.set('view', treeOptions.viewType);
      setShareUrl(publicUrl.toString());
      setStatus({ kind: 'success', message: 'Lien de lecture créé. Les visiteurs ne pourront pas modifier l’arbre.' });
    } catch (error) { setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Échec du partage.' }); }
    finally { setBusy(null); }
  };
  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const invite = async () => {
    if (!email.trim()) return;
    setBusy('invite'); setStatus(null);
    try {
      const tree = await ownerTree();
      const result = await request<{ status: string; notificationSent: boolean }>(`/trees/${tree.id}/invitations`, { email, role });
      setStatus(result.notificationSent
        ? { kind: 'success', message: result.status === 'ACTIVE' ? 'Accès accordé et invitation envoyée par e-mail.' : 'Invitation envoyée. L’accès sera activé après son inscription.' }
        : { kind: 'error', message: 'L’accès est enregistré, mais l’e-mail n’a pas pu être envoyé. Vérifiez la configuration de messagerie.' });
      setEmail('');
    } catch (error) { setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Échec de l’invitation.' }); }
    finally { setBusy(null); }
  };
  return <div className="fixed inset-0 z-[130] grid place-items-center bg-zinc-950/70 px-4 backdrop-blur-md" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl dark:bg-zinc-950" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <header className="flex items-start gap-4 border-b border-zinc-200 p-6 dark:border-white/10"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500/15 text-sky-500"><ShieldCheck /></div><div className="flex-1"><p className="text-[10px] uppercase tracking-[.18em] text-sky-500">Partage maîtrisé</p><h2 id="share-title" className="mt-1 font-serif text-2xl">Partager cet arbre</h2></div><button onClick={onClose} className="rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-white/10" aria-label="Fermer"><X size={18} /></button></header>
      <div className="space-y-5 p-6">
        <div className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10"><div className="flex gap-3"><Link className="mt-0.5 text-sky-500" size={18} /><div className="flex-1"><h3 className="text-sm font-semibold">Lien public en lecture seule</h3><p className="mt-1 text-xs leading-5 text-zinc-500">La consultation est possible sans compte. Toute modification reste bloquée.</p></div></div><button disabled={busy !== null} onClick={() => void createLink()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy === 'link' && <LoaderCircle className="animate-spin" size={16} />}{busy === 'link' ? 'Génération du lien…' : 'Générer le lien'}</button>{shareUrl && <div className="mt-3 flex gap-2"><input readOnly value={shareUrl} className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs dark:border-white/10 dark:bg-white/5" /><button onClick={() => void copyLink()} className={`relative grid min-w-10 place-items-center overflow-hidden rounded-xl border p-2.5 transition-all duration-300 ${copied ? 'scale-105 border-emerald-400 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'border-zinc-200 dark:border-white/10'}`} aria-label={copied ? 'Lien copié' : 'Copier'}>{copied ? <Check className="animate-[copy-pop_.35s_ease-out]" size={16} /> : <Copy size={16} />}</button></div>}</div>
        <div className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10"><div className="flex gap-3"><UserRoundCog className="mt-0.5 text-indigo-500" size={18} /><div><h3 className="text-sm font-semibold">Inviter une personne</h3><p className="mt-1 text-xs text-zinc-500">Choisissez précisément ses droits.</p></div></div><div className="mt-4 flex gap-2"><div className="relative min-w-0 flex-1"><Mail className="absolute left-3 top-3 text-zinc-500" size={15} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@exemple.com" className="w-full rounded-xl border border-zinc-200 bg-transparent py-2.5 pl-9 pr-3 text-sm dark:border-white/10" /></div><select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-900"><option value="READER">Lecture</option><option value="COLLABORATOR">Modification</option></select></div><button disabled={busy !== null || !email.trim()} onClick={() => void invite()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy === 'invite' && <LoaderCircle className="animate-spin" size={16} />}{busy === 'invite' ? 'Envoi de l’invitation…' : 'Envoyer l’invitation'}</button></div>
        {status && <p role="status" className={`flex gap-2 rounded-xl p-3 text-xs leading-5 ${status.kind === 'error' ? 'bg-red-500/10 text-red-700 dark:text-red-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>{status.kind === 'error' ? <AlertCircle size={15} className="mt-0.5 shrink-0" /> : <Check size={15} className="mt-0.5 shrink-0" />}{status.message}</p>}
      </div>
    </section>
  </div>;
}
