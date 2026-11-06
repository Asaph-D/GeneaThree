import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';

const { outputFiles } = await build({
  stdin: {
    contents: "export { layoutBands } from './src/components/demo/bandLayout'; export { SAMPLE_FAMILIES } from './src/examples/sampleFamilies';",
    resolveDir: process.cwd(),
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const { layoutBands, SAMPLE_FAMILIES } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
const catalog = JSON.parse(await readFile('../api/geneatree/src/main/resources/discovery/popular-trees.json', 'utf8'));
const close = (a, b) => Math.abs(a - b) < 0.001;

// Both partners have an ancestry, and a sibling is married too. The first
// married sibling in the input must not displace the couple joining families.
const fixtureUnions = [
  { id: 'parents-brigitte', spouse1Id: 'antoine', spouse2Id: 'marceline', childrenIds: ['dagobert', 'henri', 'francois', 'brigitte'], rank: 1 },
  { id: 'dagobert-union', spouse1Id: 'dagobert', spouse2Id: 'stephanie', childrenIds: ['daniel', 'divine'], rank: 1 },
  { id: 'bridge', spouse1Id: 'brigitte', spouse2Id: 'paul', childrenIds: ['asaph', 'ines', 'stella'], rank: 1 },
  { id: 'parents-paul', spouse1Id: 'innocent', spouse2Id: 'elisabeth', childrenIds: ['paul', 'david'], rank: 1 },
  { id: 'parents-lion', spouse1Id: 'innocent', spouse2Id: 'marie', childrenIds: ['lion'], rank: 2 },
];
const fixturePeople = [...new Set(fixtureUnions.flatMap((u) => [u.spouse1Id, u.spouse2Id, ...u.childrenIds]))].map((id) => ({
  id, firstName: id, lastName: '', parentIds: fixtureUnions.filter((u) => u.childrenIds.includes(id)).flatMap((u) => [u.spouse1Id, u.spouse2Id]),
  childrenIds: fixtureUnions.filter((u) => [u.spouse1Id, u.spouse2Id].includes(id)).flatMap((u) => u.childrenIds),
  spouseIds: fixtureUnions.flatMap((u) => u.spouse1Id === id ? [u.spouse2Id] : u.spouse2Id === id ? [u.spouse1Id] : []),
}));
const families = [...SAMPLE_FAMILIES, ...catalog.entries.map((entry) => ({ id: entry.id, ...entry.tree })), { id: 'brigitte-paul', persons: fixturePeople, marriages: fixtureUnions }];
let scenarios = 0;
for (const family of families) {
  const variants = [family, JSON.parse(JSON.stringify(family)), { ...family, persons: [...family.persons].reverse() }];
  for (const [variantIndex, variant] of variants.entries()) {
    for (let generations = 1; generations <= 12; generations++) {
      const label = `${family.id}, variante ${variantIndex}, ${generations} générations`;
      const layout = layoutBands(variant.persons, variant.marriages, generations);
      const byId = new Map(layout.nodes.map((node) => [node.person.id, node]));
      assert.equal(byId.size, layout.nodes.length, `${label}: personne dupliquée`);
      assert.ok(layout.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y) && n.depth < generations), `${label}: position invalide`);
      if (generations === 12) assert.equal(byId.size, family.persons.length, `${label}: personne perdue`);
      for (let i = 0; i < layout.nodes.length; i++) {
        for (const other of layout.nodes.slice(i + 1)) {
          const node = layout.nodes[i];
          if (node.depth === other.depth) assert.ok(Math.abs(node.x - other.x) >= 115.999, `${label}: chevauchement ${node.person.id}/${other.person.id}`);
        }
      }
      for (const union of variant.marriages) {
        const a = byId.get(union.spouse1Id), b = byId.get(union.spouse2Id);
        if (!a || !b) continue;
        const households = variant.marriages.filter((u) => u.spouse1Id === a.person.id && byId.has(u.spouse2Id));
        const rail = households.length > 1;
        assert.ok(layout.unions.some((line) => line.rail === rail && (rail
          ? close(line.y, a.y + 100) && [a.x, b.x].every((x) => line.ticks.some((tick) => close(tick.x, x)))
          : close(line.y, a.y) && close(line.x1, Math.min(a.x, b.x) + 28) && close(line.x2, Math.max(a.x, b.x) - 28))), `${label}: couple mal raccordé ${union.id}`);
        const kids = (union.childrenIds ?? []).map((id) => byId.get(id)).filter(Boolean);
        if (!kids.length) continue;
        assert.ok(layout.drops.some((drop) => close(drop.x1, rail ? b.x : (a.x + b.x) / 2)
          && close(drop.y1, a.y + (rail ? 100 : 0))
          && kids.every((kid) => drop.drops.some((end) => close(end.x, kid.x) && close(end.y, kid.y - 28)))), `${label}: enfants reliés aux mauvais parents ${union.id}`);
        const related = new Set(kids.flatMap((kid) => [kid.person.id, ...kid.person.spouseIds]));
        for (const node of layout.nodes) {
          if (node.depth !== kids[0].depth || related.has(node.person.id)) continue;
          assert.ok(node.x <= Math.min(...kids.map((kid) => kid.x)) || node.x >= Math.max(...kids.map((kid) => kid.x)), `${label}: famille étrangère dans la fratrie ${union.id}: ${node.person.id}`);
        }
      }
      if (family.id === 'brigitte-paul' && generations >= 2) {
        assert.ok(byId.get('dagobert').x < byId.get('brigitte').x, `${label}: Dagobert traverse la famille de Paul`);
        assert.ok(byId.get('david').x > byId.get('paul').x, `${label}: David traverse la famille de Brigitte`);
        assert.notEqual(byId.get('marceline').x, byId.get('elisabeth').x, `${label}: les mères se superposent`);
      }
      scenarios++;
    }
  }
}
console.log(`Positions : ${families.length} arbres, ${scenarios} configurations validées (1–12 générations, sérialisation et ordre inversé).`);
