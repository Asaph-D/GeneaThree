import { Person } from '../../types/family';

export function descendantIds(personId: string, people: Person[]) {
  const byId = new Map(people.map((person) => [person.id, person]));
  const found = new Set<string>();
  const queue = [...(byId.get(personId)?.childrenIds ?? [])];
  while (queue.length) {
    const id = queue.shift()!;
    if (found.has(id)) continue;
    found.add(id);
    queue.push(...(byId.get(id)?.childrenIds ?? []));
  }
  return [...found];
}

export function orphanedDirectChildren(personId: string, people: Person[]) {
  return people.filter((person) => person.parentIds.includes(personId) && person.parentIds.every((id) => id === personId));
}

export function isolatedAfterDeletion(personId: string, people: Person[]) {
  const remainingIds = new Set(people.filter((person) => person.id !== personId).map((person) => person.id));
  return people.filter((person) => {
    if (person.id === personId) return false;
    const relations = [...person.parentIds, ...person.childrenIds, ...person.spouseIds, ...(person.siblingIds ?? [])];
    return relations.every((id) => id === personId || !remainingIds.has(id));
  });
}
