import fs from 'node:fs/promises';
const output = 'GeneaTree/test-artifacts/image-review/categories.json';
const records = JSON.parse(await fs.readFile('GeneaTree/test-artifacts/image-review/research.json', 'utf8')).filter((record) => record.category);
let results = [];
try { results = JSON.parse(await fs.readFile(output, 'utf8')); } catch {}
results = results.filter((result) => result.files.some((file) => file.title));
async function category(title) {
  const params = new URLSearchParams({ action: 'query', generator: 'categorymembers', gcmtitle: `Category:${title}`, gcmnamespace: '6|14', gcmlimit: '40', prop: 'imageinfo', iiprop: 'url|extmetadata|mime', iiurlwidth: '512', format: 'json' });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) return [{ error: response.status }];
  return Object.values((await response.json()).query?.pages ?? {}).map((page) => ({ title: page.title, ...page.imageinfo?.[0] }));
}
for (const record of records) {
  if (results.some((result) => result.personId === record.personId)) continue;
  const files = await category(record.category);
  for (const child of [...files].filter((file) => file.title?.startsWith('Category:') && !/coat|coin/i.test(file.title)).slice(0, 3)) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    files.push(...await category(child.title.slice(9)));
  }
  results.push({ personId: record.personId, name: record.name, category: record.category, files });
  await fs.writeFile(output, JSON.stringify(results, null, 2));
  console.log(record.name, files.map((file) => file.title ?? file.error));
  await new Promise((resolve) => setTimeout(resolve, 2500));
}
