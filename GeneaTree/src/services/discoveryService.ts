import { API_BASE_URL } from '../config/api';
import { Marriage, Person, TreeViewOptions } from '../types/family';
import { createLocalTree } from './localFamilyService';
import { familyGenerationCount } from '../components/demo/bandLayout';

export interface DiscoveryCategory { id: string; label: string; description: string; }
export interface DiscoveryTreeSummary { id: string; title: string; description: string; category: string; aliases: string[]; imageUrl?: string; personCount: number; generations: number; featured: boolean; }
export interface DiscoveryTree extends DiscoveryTreeSummary { tree: { version: number; persons: Person[]; marriages: Marriage[]; view: TreeViewOptions }; }

export async function openDiscoveryTree(record: DiscoveryTree): Promise<void> {
  const { persons, marriages, view } = record.tree;
  if (!persons.some((person) => person.id === view.focusPersonId)) {
    throw new Error('La personne de cette fiche est absente de son arbre.');
  }
  await createLocalTree(record.title, { persons, marriages }, 'imported');
  localStorage.setItem('geneatree.example', 'imported');
  localStorage.setItem('geneatree.demo.view', JSON.stringify({
    ...view,
    generations: Math.max(view.generations, familyGenerationCount(persons, marriages)),
  }));
  localStorage.setItem('focusPerson', view.focusPersonId);
}
async function parse<T>(request: Promise<Response>): Promise<T> {
  const response = await request;
  if (!response.ok) throw new Error(`Le catalogue est momentanément indisponible (${response.status}).`);
  return response.json() as Promise<T>;
}
export const getDiscoveryCategories = () => parse<DiscoveryCategory[]>(fetch(`${API_BASE_URL}/discovery/categories`));
export const searchDiscoveryTrees = (query = '', category = '', featured = false, limit = 24) => { const params = new URLSearchParams({ q: query, featured: String(featured), limit: String(limit) }); if (category) params.set('category', category); return parse<DiscoveryTreeSummary[]>(fetch(`${API_BASE_URL}/discovery/trees?${params}`)); };
export const suggestDiscoveryTrees = (query: string) => parse<DiscoveryTreeSummary[]>(fetch(`${API_BASE_URL}/discovery/suggestions?q=${encodeURIComponent(query)}`));
export const getDiscoveryTree = (id: string) => parse<DiscoveryTree>(fetch(`${API_BASE_URL}/discovery/trees/${encodeURIComponent(id)}`));
export const reportEmptyDiscoverySearch = (query: string, category?: string) => fetch(`${API_BASE_URL}/discovery/search-misses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, category: category || null }) });
