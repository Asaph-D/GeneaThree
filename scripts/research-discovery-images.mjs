import fs from 'node:fs/promises';

const output = 'GeneaTree/test-artifacts/image-review';
await fs.mkdir(output, { recursive: true });
const catalog = JSON.parse(await fs.readFile('api/geneatree/src/main/resources/discovery/popular-trees.json', 'utf8'));
const people = [...new Map(catalog.entries.flatMap((entry) => entry.tree.persons.map((person) => [person.id, person]))).values()];
const missing = people.filter((person) => !person.photoUrl);
const headers = { 'User-Agent': 'GeneaTreePro/1.0 (public-domain genealogy image research)' };
async function json(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
    if (response.ok) return response.json();
    if (![429, 503].includes(response.status)) throw Error(`HTTP ${response.status}`);
    const delay = Math.max(Number(response.headers.get('retry-after')) * 1000 || 0, 5000 * (attempt + 1));
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw Error('Source temporarily unavailable');
}
let entities = {};
try { entities = JSON.parse(await fs.readFile(`${output}/entities.json`, 'utf8')); } catch {}
const uncached = missing.filter((person) => !entities[person.id.slice(3)]);
for (let start = 0; start < uncached.length; start += 30) {
  const params = new URLSearchParams({ action: 'wbgetentities', ids: uncached.slice(start, start + 30).map((person) => person.id.slice(3)).join('|'), props: 'claims|labels|descriptions', languages: 'fr|en', format: 'json' });
  Object.assign(entities, (await json(`https://www.wikidata.org/w/api.php?${params}`)).entities);
  await fs.writeFile(`${output}/entities.json`, JSON.stringify(entities));
}
let report = [];
try { report = JSON.parse(await fs.readFile(`${output}/research.json`, 'utf8')); } catch {}
report = report.filter((item) => item.status !== 'search-failed');
for (const person of missing) {
  if (report.some((item) => item.personId === person.id)) continue;
  const qid = person.id.slice(3);
  const entity = entities[qid];
  const p18 = entity.claims?.P18?.filter((claim) => claim.rank !== 'deprecated').map((claim) => claim.mainsnak?.datavalue?.value).filter(Boolean) ?? [];
  const record = { personId: person.id, name: `${person.firstName} ${person.lastName}`.trim(), entityUrl: `https://www.wikidata.org/wiki/${qid}`, p18, category: entity.claims?.P373?.[0]?.mainsnak?.datavalue?.value ?? null, candidates: [] };
  if (/^NN\b/.test(record.name)) {
    record.status = 'unidentified-person';
  } else if (p18.length) {
    record.status = 'wikidata-image-found';
  } else {
    try {
      const params = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: `haswbstatement:P180=${qid}`, gsrnamespace: '6', gsrlimit: '8', prop: 'imageinfo', iiprop: 'url|extmetadata|mime', iiurlwidth: '512', format: 'json' });
      const data = await json(`https://commons.wikimedia.org/w/api.php?${params}`);
      record.candidates = Object.values(data.query?.pages ?? {}).map((page) => ({ title: page.title, ...page.imageinfo?.[0] }));
      record.status = record.candidates.length ? 'commons-depicts-candidates' : 'no-identified-image';
    } catch (error) { record.status = 'search-failed'; record.error = error.message; }
  }
  report.push(record);
  await fs.writeFile(`${output}/research.json`, JSON.stringify(report, null, 2));
  console.log(record.status, record.name, record.candidates.length || p18.length);
  await new Promise((resolve) => setTimeout(resolve, 2500));
}
console.log(JSON.stringify({ researched: report.length, refreshedP18: report.filter((item) => item.p18.length).length, commonsCandidates: report.filter((item) => item.candidates.length).length, unidentified: report.filter((item) => item.status === 'unidentified-person').length }));
