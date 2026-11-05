import { Marriage, Person } from '../types/family';

const LEGACY_SNAPSHOT_KEY = 'geneatree.family.snapshot';
const REGISTRY_KEY = 'geneatree.trees.v1';
const CURRENT_TREE_KEY = 'geneatree.current-tree.v1';
const SNAPSHOT_PREFIX = 'geneatree.family.snapshot.';
const HISTORY_PREFIX = 'geneatree.family.history.';
const DEFAULT_TREE_ID = 'local-default';
const HISTORY_LIMIT = 20;

export interface FamilySnapshot { persons: Person[]; marriages: Marriage[]; }
export type LocalTreeRole = 'OWNER' | 'COLLABORATOR' | 'READER';
export interface LocalTreeRecord {
  id: string; name: string; role: LocalTreeRole; source: 'created' | 'imported' | 'shared';
  createdAt: string; updatedAt: string;
}
export interface FamilyRevision extends FamilySnapshot {
  id: string; treeId: string; savedAt: string; personCount: number;
}
export type FamilySaveState = 'saving' | 'saved' | 'error';

const emptySnapshot = (): FamilySnapshot => ({ persons: [], marriages: [] });

function readSnapshot(key: string): FamilySnapshot {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '') as FamilySnapshot;
    return { persons: Array.isArray(parsed.persons) ? parsed.persons : [], marriages: Array.isArray(parsed.marriages) ? parsed.marriages : [] };
  } catch { return emptySnapshot(); }
}

function readRegistry(): LocalTreeRecord[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]') as LocalTreeRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeRegistry(trees: LocalTreeRecord[]): void {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(trees));
  window.dispatchEvent(new CustomEvent('geneatree:trees-changed', { detail: trees }));
}

function ensureRegistry(): LocalTreeRecord[] {
  const existing = readRegistry();
  if (existing.length) return existing;
  const now = new Date().toISOString();
  const tree: LocalTreeRecord = { id: DEFAULT_TREE_ID, name: 'Mon arbre', role: 'OWNER', source: 'created', createdAt: now, updatedAt: now };
  localStorage.setItem(`${SNAPSHOT_PREFIX}${tree.id}`, JSON.stringify(readSnapshot(LEGACY_SNAPSHOT_KEY)));
  writeRegistry([tree]);
  localStorage.setItem(CURRENT_TREE_KEY, tree.id);
  return [tree];
}

export function listLocalTrees(): LocalTreeRecord[] {
  return ensureRegistry().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getCurrentLocalTree(): LocalTreeRecord {
  const trees = ensureRegistry();
  const id = localStorage.getItem(CURRENT_TREE_KEY);
  return trees.find((tree) => tree.id === id) || trees[0];
}

export function selectLocalTree(treeId: string): FamilySnapshot {
  const tree = ensureRegistry().find((candidate) => candidate.id === treeId);
  if (!tree) throw new Error('Arbre introuvable');
  localStorage.setItem(CURRENT_TREE_KEY, tree.id);
  window.dispatchEvent(new CustomEvent('geneatree:tree-selected', { detail: tree }));
  return loadLocalFamily();
}

export function createLocalTree(name: string, snapshot: FamilySnapshot = emptySnapshot(), source: LocalTreeRecord['source'] = 'created'): LocalTreeRecord {
  const now = new Date().toISOString();
  const tree: LocalTreeRecord = { id: crypto.randomUUID(), name: name.trim() || 'Arbre sans titre', role: 'OWNER', source, createdAt: now, updatedAt: now };
  localStorage.setItem(`${SNAPSHOT_PREFIX}${tree.id}`, JSON.stringify(snapshot));
  writeRegistry([tree, ...ensureRegistry()]);
  localStorage.setItem(CURRENT_TREE_KEY, tree.id);
  appendRevision(tree.id, snapshot);
  return tree;
}

export function loadLocalFamily(): FamilySnapshot {
  if (typeof localStorage === 'undefined') return emptySnapshot();
  return readSnapshot(`${SNAPSHOT_PREFIX}${getCurrentLocalTree().id}`);
}

export function saveLocalFamily(persons: Person[], marriages: Marriage[]): void {
  const tree = getCurrentLocalTree();
  if (tree.role === 'READER') throw new Error('Cet arbre est accessible en lecture seule.');
  const snapshot = { persons, marriages };
  window.dispatchEvent(new CustomEvent('geneatree:save-state', { detail: 'saving' satisfies FamilySaveState }));
  try {
    localStorage.setItem(`${SNAPSHOT_PREFIX}${tree.id}`, JSON.stringify(snapshot));
    localStorage.setItem(LEGACY_SNAPSHOT_KEY, JSON.stringify(snapshot));
    const updatedAt = new Date().toISOString();
    writeRegistry(ensureRegistry().map((candidate) => candidate.id === tree.id ? { ...candidate, updatedAt } : candidate));
    appendRevision(tree.id, snapshot);
    window.dispatchEvent(new CustomEvent('geneatree:save-state', { detail: 'saved' satisfies FamilySaveState }));
  } catch (error) {
    window.dispatchEvent(new CustomEvent('geneatree:save-state', { detail: 'error' satisfies FamilySaveState }));
    throw error;
  }
}

export function listFamilyRevisions(treeId = getCurrentLocalTree().id): FamilyRevision[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(`${HISTORY_PREFIX}${treeId}`) || '[]') as FamilyRevision[];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function restoreFamilyRevision(revisionId: string, treeId = getCurrentLocalTree().id): FamilySnapshot {
  const revision = listFamilyRevisions(treeId).find((candidate) => candidate.id === revisionId);
  if (!revision) throw new Error('Version introuvable');
  saveLocalFamily(revision.persons, revision.marriages);
  return { persons: revision.persons, marriages: revision.marriages };
}

function appendRevision(treeId: string, snapshot: FamilySnapshot): void {
  const history = listFamilyRevisions(treeId);
  const latest = history[0];
  if (latest && JSON.stringify({ persons: latest.persons, marriages: latest.marriages }) === JSON.stringify(snapshot)) return;
  const revision: FamilyRevision = { ...snapshot, id: crypto.randomUUID(), treeId, savedAt: new Date().toISOString(), personCount: snapshot.persons.length };
  localStorage.setItem(`${HISTORY_PREFIX}${treeId}`, JSON.stringify([revision, ...history].slice(0, HISTORY_LIMIT)));
}
