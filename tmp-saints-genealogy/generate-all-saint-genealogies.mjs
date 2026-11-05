import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1'));
const catalogueRoot = path.join(root, 'catalogue');
const catalogPath = path.join(catalogueRoot, 'catalog.json');
const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
const saintEntries = catalog.entries.filter((entry) => entry.kind === 'saint');
const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
const entityCache = new Map();
const auditPath = path.join(catalogueRoot, 'wikidata-resolution-audit.json');
let resolutionAudit = [];
try { resolutionAudit = JSON.parse(await fs.readFile(auditPath, 'utf8')); } catch { resolutionAudit = []; }

const knownIds = new Map([
  ['saint-louis-ix', 'Q346'],
  ['sainte-elisabeth-de-hongrie', 'Q159862'],
  ['sainte-marguerite-ecosse', 'Q230507'],
]);

async function fetchJson(url, attempts = 6) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': 'GeneaTreeProResearch/1.0 (catalogue genealogy generation)' } });
    if (response.ok) return response.json();
    if (response.status !== 429) throw new Error(`${response.status} ${url}`);
    await wait(1800 * (attempt + 1));
  }
  throw new Error(`Limitation persistante : ${url}`);
}

async function resolveEntry(entry) {
  if (knownIds.has(entry.id)) return { id: knownIds.get(entry.id), method: 'curated' };
  const query = encodeURIComponent(entry.title);
  const data = await fetchJson(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${query}&language=fr&uselang=fr&type=item&limit=8&format=json&origin=*`);
  const normalizedTitle = entry.title.toLocaleLowerCase('fr').replace(/^(saint|sainte|bienheureuse)\s+/, '');
  const ranked = (data.search ?? []).map((candidate) => {
    const haystack = `${candidate.label ?? ''} ${candidate.description ?? ''} ${(candidate.aliases ?? []).join(' ')}`.toLocaleLowerCase('fr');
    let score = haystack.includes(normalizedTitle) ? 5 : 0;
    if (/saint|sainte|martyr|apôtre|évêque|religieuse|pape|théologien|mystique/.test(haystack)) score += 3;
    for (const alias of entry.aliases ?? []) if (haystack.includes(alias.toLocaleLowerCase('fr'))) score += 1;
    return { ...candidate, score };
  }).sort((left, right) => right.score - left.score);
  const selected = ranked[0];
  await wait(120);
  return selected ? { id: selected.id, method: 'search', label: selected.label, description: selected.description, score: selected.score } : null;
}

for (const entry of saintEntries) {
  if (resolutionAudit.some((record) => record.catalogueId === entry.id && record.id)) continue;
  try {
    const resolution = await resolveEntry(entry);
    resolutionAudit = resolutionAudit.filter((record) => record.catalogueId !== entry.id);
    resolutionAudit.push({ catalogueId: entry.id, title: entry.title, ...resolution });
  } catch (error) {
    resolutionAudit = resolutionAudit.filter((record) => record.catalogueId !== entry.id);
    resolutionAudit.push({ catalogueId: entry.id, title: entry.title, id: null, method: 'unresolved', error: error.message });
  }
  await fs.writeFile(auditPath, `${JSON.stringify(resolutionAudit, null, 2)}\n`, 'utf8');
  await wait(650);
}

async function fetchEntities(ids) {
  const missing = [...new Set(ids)].filter((id) => id && !entityCache.has(id));
  for (let index = 0; index < missing.length; index += 40) {
    const batch = missing.slice(index, index + 40);
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batch.join('|')}&props=labels|claims&languages=fr|en&languagefallback=1&format=json&origin=*`;
    const data = await fetchJson(url);
    for (const [id, entity] of Object.entries(data.entities ?? {})) entityCache.set(id, entity);
    await wait(180);
  }
}

const rootIds = resolutionAudit.map((record) => record.id).filter(Boolean);
await fetchEntities(rootIds);
let frontier = rootIds;
for (let depth = 1; depth < 6; depth += 1) {
  const parents = [];
  for (const id of frontier) {
    const entity = entityCache.get(id);
    parents.push(claimId(entity, 'P22'), claimId(entity, 'P25'));
  }
  frontier = [...new Set(parents.filter(Boolean))];
  await fetchEntities(frontier);
}

function claimId(entity, property) {
  return entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value?.id;
}
function claimTime(entity, property) {
  return entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value?.time?.replace(/^\+/, '').slice(0, 10);
}
function entityLabel(entity, fallback) {
  return entity?.labels?.fr?.value || entity?.labels?.en?.value || fallback;
}
function splitName(fullName) {
  const normalized = fullName.replace(/^(Saint|Sainte|Bienheureuse|St\.?|Ste\.?)\s+/i, '').trim();
  const parts = normalized.split(/\s+/);
  return { firstName: parts.shift() || normalized, lastName: parts.join(' ') };
}
function collectAncestors(rootId) {
  const records = new Map();
  const visit = (id, depth) => {
    if (!id || depth > 5 || records.has(id) || !entityCache.has(id)) return;
    const entity = entityCache.get(id);
    records.set(id, { entity, depth });
    visit(claimId(entity, 'P22'), depth + 1);
    visit(claimId(entity, 'P25'), depth + 1);
  };
  visit(rootId, 0);
  return records;
}

