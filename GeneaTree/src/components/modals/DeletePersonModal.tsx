import { AlertTriangle, GitBranch, UserMinus, X } from 'lucide-react';
import { Person } from '../../types/family';

interface DeletePersonModalProps {
  person: Person;
  descendantCount: number;
  isolatedCount: number;
  cascade: boolean;
  busy: boolean;
  onCascadeChange: (cascade: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeletePersonModal({
  person,
  descendantCount,
  isolatedCount,
  cascade,
  busy,
  onCascadeChange,
  onCancel,
  onConfirm,
}: DeletePersonModalProps) {
  const name = `${person.firstName} ${person.lastName}`.trim();

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-zinc-950/65 px-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onCancel()}>
      <section role="dialog" aria-modal="true" aria-labelledby="delete-person-title" className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl dark:bg-zinc-950">
        <div className="flex items-start gap-4 border-b border-zinc-200 p-6 dark:border-white/10">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"><AlertTriangle size={22} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600 dark:text-red-300">Suppression définitive</p>
            <h2 id="delete-person-title" className="mt-1 font-serif text-2xl text-zinc-950 dark:text-white">Supprimer {name} ?</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">Choisissez ce qui doit arriver aux personnes et relations situées sous ce nœud.</p>
          </div>
          <button type="button" disabled={busy} onClick={onCancel} className="rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-white/10" aria-label="Fermer"><X size={18} /></button>
        </div>

        <div className="space-y-3 p-6">
          {isolatedCount > 0 && <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">{isolatedCount} personne{isolatedCount > 1 ? 's' : ''} n'aur{isolatedCount > 1 ? 'ont' : 'a'} plus aucune relation directe après cette suppression. {isolatedCount > 1 ? 'Elles resteront' : 'Elle restera'} néanmoins dans l'arbre.</p>}
          <button type="button" onClick={() => onCascadeChange(false)} className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${!cascade ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/15 dark:bg-primary-500/10' : 'border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20'}`}>
            <UserMinus className="mt-0.5 shrink-0 text-primary-600" size={21} />
            <span><strong className="block text-sm text-zinc-950 dark:text-white">Supprimer uniquement cette personne</strong><span className="mt-1 block text-xs leading-5 text-zinc-600 dark:text-zinc-400">Ses liens directs sont retirés. Les descendants restent dans l’arbre et peuvent devenir une branche indépendante.</span></span>
          </button>
          <button type="button" disabled={descendantCount === 0} onClick={() => onCascadeChange(true)} className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${cascade ? 'border-red-500 bg-red-50 ring-2 ring-red-500/15 dark:bg-red-500/10' : 'border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20'}`}>
            <GitBranch className="mt-0.5 shrink-0 text-red-600" size={21} />
            <span><strong className="block text-sm text-zinc-950 dark:text-white">Supprimer toute la branche descendante</strong><span className="mt-1 block text-xs leading-5 text-zinc-600 dark:text-zinc-400">Supprime {name} et {descendantCount} descendant{descendantCount > 1 ? 's' : ''} relié{descendantCount > 1 ? 's' : ''} sous ce nœud.</span></span>
          </button>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:justify-end">
          <button type="button" disabled={busy} onClick={onCancel} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-white disabled:opacity-50 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/10">Annuler</button>
          <button type="button" disabled={busy} onClick={onConfirm} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-500 disabled:opacity-50">{busy ? 'Suppression…' : cascade ? 'Supprimer la branche' : 'Supprimer la personne'}</button>
        </div>
      </section>
    </div>
  );
}
