import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1'));
const saints = [
  { id: 'Q346', slug: 'saint-louis-ix', generations: 6, sources: ['https://www.newadvent.org/cathen/09368a.htm', 'https://www.sainte-chapelle.fr/en/discover/saint-louis'] },
  { id: 'Q159862', slug: 'sainte-elisabeth-de-hongrie', generations: 6, sources: ['https://www.vatican.va/content/benedict-xvi/en/audiences/2010/documents/hf_ben-xvi_aud_20101020.html', 'https://www.newadvent.org/cathen/05389a.htm'] },
  { id: 'Q230507', slug: 'sainte-marguerite-ecosse', generations: 6, sources: ['https://www.newadvent.org/cathen/09655c.htm', 'https://www.britannica.com/biography/Saint-Margaret-of-Scotland'] },
];

const cache = new Map();
const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
async function entity(id) {
  if (cache.has(id)) return cache.get(id);
  let response;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    response = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${id}.json`, { headers: { 'User-Agent': 'GeneaTreeProResearch/1.0 (genealogy research archive)' } });
    if (response.ok) break;
    if (response.status !== 429) throw new Error(`Wikidata ${id}: ${response.status}`);
    await wait(750 * (attempt + 1));
  }
  if (!response?.ok) throw new Error(`Wikidata ${id}: limitation persistante`);
  const value = (await response.json()).entities[id];
  cache.set(id, value);
  return value;
}
const claimId = (value, property) => value.claims?.[property]?.[0]?.mainsnak?.datavalue?.value?.id;
const claimTime = (value, property) => value.claims?.[property]?.[0]?.mainsnak?.datavalue?.value?.time?.replace(/^\+/, '').slice(0, 10);
const label = (value) => value.labels?.fr?.value || value.labels?.en?.value || value.id;

async function collect(rootId, maxDepth) {
  const found = new Map();
  async function visit(id, depth) {
    if (!id || depth > maxDepth || found.has(id)) return;
    const value = await entity(id);
    found.set(id, { value, depth });
    await visit(claimId(value, 'P22'), depth + 1);
    await visit(claimId(value, 'P25'), depth + 1);
    await wait(80);
  }
  await visit(rootId, 0);
  return found;
}

function splitName(fullName) {
  const normalized = fullName.replace(/^(Saint|Sainte|St\.?|St\.?)\s+/i, '').trim();
  const parts = normalized.split(/\s+/);
  return { firstName: parts.shift() || normalized, lastName: parts.join(' ') };
}

for (const saint of saints) {
  const records = await collect(saint.id, saint.generations - 1);
  const childMap = new Map([...records.keys()].map((id) => [id, []]));
  for (const [id, { value }] of records) {
    [claimId(value, 'P22'), claimId(value, 'P25')].filter((parentId) => records.has(parentId)).forEach((parentId) => childMap.get(parentId).push(id));
  }
  const persons = [];
  for (const [id, { value }] of records) {
    const father = claimId(value, 'P22');
    const mother = claimId(value, 'P25');
    const parents = [father, mother].filter((parentId) => records.has(parentId));
    const children = childMap.get(id);
    const spouses = new Set();
    for (const childId of children) {
      const child = records.get(childId).value;
      [claimId(child, 'P22'), claimId(child, 'P25')].filter((parentId) => parentId && parentId !== id && records.has(parentId)).forEach((parentId) => spouses.add(parentId));
    }
    const genderId = claimId(value, 'P21');
    const image = value.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    const name = splitName(label(value));
    persons.push({
      id: `wd-${id}`,
      firstName: name.firstName,
      lastName: name.lastName,
      birthDate: claimTime(value, 'P569') || '',
      birthPlace: { city: '', region: '', country: '' },
      deathDate: claimTime(value, 'P570') || undefined,
      gender: genderId === 'Q6581072' ? 'female' : genderId === 'Q6581097' ? 'male' : 'unknown',
      deceased: Boolean(claimTime(value, 'P570')),
      photoUrl: image ? `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(image)}?width=512` : undefined,
      biography: `Notice structurée : https://www.wikidata.org/wiki/${id}`,
      notes: `Parenté importée depuis Wikidata. Vérification éditoriale recommandée pour les filiations médiévales discutées.`,
      parentIds: parents.map((parentId) => `wd-${parentId}`),
      childrenIds: children.map((childId) => `wd-${childId}`),
      spouseIds: [...spouses].map((spouseId) => `wd-${spouseId}`),
      siblingIds: [],
      eventIds: [],
    });
  }
  for (const person of persons) {
    person.siblingIds = persons.filter((candidate) => candidate.id !== person.id && candidate.parentIds.some((parentId) => person.parentIds.includes(parentId))).map((candidate) => candidate.id);
  }
  const marriages = [];
  const seenUnions = new Set();
  for (const child of persons) {
    if (child.parentIds.length !== 2) continue;
    const pair = [...child.parentIds].sort();
    const key = pair.join('|');
    let union = marriages.find((candidate) => candidate.key === key);
    if (!union) {
      if (seenUnions.has(key)) continue;
      seenUnions.add(key);
      union = { key, id: `union-${pair.map((id) => id.replace('wd-', '')).join('-')}`, spouse1Id: pair[0], spouse2Id: pair[1], childrenIds: [] };
      marriages.push(union);
    }
    union.childrenIds.push(child.id);
  }
  const archive = {
    format: 'geneatree-family', version: 1, exportedAt: new Date().toISOString(),
    persons, marriages: marriages.map(({ key, ...union }) => union),
    view: { viewType: 'tree', generations: Math.min(7, saint.generations), focusPersonId: `wd-${saint.id}` },
    research: { subject: saint.id, generatedFrom: 'Wikidata', sources: saint.sources, imagePolicy: 'Wikimedia Commons P18 only', caveat: 'Les généalogies médiévales peuvent contenir des filiations discutées. Ne pas présenter ces fichiers comme des actes d’état civil.' },
  };
  const directory = path.join(root, saint.slug);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, `${saint.slug}.geneatree.json`), JSON.stringify(archive, null, 2));
  await fs.writeFile(path.join(directory, 'sources.json'), JSON.stringify({ subject: saint.id, sources: saint.sources, wikidataEntities: [...records.keys()].map((id) => `https://www.wikidata.org/wiki/${id}`), persons: persons.length, portraits: persons.filter((person) => person.photoUrl).length }, null, 2));
}

console.log(JSON.stringify({ generated: saints.map((saint) => saint.slug), entities: cache.size }, null, 2));