const generationReport = [];
for (const entry of saintEntries) {
  const metadataPath = path.join(catalogueRoot, entry.metadata);
  const directory = path.dirname(metadataPath);
  const resolution = resolutionAudit.find((record) => record.catalogueId === entry.id);
  const records = resolution?.id ? collectAncestors(resolution.id) : new Map();
  if (!records.size) {
    records.set(`local-${entry.id}`, { entity: { id: `local-${entry.id}`, labels: { fr: { value: entry.title } }, claims: {} }, depth: 0 });
  }
  const rootId = resolution?.id ?? `local-${entry.id}`;
  const childMap = new Map([...records.keys()].map((id) => [id, []]));
  for (const [id, { entity }] of records) {
    for (const parentId of [claimId(entity, 'P22'), claimId(entity, 'P25')]) if (records.has(parentId)) childMap.get(parentId).push(id);
  }
  const persons = [...records].map(([id, { entity }]) => {
    const parents = [claimId(entity, 'P22'), claimId(entity, 'P25')].filter((parentId) => records.has(parentId));
    const children = childMap.get(id) ?? [];
    const spouses = new Set();
    for (const childId of children) {
      const child = records.get(childId).entity;
      for (const parentId of [claimId(child, 'P22'), claimId(child, 'P25')]) if (parentId && parentId !== id && records.has(parentId)) spouses.add(parentId);
    }
    const genderId = claimId(entity, 'P21');
    const name = splitName(entityLabel(entity, entry.title));
    return {
      id: id.startsWith('local-') ? id : `wd-${id}`,
      firstName: name.firstName,
      lastName: name.lastName,
      birthDate: claimTime(entity, 'P569') || '',
      birthPlace: { city: '', region: '', country: '' },
      deathDate: claimTime(entity, 'P570') || undefined,
      gender: genderId === 'Q6581072' ? 'female' : genderId === 'Q6581097' ? 'male' : 'unknown',
      deceased: Boolean(claimTime(entity, 'P570')),
      biography: id.startsWith('local-') ? entry.description : `Notice structurée : https://www.wikidata.org/wiki/${id}`,
      notes: 'Filiation structurée à réviser éditorialement avant publication.',
      parentIds: parents.map((parentId) => `wd-${parentId}`),
      childrenIds: children.map((childId) => `wd-${childId}`),
      spouseIds: [...spouses].map((spouseId) => `wd-${spouseId}`),
      siblingIds: [],
      eventIds: [],
    };
  });
  for (const person of persons) person.siblingIds = persons.filter((candidate) => candidate.id !== person.id && candidate.parentIds.some((parentId) => person.parentIds.includes(parentId))).map((candidate) => candidate.id);
  const unionMap = new Map();
  for (const child of persons) if (child.parentIds.length === 2) {
    const pair = [...child.parentIds].sort();
    const key = pair.join('|');
    if (!unionMap.has(key)) unionMap.set(key, { id: `union-${pair.map((id) => id.replace('wd-', '')).join('-')}`, spouse1Id: pair[0], spouse2Id: pair[1], childrenIds: [] });
    unionMap.get(key).childrenIds.push(child.id);
  }
  const maxDepth = Math.max(...[...records.values()].map((record) => record.depth));
  const archive = {
    format: 'geneatree-family',
    version: 1,
    exportedAt: new Date().toISOString(),
    persons,
    marriages: [...unionMap.values()],
    view: { viewType: 'tree', generations: Math.max(1, Math.min(7, maxDepth + 1)), focusPersonId: rootId.startsWith('local-') ? rootId : `wd-${rootId}` },
    research: { subject: entry.id, wikidataId: resolution?.id ?? null, imagePolicy: 'Images volontairement non indexées', completeness: persons.length > 1 ? 'structured-ancestry-found' : 'subject-only', caveat: 'Les filiations historiques et hagiographiques exigent une validation éditoriale.' },
  };
  await fs.writeFile(path.join(directory, 'tree.geneatree.json'), `${JSON.stringify(archive, null, 2)}\n`, 'utf8');
  const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
  metadata.archive = 'tree.geneatree.json';
  metadata.status.genealogy = 'available';
  metadata.status.images = 'pending';
  metadata.status.research = persons.length > 1 ? 'generated-review-required' : 'subject-only-review-required';
  metadata.editorial.wikidataId = resolution?.id ?? null;
  await fs.writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  entry.status = metadata.status;
  generationReport.push({ id: entry.id, wikidataId: resolution?.id ?? null, persons: persons.length, generations: maxDepth + 1, resolution: resolution?.method ?? 'unresolved' });
}

await fs.writeFile(auditPath, `${JSON.stringify(resolutionAudit, null, 2)}\n`, 'utf8');
await fs.writeFile(path.join(catalogueRoot, 'genealogy-generation-report.json'), `${JSON.stringify(generationReport, null, 2)}\n`, 'utf8');
await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ saints: saintEntries.length, withAncestry: generationReport.filter((item) => item.persons > 1).length, subjectOnly: generationReport.filter((item) => item.persons === 1).length, persons: generationReport.reduce((sum, item) => sum + item.persons, 0) }, null, 2));
