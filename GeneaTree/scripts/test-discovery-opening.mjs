import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';

const catalog = JSON.parse(await readFile('../api/geneatree/src/main/resources/discovery/popular-trees.json', 'utf8'));
const subjects = JSON.parse(await readFile('../scripts/discovery-subjects.json', 'utf8'));
const { outputFiles } = await build({
  stdin: { contents: "export { openDiscoveryTree } from './src/services/discoveryService'; export { loadFamily, saveFamily } from './src/services/familyGateway'; export { saveLocalFamily, getCurrentLocalTree } from './src/services/localFamilyService'; export { setTreeEditorSession, canEditTree } from './src/services/treePermissions'; export { layoutBands } from './src/components/demo/bandLayout';", resolveDir: process.cwd() },
  bundle: true, write: false, platform: 'node', format: 'esm',
  define: { 'import.meta.env': JSON.stringify({ PROD: false }) },
});
const { openDiscoveryTree, loadFamily, saveFamily, saveLocalFamily, getCurrentLocalTree, setTreeEditorSession, canEditTree, layoutBands } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
const snapshots = new Map();
const storage = new Map();
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) };
globalThis.window = new EventTarget();
globalThis.indexedDB = {
  open() {
    const request = { result: {
      close() {},
      transaction() {
        const transaction = { objectStore: () => ({
          put(value, key) { snapshots.set(key, structuredClone(value)); },
          get(key) {
            const read = { result: structuredClone(snapshots.get(key)) };
            queueMicrotask(() => read.onsuccess());
            return read;
          },
        }) };
        queueMicrotask(() => transaction.oncomplete?.());
        return transaction;
      },
    } };
    queueMicrotask(() => request.onsuccess());
    return request;
  },
};

for (const entry of catalog.entries) {
  const expected = `wd-${subjects[entry.id].entityId}`;
  assert.equal(entry.tree.view.focusPersonId, expected, `${entry.id}: mauvaise identité`);
  assert.ok(entry.tree.persons.some((person) => person.id === expected), `${entry.id}: sujet absent`);
  localStorage.setItem('geneatree.example', 'monogame');
  localStorage.setItem('focusPerson', 'ancienne-personne');
  localStorage.setItem('geneatree.demo.view', JSON.stringify({ viewType: 'radial', generations: 4, focusPersonId: 'ancienne-personne' }));
  await openDiscoveryTree(entry);
  const loaded = await loadFamily();
  assert.deepEqual(loaded, { persons: entry.tree.persons, marriages: entry.tree.marriages }, `${entry.id}: mauvais arbre rechargé`);
  assert.equal(localStorage.getItem('geneatree.example'), 'imported');
  assert.equal(localStorage.getItem('focusPerson'), expected);
  const view = JSON.parse(localStorage.getItem('geneatree.demo.view'));
  assert.equal(view.focusPersonId, expected, `${entry.id}: personne focale perdue`);
  assert.equal(view.viewType, entry.tree.view.viewType, `${entry.id}: type de vue perdu`);
  assert.ok(view.generations >= entry.tree.view.generations, `${entry.id}: générations tronquées`);
  const layout = layoutBands(loaded.persons, loaded.marriages, view.generations);
  assert.ok(layout.nodes.some((node) => node.person.id === expected), `${entry.id}: saint masqué par la limite des générations`);
  assert.equal(layout.nodes.length, entry.personCount, `${entry.id}: arbre tronqué à l'ouverture`);
}
const count = snapshots.size;
const protectedTree = getCurrentLocalTree();
assert.equal(protectedTree.role, 'READER');
assert.ok(protectedTree.predefinedId);
const unchanged = await loadFamily();
await assert.rejects(saveLocalFamily([], []), /lecture seule/);
setTreeEditorSession('reader@example.com', 'other-account-token');
assert.equal(canEditTree(protectedTree), false);
await assert.rejects(saveFamily([], []), /lecture seule/);
assert.deepEqual(await loadFamily(), unchanged);
setTreeEditorSession('kouokamasaph142@gmail.com', 'owner-token');
assert.equal(canEditTree(protectedTree), true);
const originalFetch = globalThis.fetch;
let request;
globalThis.fetch = async (url, init) => { request = { url, ...init }; return { ok: false, status: 403 }; };
await assert.rejects(saveFamily(unchanged.persons, unchanged.marriages), /refusée/);
assert.equal(request.method, 'PUT');
assert.equal(request.headers.Authorization, 'Bearer owner-token');
assert.ok(request.url.endsWith(`/discovery/trees/${protectedTree.predefinedId}`));
assert.deepEqual(await loadFamily(), unchanged, 'Un refus serveur ne doit jamais être transformé en sauvegarde locale.');
globalThis.fetch = originalFetch;
setTreeEditorSession(null, null);
const invalid = structuredClone(catalog.entries[0]);
invalid.tree.view.focusPersonId = 'absent';
await assert.rejects(openDiscoveryTree(invalid), /absente/);
assert.equal(snapshots.size, count, 'Une fiche invalide ne doit pas créer un arbre.');
console.log(`Découvrir : identité, ouverture, stockage, réglages et visibilité du saint validés pour ${catalog.entries.length} fiches.`);
