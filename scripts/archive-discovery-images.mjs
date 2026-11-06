import { resilientRequest, checkpoint, finish } from './image-download-retry.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const catalogPath = 'api/geneatree/src/main/resources/discovery/popular-trees.json';
const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
const directory = 'GeneaTree/public/portraits';
await fs.mkdir(directory, { recursive: true });
const people = new Map(catalog.entries.flatMap((entry) => entry.tree.persons.map((person) => [person.id, person])));
let research = [];
try { research = JSON.parse(await fs.readFile('GeneaTree/test-artifacts/image-review/research.json', 'utf8')); } catch {}
let selections = {};
try { selections = JSON.parse(await fs.readFile('scripts/discovery-image-selections.json', 'utf8')); } catch {}
let manifest = { images: [], people: {} };
try { manifest = JSON.parse(await fs.readFile(`${directory}/credits.json`, 'utf8')); } catch {}
function fileFromUrl(url) {
  if (!url || url.startsWith('/')) return null;
  const parsed = new URL(url);
  if (parsed.hostname !== 'commons.wikimedia.org') return null;
  const title = parsed.searchParams.get('title') ?? decodeURIComponent(parsed.pathname.replace(/^\/wiki\//, ''));
  return title.replace(/^Special:Redirect\/file\//i, '');
}
const requests = new Map();
for (const person of people.values()) {
  const fresh = research.find((item) => item.personId === person.id)?.p18?.[0];
  const file = selections[person.id]?.fileName ?? fresh ?? fileFromUrl(person.photoUrl) ?? manifest.images.find(image => image.localUrl === manifest.people[person.id])?.fileName;
  if (file) requests.set(person.id, file);
}
const normalize = (value) => value.replace(/^File:/, '').replaceAll('_', ' ').normalize('NFC');
let metadata = {};
const cachePath = 'GeneaTree/test-artifacts/image-review/commons-metadata.json';
try { metadata = JSON.parse(await fs.readFile(cachePath, 'utf8')); } catch {}
const headers = { 'User-Agent': 'GeneaTreePro/1.0 (genealogy image preservation and attribution)' };
const names = [...new Set(requests.values())].filter((name) => !metadata[normalize(name)]);
async function request(url) { return resilientRequest(url, headers); }
for (let index = 0; index < names.length; index += 5) {
  const params = new URLSearchParams({ action: 'query', titles: names.slice(index, index + 5).map((name) => `File:${name}`).join('|'), prop: 'imageinfo', iiprop: 'url|extmetadata|mime|sha1', iilimit: '1', iiurlwidth: '512', redirects: '1', format: 'json' });
  const response = await request(`https://commons.wikimedia.org/w/api.php?${params}`);
  if (!response.ok) throw Error(`Commons metadata: ${response.status}`);
  const data = await response.json();
  for (const page of Object.values(data.query?.pages ?? {})) {
    if (page.imageinfo?.[0]) metadata[normalize(page.title)] = { fileName: page.title.replace(/^File:/, ''), ...page.imageinfo[0] };
  }
  for (const alias of [...(data.query?.normalized ?? []), ...(data.query?.redirects ?? [])].reverse()) {
    if (metadata[normalize(alias.to)]) metadata[normalize(alias.from)] = metadata[normalize(alias.to)];
  }
  await fs.writeFile(cachePath, JSON.stringify(metadata));
  console.log('METADATA', index + 5, '/', names.length);
  await new Promise((resolve) => setTimeout(resolve, 1200));
}
const plain = (value = '') => value.replace(/<[^>]*>/g, '').replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#039;', "'").replaceAll('&nbsp;', ' ').trim();
const failures = [];
await checkpoint({ plannedPeople: requests.size, copiedFiles: manifest.images.length, linkedPeople: Object.keys(manifest.people).length });
for (const [personId, requestedName] of requests) {
  const info = metadata[normalize(requestedName)];
  if (!info) { failures.push({ personId, file: requestedName, reason: 'metadata-unavailable' }); continue; }
  const existing = manifest.images.find((image) => image.fileName === info.fileName);
  if (existing) { manifest.people[personId] = existing.localUrl; continue; }
  const meta = info.extmetadata ?? {};
  const license = plain(meta.LicenseShortName?.value);
  if (!/^(public domain|pdm-owner|cc0|cc[ -]by)/i.test(license)) {
    failures.push({ personId, file: requestedName, reason: `license-review: ${license}` }); continue;
  }
  try {
    // Preserve the original public file; thumbnail generation is a separate,
    // rate-limited service and is unnecessary for keeping an independent copy.
    const downloadUrl = info.url;
    const response = await request(downloadUrl);
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    const mime = response.headers.get('content-type')?.split(';')[0];
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[mime];
    if (!extension) throw Error(`Unsupported image format: ${mime}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw Error(`Unexpected image size: ${bytes.length}`);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const fileName = `${sha256}.${extension}`;
    await fs.writeFile(`${directory}/${fileName}`, bytes);
    const image = {
      localUrl: `/portraits/${fileName}`, sha256, bytes: bytes.length, mime,
      fileName: info.fileName, sourcePage: info.descriptionurl, sourceUrl: info.url,
      downloadedUrl: downloadUrl, retrievedAt: new Date().toISOString(),
      author: plain(meta.Artist?.value), credit: plain(meta.Credit?.value),
      title: plain(meta.ObjectName?.value) || info.fileName,
      license, licenseUrl: /^https?:\/\//.test(meta.LicenseUrl?.value ?? '') ? meta.LicenseUrl.value : null,
      identitySource: selections[personId]?.identitySource ?? `https://www.wikidata.org/wiki/${personId.slice(3)}`,
      representation: selections[personId]?.representation ?? 'Image associée à cette personne dans Wikidata.',
      change: 'Copie conservée telle que reçue de Wikimedia ; aucun recadrage local.',
    };
    manifest.images.push(image);
    manifest.people[personId] = image.localUrl;
    await fs.writeFile(`${directory}/credits.json`, JSON.stringify(manifest, null, 2));
    console.log('ARCHIVED', personId, bytes.length, info.fileName);
    await checkpoint({ copiedFiles: manifest.images.length, linkedPeople: Object.keys(manifest.people).length, currentFile: info.fileName });
    await new Promise((resolve) => setTimeout(resolve, 1500));
  } catch (error) { failures.push({ personId, file: requestedName, reason: error.message }); console.log('FAILED', personId, error.message); }
}
await fs.writeFile(`${directory}/credits.json`, JSON.stringify(manifest, null, 2));
await fs.writeFile('GeneaTree/test-artifacts/image-review/archive-failures.json', JSON.stringify(failures, null, 2));
for (const entry of catalog.entries) {
  entry.tree.persons.forEach((person) => { if (manifest.people[person.id]) person.photoUrl = manifest.people[person.id]; });
  entry.imageUrl = entry.tree.persons.find((person) => person.id === entry.tree.view.focusPersonId)?.photoUrl ?? null;
}
await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
const sourceRoot = 'tmp-saints-genealogy/catalogue';
// Source research archives are optional local artifacts, absent from a fresh checkout.
let sourceCatalog = { entries: [] };
try { sourceCatalog = JSON.parse(await fs.readFile(`${sourceRoot}/catalog.json`, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const item of sourceCatalog.entries.filter((item) => item.kind === 'saint')) {
  const metadataPath = path.join(sourceRoot, item.metadata);
  const entry = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
  const archivePath = path.join(path.dirname(metadataPath), entry.archive);
  const archive = JSON.parse(await fs.readFile(archivePath, 'utf8'));
  archive.persons.forEach((person) => { if (manifest.people[person.id]) person.photoUrl = manifest.people[person.id]; });
  await fs.writeFile(archivePath, `${JSON.stringify(archive, null, 2)}\n`);
}
const escape = (value = '') => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const creditsHtml = `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Crédits des images — GeneaTreePro</title><style>body{font:16px/1.6 system-ui;max-width:1000px;margin:32px auto;padding:16px}article{border-bottom:1px solid #bbb;padding:20px 0;display:flex;gap:20px}img{width:100px;height:120px;object-fit:contain}h2{font-size:18px}a{color:#075985}</style><h1>Crédits des images du catalogue</h1><p>Copies conservées avec le site. Les représentations anciennes sont des œuvres artistiques, pas des photographies contemporaines des personnes.</p><p><a href="/atelier">Retour au catalogue</a> · <a href="/portraits/credits.json">Registre des sources et empreintes SHA-256</a></p>${manifest.images.map((image) => `<article id="${image.sha256}"><img loading="lazy" src="${image.localUrl}" alt=""><div><h2>${escape(image.title)}</h2><p>${escape(image.author || 'Auteur non renseigné')}<br>${escape(image.credit)}</p><p><a href="${escape(image.sourcePage)}">Fichier source et attribution complète</a> · ${image.licenseUrl ? `<a href="${escape(image.licenseUrl)}">${escape(image.license)}</a>` : escape(image.license)}<br>${escape(image.change)}</p></div></article>`).join('')}</html>`;
await fs.writeFile(`${directory}/credits.html`, creditsHtml);
console.log(JSON.stringify({ copiedFiles: manifest.images.length, linkedPeople: Object.keys(manifest.people).length, failures: failures.length, bytes: manifest.images.reduce((sum, image) => sum + image.bytes, 0) }));

await finish({ status: failures.length ? 'needs-review' : 'complete', finishedAt: new Date().toISOString(), failures: failures.length, copiedFiles: manifest.images.length, linkedPeople: Object.keys(manifest.people).length, nextRetryAt: null });
