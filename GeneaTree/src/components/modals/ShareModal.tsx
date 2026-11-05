import { Check, Copy, Link, Mail, ShieldCheck, UserRoundCog, X } from 'lucide-react';
import { useState } from 'react';
import { API_BASE_URL } from '../../config/api';

interface TreeAccess { id: string; name: string; role: 'OWNER' | 'COLLABORATOR' | 'READER'; }
interface AccountResponse { trees: TreeAccess[]; }
export interface ShareModalProps { onClose: () => void; accessToken: string | null; }

export default function ShareModal({ onClose, accessToken }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'READER' | 'COLLABORATOR'>('READER');
  const [shareUrl, setShareUrl] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const request = async <T,>(path: string, body?: unknown): Promise<T> => {
    if (!accessToken) throw new Error('Connectez-vous pour partager cet arbre.');
    const response = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail || 'Le partage est momentanément indisponible.');
    return response.json() as Promise<T>;
  };
  const ownerTree = async () => {
    const account = await request<AccountResponse>('/auth/sync');
    const tree = account.trees.find((candidate) => candidate.role === 'OWNER');
    if (!tree) throw new Error('Aucun arbre administrable trouvé.');
    return tree;
  };
  const createLink = async () => {
    setBusy(true); setStatus('');
    try {
      const tree = await ownerTree();
      const result = await request<{ token: string }>(`/trees/${tree.id}/share-link`);
      setShareUrl(`${window.location.origin}/shared/${result.token}`);
      setStatus('Lien de lecture créé. Les visiteurs ne pourront pas modifier l’arbre.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Échec du partage.'); }
    finally { setBusy(false); }
  };
  const invite = async () => {
    if (!email.trim()) return;
    setBusy(true); setStatus('');
    try {
      const tree = await ownerTree();
      const result = await request<{ status: string }>(`/trees/${tree.id}/invitations`, { email, role });
      setStatus(result.status === 'ACTIVE' ? 'Accès accordé immédiatement.' : 'Invitation enregistrée. L’accès sera activé après son inscription.');
      setEmail('');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Échec de l’invitation.'); }
    finally { setBusy(false); }
  };
  return <div className="fixed inset-0 z-[130] grid place-items-center bg-zinc-950/70 px-4 backdrop-blur-md" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl dark:bg-zinc-950" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <header className="flex items-start gap-4 border-b border-zinc-200 p-6 dark:border-white/10"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500/15 text-sky-500"><ShieldCheck /></div><div className="flex-1"><p className="text-[10px] uppercase tracking-[.18em] text-sky-500">Partage maîtrisé</p><h2 id="share-title" className="mt-1 font-serif text-2xl">Partager cet arbre</h2></div><button onClick={onClose} className="rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-white/10" aria-label="Fermer"><X size={18} /></button></header>
      <div className="space-y-5 p-6">
        <div className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10"><div className="flex gap-3"><Link className="mt-0.5 text-sky-500" size={18} /><div className="flex-1"><h3 className="text-sm font-semibold">Lien public en lecture seule</h3><p className="mt-1 text-xs leading-5 text-zinc-500">La consultation est possible sans compte. Toute modification reste bloquée.</p></div></div><button disabled={busy} onClick={() => void createLink()} className="mt-4 w-full rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Générer le lien</button>{shareUrl && <div className="mt-3 flex gap-2"><input readOnly value={shareUrl} className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs dark:border-white/10 dark:bg-white/5" /><button onClick={() => void navigator.clipboard.writeText(shareUrl)} className="rounded-xl border border-zinc-200 p-2.5 dark:border-white/10" aria-label="Copier"><Copy size={16} /></button></div>}</div>
        <div className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10"><div className="flex gap-3"><UserRoundCog className="mt-0.5 text-indigo-500" size={18} /><div><h3 className="text-sm font-semibold">Inviter une personne</h3><p className="mt-1 text-xs text-zinc-500">Choisissez précisément ses droits.</p></div></div><div className="mt-4 flex gap-2"><div className="relative min-w-0 flex-1"><Mail className="absolute left-3 top-3 text-zinc-500" size={15} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@exemple.com" className="w-full rounded-xl border border-zinc-200 bg-transparent py-2.5 pl-9 pr-3 text-sm dark:border-white/10" /></div><select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-900"><option value="READER">Lecture</option><option value="COLLABORATOR">Modification</option></select></div><button disabled={busy || !email.trim()} onClick={() => void invite()} className="mt-3 w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Envoyer l’invitation</button></div>
        {status && <p className="flex gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs leading-5 text-emerald-700 dark:text-emerald-300"><Check size={15} className="mt-0.5 shrink-0" />{status}</p>}
      </div>
    </section>
  </div>;
}
