import fs from 'node:fs/promises';
import { normalizeDiscoveryDates } from './discovery-dates.mjs';

const catalogPath = 'api/geneatree/src/main/resources/discovery/popular-trees.json';
const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
const subjects = JSON.parse(await fs.readFile('scripts/discovery-subjects.json', 'utf8'));
const cache = new Map();
const claim = (entity, property) => entity.claims?.[property]?.find((item) => item.rank !== 'deprecated' && item.mainsnak?.datavalue)?.mainsnak.datavalue.value;
async function entity(id) {
  if (!cache.has(id)) {
    const response = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${id}.json`);
    if (!response.ok) throw new Error(`Wikidata ${id}: ${response.status}`);
    cache.set(id, (await response.json()).entities[id]);
  }
  return cache.get(id);
}

for (const entry of catalog.entries) {
  const subject = subjects[entry.id];
  if (entry.tree.view.focusPersonId === `wd-${subject.entityId}`) continue;
  const records = new Map();
  async function visit(id, depth) {
    if (!id || depth >= 6 || records.has(id)) return;
    const value = await entity(id);
    if (!value.claims?.P31?.some((item) => item.mainsnak?.datavalue?.value?.id === 'Q5')) {
      throw new Error(`${entry.id}: ${id} n'est pas une personne`);
    }
    records.set(id, { value, depth });
    await visit(claim(value, 'P22')?.id, depth + 1);
    await visit(claim(value, 'P25')?.id, depth + 1);
  }
  await visit(subject.entityId, 0);
  const persons = [...records].map(([id, { value }]) => {
    const label = value.labels?.fr?.value ?? value.labels?.en?.value;
    const names = label.split(/\s+/);
    const parents = [...new Set(['P22', 'P25'].map((key) => claim(value, key)?.id).filter((parent) => records.has(parent)))];
    const date = (key) => claim(value, key)?.time?.replace(/^\+/, '').slice(0, 10) ?? '';
    const image = claim(value, 'P18');
    return {
      id: `wd-${id}`, firstName: names.shift(), lastName: names.join(' '),
      birthDate: date('P569'), birthPlace: { city: '', region: '', country: '' },
      deathDate: date('P570') || undefined, deceased: true,
      gender: claim(value, 'P21')?.id === 'Q6581072' ? 'female' : claim(value, 'P21')?.id === 'Q6581097' ? 'male' : 'unknown',
      photoUrl: image ? `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(image)}?width=512` : undefined,
      biography: `Notice structurée : https://www.wikidata.org/wiki/${id}`,
      notes: 'Parentés structurées issues de Wikidata ; vérification historique éditoriale requise.',
      parentIds: parents.map((parent) => `wd-${parent}`), childrenIds: [], spouseIds: [], siblingIds: [], eventIds: [],
    };
  });
  const byId = new Map(persons.map((person) => [person.id, person]));
  const unions = new Map();
  for (const child of persons) {
    child.parentIds.forEach((id) => byId.get(id).childrenIds.push(child.id));
    if (child.parentIds.length !== 2) continue;
    const [first, second] = child.parentIds;
    if (!byId.get(first).spouseIds.includes(second)) byId.get(first).spouseIds.push(second);
    if (!byId.get(second).spouseIds.includes(first)) byId.get(second).spouseIds.push(first);
    const key = [...child.parentIds].sort().join('-');
    if (!unions.has(key)) unions.set(key, { id: `union-${key}`, spouse1Id: first, spouse2Id: second, childrenIds: [], rank: 1 });
    unions.get(key).childrenIds.push(child.id);
  }
  persons.forEach((person) => {
    person.siblingIds = persons.filter((other) => other.id !== person.id && other.parentIds.some((id) => person.parentIds.includes(id))).map((other) => other.id);
  });
  entry.tree = { version: 1, persons, marriages: [...unions.values()], view: { viewType: 'tree', generations: Math.max(...[...records.values()].map((item) => item.depth)) + 1, focusPersonId: `wd-${subject.entityId}` } };
  entry.personCount = persons.length;
  entry.generations = entry.tree.view.generations;
  entry.imageUrl = persons[0].photoUrl ?? null;
  console.log(`${entry.id}: ${persons[0].firstName} ${persons[0].lastName}, ${persons.length} personnes`);
}
catalog.entries.forEach((entry) => normalizeDiscoveryDates(entry.tree));
await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
