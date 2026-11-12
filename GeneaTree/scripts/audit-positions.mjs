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
const mixedPeople = [
  { id: 'paul', parentIds: [], childrenIds: ['jean', 'luc'], spouseIds: ['marie', 'anne'] },
  { id: 'marie', parentIds: [], childrenIds: [], spouseIds: ['paul'] },
  { id: 'anne', parentIds: [], childrenIds: ['luc'], spouseIds: ['paul'] },
  { id: 'jean', parentIds: ['paul'], childrenIds: ['amina'], spouseIds: [] },
  { id: 'luc', parentIds: ['paul', 'anne'], childrenIds: ['aline'], spouseIds: [] },
  { id: 'amina', parentIds: ['jean'], childrenIds: [], spouseIds: [] },
  { id: 'aline', parentIds: ['luc'], childrenIds: [], spouseIds: [] },
].map(person => ({ ...person, firstName: person.id, lastName: '', gender: 'unknown', siblingIds: [] }));
const mixedUnions = [
  { id: 'first', spouse1Id: 'paul', spouse2Id: 'marie', childrenIds: [], rank: 1 },
  { id: 'second', spouse1Id: 'paul', spouse2Id: 'anne', childrenIds: ['luc'], rank: 2 },
];
const mixedFamilies = [1, 2].flatMap(count => [false, true].map(secondary => ({
  id: `known-and-unknown-parent-${count}-${secondary ? 'secondary' : 'primary'}`,
  persons: secondary ? mixedPeople.map(person => person.id === 'paul' ? { ...person, childrenIds: ['luc'] }
    : person.id === 'anne' ? { ...person, childrenIds: ['luc', 'jean'] }
      : person.id === 'jean' ? { ...person, parentIds: ['anne'] } : person) : mixedPeople,
  marriages: mixedUnions.slice(2 - count),
})));
const asaphPeople = [
  { id:'asaph', parentIds:['paul','brigitte'], childrenIds:[], spouseIds:[] },
  { id:'paul', parentIds:['innocent','elise'], childrenIds:['asaph'], spouseIds:['brigitte'] },
  { id:'brigitte', parentIds:['antoine','marceline'], childrenIds:['asaph'], spouseIds:['paul'] },
  { id:'innocent', parentIds:[], childrenIds:['paul'], spouseIds:['marie'] },
  { id:'elise', parentIds:[], childrenIds:['paul'], spouseIds:[] },
  { id:'antoine', parentIds:[], childrenIds:['brigitte'], spouseIds:[] },
  { id:'marceline', parentIds:[], childrenIds:['brigitte'], spouseIds:[] },
  { id:'marie', parentIds:[], childrenIds:[], spouseIds:['innocent'] },
].map(p => ({ ...p, firstName:p.id, lastName:'', siblingIds:[], gender:['brigitte','elise','marie','marceline'].includes(p.id) ? 'female' : 'male' }));
const asaphUnions = [{ id:'parents-asaph', spouse1Id:'paul', spouse2Id:'brigitte', childrenIds:['asaph'], rank:1 }, { id:'second-wife', spouse1Id:'innocent', spouse2Id:'marie', childrenIds:[], rank:1 }];
const asaphFamilies = [
  { id:'asaph-parent-junction', persons:asaphPeople.filter(p => !['antoine','marceline','marie'].includes(p.id)).map(p => p.id==='brigitte'?{...p,parentIds:[]}:p), marriages:asaphUnions.slice(0,1) },
  { id:'asaph-two-ancestries', persons:asaphPeople, marriages:asaphUnions },
  { id:'asaph-explicit-unions', persons:asaphPeople, marriages:[...asaphUnions, { id:'parents-paul', spouse1Id:'innocent', spouse2Id:'elise', childrenIds:['paul'], rank:0 }, { id:'parents-brigitte', spouse1Id:'antoine', spouse2Id:'marceline', childrenIds:['brigitte'], rank:1 }] },
];
for (const explicit of [false,true]) for (const reversed of [false,true]) for (const parentRank of [0,1,2]) {
  const persons=[...asaphPeople.map(person=>['innocent','elise'].includes(person.id)?{...person,childrenIds:[...person.childrenIds,'david']}:person),
    {id:'david',firstName:'david',lastName:'',gender:'male',parentIds:['innocent','elise'],childrenIds:[],spouseIds:[],siblingIds:[]}];
  const marriages=(explicit?asaphFamilies[2].marriages:asaphUnions).map(union=>union.id==='parents-asaph'&&reversed?{...union,spouse1Id:'brigitte',spouse2Id:'paul'}
    :union.id==='parents-paul'?{...union,rank:parentRank,childrenIds:['paul','david']}:union);
  asaphFamilies.push({id:`asaph-david-${explicit}-${reversed}-${parentRank}`,persons,marriages});
}
const families = [...SAMPLE_FAMILIES, ...catalog.entries.map((entry) => ({ id: entry.id, ...entry.tree })), { id: 'brigitte-paul', persons: fixturePeople, marriages: fixtureUnions }, ...mixedFamilies, ...asaphFamilies];
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
      // A household with no competing ancestry is an indivisible interval.
      // No person from another family may stand between its partners.
      const known = new Map(variant.persons.map(person => [person.id,person]));
      const edges = [
        ...variant.marriages.map(union => [union.spouse1Id,union.spouse2Id]),
        ...variant.persons.map(person => person.parentIds.filter(id => known.has(id))).filter(ids => ids.length === 2),
      ];
      const adjacency = new Map(layout.nodes.map(node => [node.person.id,new Set()]));
      for (const [a,b] of edges) {
        if (!adjacency.has(a) || !adjacency.has(b)) continue;
        if (known.get(a).parentIds.some(id=>known.has(id)) && known.get(b).parentIds.some(id=>known.has(id))) continue;
        adjacency.get(a).add(b); adjacency.get(b).add(a);
      }
      const checked = new Set();
      for (const [id] of adjacency) {
        if (checked.has(id)) continue;
        const component = new Set([id]), queue = [id];
        while (queue.length) for (const neighbour of adjacency.get(queue.pop())) {
          if (!component.has(neighbour)) { component.add(neighbour); queue.push(neighbour); }
        }
        component.forEach(member => checked.add(member));
        if (component.size < 2) continue;
        const own = [...component].map(member=>byId.get(member));
        const min = Math.min(...own.map(node=>node.x)), max = Math.max(...own.map(node=>node.x));
        for (const foreign of layout.nodes.filter(node=>node.depth===own[0].depth && !component.has(node.person.id))) {
          assert.ok(foreign.x < min || foreign.x > max, `${label}: foyer traversé par ${foreign.person.id}`);
        }
      }
      for (const union of variant.marriages) {
        const a = byId.get(union.spouse1Id), b = byId.get(union.spouse2Id);
        if (!a || !b) continue;
        const households = variant.marriages.filter((u) => u.spouse1Id === a.person.id && byId.has(u.spouse2Id));
        const marriedKids = new Set(variant.marriages.flatMap(u => u.childrenIds ?? []));
        const hasLoose = person => person.childrenIds.some(id => !marriedKids.has(id));
        const rail = households.length > 1 || hasLoose(a.person) || households.some(u => hasLoose(byId.get(u.spouse2Id).person));
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
      if (family.id.startsWith('asaph-')) {
        if (family.id !== 'asaph-parent-junction') {
          const own = ['innocent','elise','marie'].map(id => byId.get(id));
          const min = Math.min(...own.map(n => n.x)), max = Math.max(...own.map(n => n.x));
          for (const id of ['antoine','marceline']) assert.ok(byId.get(id).x < min || byId.get(id).x > max, `${label}: ${id} traverse le foyer d'Innocent`);
        }
        if (generations > 1) {
          const first = byId.get('innocent'), second = byId.get('elise'), child = byId.get('paul');
          assert.ok(layout.drops.some(drop => drop.drops.some(end => close(end.x,child.x) && close(end.y,child.y-28))
            && (close(drop.x1,(first.x+second.x)/2) || (close(drop.x1,second.x) && close(drop.y1,first.y+100)))), `${label}: Paul doit partir d'une jonction parentale commune`);
          assert.equal(layout.drops.filter(drop=>drop.drops.some(end=>close(end.x,child.x)&&close(end.y,child.y-28))).length,1,`${label}: Paul ne doit pas recevoir deux traits parentaux indépendants`);
          if (byId.has('david')) {
            const paul=byId.get('paul'), david=byId.get('david'), brigitte=byId.get('brigitte');
            assert.ok(brigitte.x < Math.min(paul.x,david.x) || brigitte.x > Math.max(paul.x,david.x),`${label}: David traverse la famille de Brigitte`);
            assert.ok(david.x < Math.min(paul.x,brigitte.x) || david.x > Math.max(paul.x,brigitte.x),`${label}: David traverse le couple Paul–Brigitte`);
          }
        }
      }
      scenarios++;
    }
  }
}
console.log(`Positions : ${families.length} arbres, ${scenarios} configurations validées (1–12 générations, sérialisation et ordre inversé).`);
