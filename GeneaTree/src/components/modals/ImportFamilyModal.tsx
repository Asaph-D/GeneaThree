import { AlertTriangle, FileJson, Upload, X } from 'lucide-react';
import { FamilyArchive } from '../../services/familyTransfer';

interface ImportFamilyModalProps {
  fileName: string;
  archive?: FamilyArchive;
  error?: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ImportFamilyModal({ fileName, archive, error, busy, onCancel, onConfirm }: ImportFamilyModalProps) {
  return <div className="fixed inset-0 z-[130] grid place-items-center bg-zinc-950/75 px-4 backdrop-blur-md" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onCancel()}>
    <section role="dialog" aria-modal="true" aria-labelledby="import-family-title" className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl dark:bg-zinc-950">
      <header className="flex items-start gap-4 border-b border-zinc-200 p-6 dark:border-white/10">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${error ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'}`}>{error ? <AlertTriangle size={22} /> : <FileJson size={22} />}</div>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-sky-600 dark:text-sky-300">Import GeneaTreePro</p><h2 id="import-family-title" className="mt-1 font-serif text-2xl text-zinc-950 dark:text-white">{error ? 'Archive non compatible' : 'Vérifier avant de remplacer'}</h2><p className="mt-2 truncate text-sm text-zinc-500" title={fileName}>{fileName}</p></div>
        <button type="button" onClick={onCancel} disabled={busy} className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10" aria-label="Fermer"><X size={18} /></button>
      </header>
      <div className="space-y-4 p-6">
        {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">{error}</p> : archive && <>
          <div className="grid grid-cols-3 gap-3"><Summary value={archive.persons.length} label="Personnes" /><Summary value={archive.marriages.length} label="Unions" /><Summary value={archive.view.generations} label="Générations" /></div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-white/10 dark:bg-white/[.03]"><p className="font-medium text-zinc-900 dark:text-white">Point focal restauré</p><p className="mt-1 text-zinc-500 dark:text-zinc-400">{archive.persons.find((person) => person.id === archive.view.focusPersonId)?.firstName || 'Première personne de l’archive'}</p></div>
          <p className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100"><AlertTriangle className="mt-0.5 shrink-0" size={18} />L’arbre ouvert sera remplacé après validation. Le fichier sélectionné reste inchangé sur votre appareil.</p>
        </>}
      </div>
      <footer className="flex justify-end gap-3 border-t border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[.03]"><button type="button" onClick={onCancel} disabled={busy} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:border-white/15 dark:text-zinc-200">Annuler</button>{archive && !error && <button type="button" onClick={onConfirm} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 disabled:opacity-50"><Upload size={16} />{busy ? 'Importation…' : 'Importer cet arbre'}</button>}</footer>
    </section>
  </div>;
}

function Summary({ value, label }: { value: number; label: string }) { return <div className="rounded-2xl border border-zinc-200 p-3 text-center dark:border-white/10"><strong className="block text-xl text-zinc-950 dark:text-white">{value}</strong><span className="text-[11px] text-zinc-500">{label}</span></div>; }
