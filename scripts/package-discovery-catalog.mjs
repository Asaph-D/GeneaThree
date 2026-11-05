import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceRoot = path.join(root, 'tmp-saints-genealogy', 'catalogue');
const output = path.join(root, 'api', 'geneatree', 'src', 'main', 'resources', 'discovery', 'popular-trees.json');
const catalog = JSON.parse(await fs.readFile(path.join(sourceRoot, 'catalog.json'), 'utf8'));
const entries = [];

for (const item of catalog.entries.filter((entry) => entry.kind === 'saint')) {
  const metadataPath = path.join(sourceRoot, item.metadata);
  const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
  const tree = JSON.parse(await fs.readFile(path.join(path.dirname(metadataPath), metadata.archive), 'utf8'));
  const focus = tree.persons.find((person) => person.id === tree.view.focusPersonId) ?? tree.persons[0];
  entries.push({
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    aliases: item.aliases,
    imageUrl: focus?.photoUrl ?? null,
    personCount: tree.persons.length,
    generations: tree.view.generations,
    featured: ['vierge-marie', 'saint-joseph', 'saint-pierre', 'saint-paul', 'saint-francois-assise', 'sainte-therese-lisieux', 'saint-jean-paul-ii', 'saint-louis-ix', 'sainte-elisabeth-de-hongrie', 'sainte-marguerite-ecosse'].includes(item.id),
    tree: { version: tree.version, persons: tree.persons, marriages: tree.marriages, view: tree.view },
  });
}

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, `${JSON.stringify({ version: 1, categories: catalog.categories, entries }, null, 2)}\n`, 'utf8');
console.log(`Catalogue backend créé : ${entries.length} arbres, ${await fs.stat(output).then((value) => value.size)} octets.`);
