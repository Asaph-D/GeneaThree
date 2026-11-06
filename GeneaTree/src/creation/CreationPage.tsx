import { ArrowUpRight, ChevronDown, GitBranch, Loader2, Search, Sparkles, Users, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DiscoveryCategory, DiscoveryTreeSummary, getDiscoveryCategories, getDiscoveryTree, openDiscoveryTree, reportEmptyDiscoverySearch, searchDiscoveryTrees, suggestDiscoveryTrees } from '../services/discoveryService';

export default function CreationPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<DiscoveryCategory[]>([]);
  const [featured, setFeatured] = useState<DiscoveryTreeSummary[]>([]);
  const [results, setResults] = useState<DiscoveryTreeSummary[]>([]);
  const [suggestions, setSuggestions] = useState<DiscoveryTreeSummary[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Découvrir — GeneaTreePro';
    Promise.all([getDiscoveryCategories(), searchDiscoveryTrees('', '', true, 10), searchDiscoveryTrees('', '', false, 24)])
      .then(([categoryData, featuredData, resultData]) => { setCategories(categoryData); setFeatured(featuredData); setResults(resultData); })
      .catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); return; }
    const timer = window.setTimeout(() => suggestDiscoveryTrees(query.trim()).then(setSuggestions).catch(() => setSuggestions([])), 220);
    return () => window.clearTimeout(timer);
  }, [query]);
  const selectedCategory = useMemo(() => categories.find((item) => item.id === category), [categories, category]);

  async function submit(event?: FormEvent) {
    event?.preventDefault(); setLoading(true); setSuggestions([]); setError('');
    try { const matches = await searchDiscoveryTrees(query.trim(), category, false, 48); setResults(matches); if (!matches.length && query.trim()) void reportEmptyDiscoverySearch(query.trim(), category); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Recherche indisponible.'); }
    finally { setLoading(false); }
  }
  async function openTree(item: DiscoveryTreeSummary) {
    setOpening(item.id); setError('');
    try { const record = await getDiscoveryTree(item.id); await openDiscoveryTree(record); navigate('/demo'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Impossible d’ouvrir cet arbre.'); setOpening(null); }
  }
  async function chooseCategory(id: string) {
    setCategory(id); setCategoryOpen(false); setLoading(true); setError('');
    try { setResults(await searchDiscoveryTrees(query.trim(), id, false, 48)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Recherche indisponible.'); }
    finally { setLoading(false); }
  }

  return <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,.18),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(99,102,241,.17),transparent_30%)]" />
    <div className="relative mx-auto max-w-7xl">
      <header className="mx-auto max-w-3xl text-center"><span className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.18em] text-sky-600 dark:text-sky-300"><Sparkles size={13} /> Histoires reliées</span><h1 className="mt-5 font-serif text-4xl text-zinc-950 dark:text-white sm:text-6xl">Explorez des arbres qui ont traversé le temps.</h1><p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">Saints, figures spirituelles et familles historiques : recherchez une personne, observez sa lignée, puis ouvrez une copie dans la démonstration.</p><p className="mx-auto mt-3 max-w-2xl text-xs leading-6 text-zinc-500">Parentés issues de Wikidata, à vérifier historiquement. Les fiches sans parenté renseignée sont signalées comme notices.</p></header>
      <form onSubmit={submit} className="relative z-20 mx-auto mt-8 max-w-3xl"><div className="flex rounded-2xl border border-zinc-200 bg-white/90 p-2 shadow-[0_24px_80px_-34px_rgba(14,165,233,.7)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90"><Search className="ml-3 mt-3 shrink-0 text-zinc-400" size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Marie, François d’Assise, Louis IX…" className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none" />{query && <button type="button" onClick={() => { setQuery(''); setSuggestions([]); }} className="p-2 text-zinc-400"><X size={16} /></button>}<button className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 text-sm font-semibold text-white">Rechercher</button></div>{suggestions.length > 0 && <div className="absolute inset-x-0 top-[calc(100%+.5rem)] overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-zinc-950">{suggestions.map((item) => <button key={item.id} type="button" onClick={() => { setQuery(item.title); setSuggestions([]); void openTree(item); }} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-zinc-100 dark:hover:bg-white/5">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-sky-500/10 text-sky-500"><GitBranch size={17} /></span>}<span className="flex-1"><strong className="block text-sm">{item.title}</strong><small className="text-zinc-500">{item.personCount} personnes · {item.generations} générations</small></span><ArrowUpRight size={15} /></button>)}</div>}</form>
      <section className="mt-6 flex items-start gap-3"><div className="relative"><button onClick={() => setCategoryOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/75 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-white/5">{selectedCategory?.label || 'Toutes les catégories'}<ChevronDown size={15} className={`transition ${categoryOpen ? 'rotate-180' : ''}`} /></button>{categoryOpen && <div className="absolute left-0 top-12 z-20 max-h-80 w-80 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-zinc-950"><button onClick={() => chooseCategory('')} className="w-full rounded-xl p-3 text-left text-sm hover:bg-zinc-100 dark:hover:bg-white/5">Toutes les catégories</button>{categories.map((item) => <button key={item.id} onClick={() => chooseCategory(item.id)} className="w-full rounded-xl p-3 text-left hover:bg-zinc-100 dark:hover:bg-white/5"><strong className="block text-sm">{item.label}</strong><span className="mt-1 block text-xs leading-5 text-zinc-500">{item.description}</span></button>)}</div>}</div>{selectedCategory && <button onClick={() => chooseCategory('')} className="rounded-xl border border-zinc-200 px-3 py-2.5 text-xs text-zinc-500 dark:border-white/10">Effacer</button>}</section>
      {!query && !category && featured.length > 0 && <section className="mt-10"><div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] uppercase tracking-[.2em] text-sky-500">Sélection</p><h2 className="mt-1 font-serif text-3xl">Figures incontournables</h2></div><span className="text-xs text-zinc-500">Une sélection, pas tout le catalogue</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{featured.slice(0, 10).map((item, index) => <FeaturedCard key={item.id} item={item} index={index} opening={opening === item.id} onOpen={() => void openTree(item)} />)}</div></section>}
      <section className="mt-12"><div className="mb-5 flex items-center justify-between"><h2 className="font-serif text-3xl">{query || category ? 'Résultats' : 'Explorer le catalogue'}</h2><span className="text-xs text-zinc-500">{results.length} arbre{results.length > 1 ? 's' : ''}</span></div>{error && <p className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">{error}</p>}{loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-sky-500" /></div> : results.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{results.map((item) => <ResultCard key={item.id} item={item} opening={opening === item.id} onOpen={() => void openTree(item)} />)}</div> : <div className="rounded-3xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700"><Search className="mx-auto text-zinc-400" /><h3 className="mt-4 font-serif text-2xl">Aucun arbre trouvé</h3><p className="mt-2 text-sm text-zinc-500">La recherche a été transmise pour enrichir prochainement le catalogue.</p></div>}</section>
    </div>
  </main>;
}

function FeaturedCard({ item, index, opening, onOpen }: { item: DiscoveryTreeSummary; index: number; opening: boolean; onOpen: () => void }) { return <button onClick={onOpen} className={`group relative min-h-72 overflow-hidden rounded-3xl border border-white/10 text-left shadow-xl ${index === 0 ? 'sm:col-span-2 lg:col-span-2' : ''}`}>{item.imageUrl ? <img src={item.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="absolute inset-0 bg-gradient-to-br from-sky-900 to-indigo-950" />}<div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5 text-white"><span className="text-[10px] uppercase tracking-[.16em] text-sky-300">{item.personCount === 1 ? 'Notice · parenté non renseignée' : `${item.personCount} personnes`}</span><h3 className="mt-1 font-serif text-2xl">{item.title}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-200">{item.description}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold">{opening ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpRight size={14} />} Ouvrir l’arbre</span></div></button>; }
function ResultCard({ item, opening, onOpen }: { item: DiscoveryTreeSummary; opening: boolean; onOpen: () => void }) { return <article className="group flex gap-4 rounded-3xl border border-zinc-200/80 bg-white/70 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-white/[.035]">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-24 w-24 shrink-0 rounded-2xl object-cover" /> : <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-500/15 to-indigo-500/15 text-sky-500"><GitBranch /></div>}<div className="min-w-0 flex-1"><h3 className="truncate font-serif text-xl">{item.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{item.description}</p><div className="mt-3 flex items-center gap-3 text-[11px] text-zinc-500"><span className="inline-flex items-center gap-1"><Users size={13} />{item.personCount === 1 ? 'Notice · parenté non renseignée' : `${item.personCount} personnes`}</span><span>{item.generations} générations</span></div></div><button onClick={onOpen} className="self-center rounded-xl border border-zinc-200 p-2.5 hover:border-sky-400 dark:border-white/10" aria-label={`Ouvrir ${item.title}`}>{opening ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpRight size={16} />}</button></article>; }
