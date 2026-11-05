import { Marriage, Person } from '../types/family';

const LEGACY_SNAPSHOT_KEY = 'geneatree.family.snapshot';
const REGISTRY_KEY = 'geneatree.trees.v1';
const CURRENT_TREE_KEY = 'geneatree.current-tree.v1';
const SNAPSHOT_PREFIX = 'geneatree.family.snapshot.';
const HISTORY_PREFIX = 'geneatree.family.history.';
const DEFAULT_TREE_ID = 'local-default';
const DB_NAME = 'geneatree-family';
const STORE_NAME = 'snapshots';

export interface FamilySnapshot { persons: Person[]; marriages: Marriage[]; }
export type LocalTreeRole = 'OWNER' | 'COLLABORATOR' | 'READER';
export interface LocalTreeRecord { id: string; name: string; role: LocalTreeRole; source: 'created' | 'imported' | 'shared'; createdAt: string; updatedAt: string; }
export interface FamilyRevision { id: string; treeId: string; savedAt: string; personCount: number; }
export type FamilySaveState = 'saving' | 'saved' | 'error';

const emptySnapshot = (): FamilySnapshot => ({ persons: [], marriages: [] });

function parseSnapshot(raw: string | null): FamilySnapshot {
  try {
    const parsed = JSON.parse(raw || '') as FamilySnapshot;
    return { persons: Array.isArray(parsed.persons) ? parsed.persons : [], marriages: Array.isArray(parsed.marriages) ? parsed.marriages : [] };
  } catch { return emptySnapshot(); }
}

function readRegistry(): LocalTreeRecord[] {
  try { const value = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
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
  writeRegistry([tree]);
  localStorage.setItem(CURRENT_TREE_KEY, tree.id);
  return [tree];
}

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Stockage IndexedDB indisponible'));
  });
}

async function readIndexedSnapshot(treeId: string): Promise<FamilySnapshot | null> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(treeId);
    request.onsuccess = () => resolve(request.result ? request.result as FamilySnapshot : null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

async function writeIndexedSnapshot(treeId: string, snapshot: FamilySnapshot): Promise<void> {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(snapshot, treeId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Échec de la sauvegarde locale'));
  });
  db.close();
}

function purgeDuplicatedSnapshots(treeId?: string): void {
  localStorage.removeItem(LEGACY_SNAPSHOT_KEY);
  if (treeId) localStorage.removeItem(`${SNAPSHOT_PREFIX}${treeId}`);
  Object.keys(localStorage).filter((key) => key.startsWith(HISTORY_PREFIX)).forEach((key) => {
    const compact = listFamilyRevisions(key.slice(HISTORY_PREFIX.length));
    localStorage.setItem(key, JSON.stringify(compact.map(({ id, treeId: revisionTreeId, savedAt, personCount }) => ({ id, treeId: revisionTreeId, savedAt, personCount })).slice(0, 20)));
  });
}

export function listLocalTrees(): LocalTreeRecord[] { return ensureRegistry().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)); }
export function getCurrentLocalTree(): LocalTreeRecord {
  const trees = ensureRegistry();
  return trees.find((tree) => tree.id === localStorage.getItem(CURRENT_TREE_KEY)) || trees[0];
}
export function selectLocalTree(treeId: string): FamilySnapshot {
  const tree = ensureRegistry().find((candidate) => candidate.id === treeId);
  if (!tree) throw new Error('Arbre introuvable');
  localStorage.setItem(CURRENT_TREE_KEY, tree.id);
  window.dispatchEvent(new CustomEvent('geneatree:tree-selected', { detail: tree }));
  return loadLocalFamily();
}

export async function createLocalTree(name: string, snapshot: FamilySnapshot = emptySnapshot(), source: LocalTreeRecord['source'] = 'created'): Promise<LocalTreeRecord> {
  const now = new Date().toISOString();
  const tree: LocalTreeRecord = { id: crypto.randomUUID(), name: name.trim() || 'Arbre sans titre', role: 'OWNER', source, createdAt: now, updatedAt: now };
  await writeIndexedSnapshot(tree.id, snapshot);
  purgeDuplicatedSnapshots();
  writeRegistry([tree, ...ensureRegistry()]);
  localStorage.setItem(CURRENT_TREE_KEY, tree.id);
  appendRevision(tree.id, snapshot.persons.length);
  return tree;
}

export function loadLocalFamily(): FamilySnapshot {
  if (typeof localStorage === 'undefined') return emptySnapshot();
  const treeId = getCurrentLocalTree().id;
  return parseSnapshot(localStorage.getItem(`${SNAPSHOT_PREFIX}${treeId}`) || localStorage.getItem(LEGACY_SNAPSHOT_KEY));
}

export async function loadPersistentLocalFamily(): Promise<FamilySnapshot> {
  const treeId = getCurrentLocalTree().id;
  const indexed = await readIndexedSnapshot(treeId);
  if (indexed) { purgeDuplicatedSnapshots(treeId); return indexed; }
  const legacy = loadLocalFamily();
  if (legacy.persons.length || legacy.marriages.length) await writeIndexedSnapshot(treeId, legacy);
  purgeDuplicatedSnapshots(treeId);
  return legacy;
}

export async function saveLocalFamily(persons: Person[], marriages: Marriage[]): Promise<void> {
  const tree = getCurrentLocalTree();
  if (tree.role === 'READER') throw new Error('Cet arbre est accessible en lecture seule.');
  window.dispatchEvent(new CustomEvent('geneatree:save-state', { detail: 'saving' satisfies FamilySaveState }));
  try {
    await writeIndexedSnapshot(tree.id, { persons, marriages });
    purgeDuplicatedSnapshots(tree.id);
    const updatedAt = new Date().toISOString();
    writeRegistry(ensureRegistry().map((candidate) => candidate.id === tree.id ? { ...candidate, updatedAt } : candidate));
    appendRevision(tree.id, persons.length);
    window.dispatchEvent(new CustomEvent('geneatree:save-state', { detail: 'saved' satisfies FamilySaveState }));
  } catch (error) {
    window.dispatchEvent(new CustomEvent('geneatree:save-state', { detail: 'error' satisfies FamilySaveState }));
    throw error;
  }
}

export function listFamilyRevisions(treeId = getCurrentLocalTree().id): FamilyRevision[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(`${HISTORY_PREFIX}${treeId}`) || '[]') as FamilyRevision[];
    return Array.isArray(parsed) ? parsed.map(({ id, treeId: storedTreeId, savedAt, personCount }) => ({ id, treeId: storedTreeId, savedAt, personCount })) : [];
  } catch { return []; }
}

function appendRevision(treeId: string, personCount: number): void {
  const history = listFamilyRevisions(treeId);
  const latest = history[0];
  const now = new Date();
  if (latest && latest.personCount === personCount && now.getTime() - new Date(latest.savedAt).getTime() < 30_000) return;
  const revision: FamilyRevision = { id: crypto.randomUUID(), treeId, savedAt: now.toISOString(), personCount };
  localStorage.setItem(`${HISTORY_PREFIX}${treeId}`, JSON.stringify([revision, ...history].slice(0, 20)));
}
