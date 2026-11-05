import { Eye, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TreeVisualization from '../components/demo/TreeVisualization';
import { Marriage, Person } from '../types/family';
import { API_BASE_URL } from '../config/api';

export default function SharedTreePage() {
  const { token = '' } = useParams();
  const [data, setData] = useState<{ persons: Person[]; marriages: Marriage[] } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`${API_BASE_URL}/public/trees/${encodeURIComponent(token)}`).then(async (response) => {
      if (!response.ok) throw new Error('Ce lien de partage est invalide ou a expiré.');
      return response.json();
    }).then(setData).catch((reason) => setError(reason instanceof Error ? reason.message : 'Arbre indisponible.'));
  }, [token]);
  if (error) return <div className="grid min-h-[70vh] place-items-center px-6 text-center"><div><ShieldCheck className="mx-auto text-red-400" size={36} /><h1 className="mt-4 font-serif text-2xl">Accès impossible</h1><p className="mt-2 text-sm text-zinc-500">{error}</p></div></div>;
  if (!data) return <div className="grid min-h-[70vh] place-items-center text-sm text-zinc-500">Chargement de l’arbre partagé…</div>;
  const focus = data.persons[0]?.id || '';
  return <main className="flex h-[calc(100dvh-64px)] min-h-0 flex-col bg-[#f4f1ea] dark:bg-[#09090b]"><div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 text-xs text-zinc-500 dark:border-white/10"><Eye size={15} className="text-sky-500" /><strong className="text-zinc-800 dark:text-zinc-200">Lecture seule</strong><span>Vous pouvez explorer cet arbre sans le modifier.</span></div><div className="min-h-0 flex-1"><TreeVisualization viewType="tree" generations={10} focusPerson={focus} familyData={data.persons} marriagesData={data.marriages} onPersonSelect={() => {}} onAddPersonClick={() => {}} onDeletePerson={() => {}} /></div></main>;
}
