import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';

const { outputFiles } = await build({
  entryPoints: ['src/services/discoveryService.ts'],
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  define: { 'import.meta.env': JSON.stringify({ PROD: false }) },
});
const service = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
const catalog = JSON.parse(await readFile('../api/geneatree/src/main/resources/discovery/popular-trees.json', 'utf8'));
const originalFetch = globalThis.fetch;
const calls = [];
try {
  const payloads = [catalog.categories, catalog.entries.filter((entry) => entry.featured), catalog.entries, [catalog.entries[0]], catalog.entries[0]];
  globalThis.fetch = async (url) => {
    calls.push(new URL(url));
    // Keep the asynchronous boundary that previously broke every catalogue call.
    await Promise.resolve();
    return Response.json(payloads.shift());
  };
  const [categories, featured, results] = await Promise.all([
    service.getDiscoveryCategories(), service.searchDiscoveryTrees('', '', true, 10), service.searchDiscoveryTrees(),
  ]);
  assert.ok(categories.length > 0, 'Les catégories doivent être chargées.');
  assert.ok(featured.length > 0, 'Les cartes de sélection doivent être chargées.');
  assert.ok(results.length > 0, 'Le catalogue doit contenir des arbres.');
  assert.equal(calls[1].searchParams.get('featured'), 'true');
  assert.deepEqual(await service.suggestDiscoveryTrees('Marie'), [catalog.entries[0]]);
  assert.deepEqual(await service.getDiscoveryTree(catalog.entries[0].id), catalog.entries[0]);
  globalThis.fetch = async () => new Response(null, { status: 503 });
  await assert.rejects(service.getDiscoveryCategories(), /503/);
  globalThis.fetch = async () => { throw new TypeError('Network unavailable'); };
  await assert.rejects(service.searchDiscoveryTrees(), /Network unavailable/);
  console.log('Découvrir : catégories, cartes, recherche, ouverture et erreurs validées.');
} finally {
  globalThis.fetch = originalFetch;
}
