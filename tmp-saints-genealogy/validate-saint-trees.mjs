import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1'));
const entries = await fs.readdir(root, { withFileTypes: true });
const reports = [];

for (const entry of entries.filter((candidate) => candidate.isDirectory())) {
  const directory = path.join(root, entry.name);
  const archiveName = (await fs.readdir(directory)).find((name) => name.endsWith('.geneatree.json'));
  if (!archiveName) throw new Error(`${entry.name}: archive GeneaTreePro absente`);
  const archive = JSON.parse(await fs.readFile(path.join(directory, archiveName), 'utf8'));
  if (archive.format !== 'geneatree-family' || archive.version !== 1) throw new Error(`${entry.name}: format invalide`);
  if (!Array.isArray(archive.persons) || archive.persons.length < 2) throw new Error(`${entry.name}: généalogie vide`);

  const ids = new Set(archive.persons.map((person) => person.id));
  if (ids.size !== archive.persons.length) throw new Error(`${entry.name}: identifiants dupliqués`);
  if (!ids.has(archive.view?.focusPersonId)) throw new Error(`${entry.name}: personne focale absente`);

  for (const person of archive.persons) {
    for (const relationId of [...person.parentIds, ...person.childrenIds, ...person.spouseIds, ...person.siblingIds]) {
      if (!ids.has(relationId)) throw new Error(`${entry.name}: relation orpheline ${relationId}`);
    }
    if (person.photoUrl && !person.photoUrl.startsWith('https://commons.wikimedia.org/')) throw new Error(`${entry.name}: portrait non autorisé`);
  }
  for (const union of archive.marriages) {
    for (const relationId of [union.spouse1Id, union.spouse2Id, ...union.childrenIds]) {
      if (!ids.has(relationId)) throw new Error(`${entry.name}: union orpheline ${relationId}`);
    }
  }

  const depths = new Map([[archive.view.focusPersonId, 0]]);
  const queue = [archive.view.focusPersonId];
  while (queue.length) {
    const id = queue.shift();
    const person = archive.persons.find((candidate) => candidate.id === id);
    for (const parentId of person.parentIds) if (!depths.has(parentId)) {
      depths.set(parentId, depths.get(id) + 1);
      queue.push(parentId);
    }
  }
  reports.push({ archive: archiveName, persons: archive.persons.length, generations: Math.max(...depths.values()) + 1, portraits: archive.persons.filter((person) => person.photoUrl).length, unions: archive.marriages.length });
}

console.table(reports);
