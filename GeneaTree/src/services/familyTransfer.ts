import { Marriage, Person, TreeViewOptions } from '../types/family';

export const FAMILY_ARCHIVE_VERSION = 1;

export interface FamilyArchive {
  format: 'geneatree-family';
  version: number;
  exportedAt: string;
  persons: Person[];
  marriages: Marriage[];
  view: TreeViewOptions;
}

export function createFamilyArchive(persons: Person[], marriages: Marriage[], view: TreeViewOptions): FamilyArchive {
  return {
    format: 'geneatree-family',
    version: FAMILY_ARCHIVE_VERSION,
    exportedAt: new Date().toISOString(),
    persons,
    marriages,
    view,
  };
}

export function serializeFamilyArchive(persons: Person[], marriages: Marriage[], view: TreeViewOptions) {
  return JSON.stringify(createFamilyArchive(persons, marriages, view), null, 2);
}

export function parseFamilyArchive(source: string): FamilyArchive {
  const value: unknown = JSON.parse(source);
  if (!isRecord(value) || value.format !== 'geneatree-family' || value.version !== FAMILY_ARCHIVE_VERSION) {
    throw new Error('Ce fichier n’est pas une archive GeneaTreePro compatible.');
  }
  if (!Array.isArray(value.persons) || !Array.isArray(value.marriages) || !isRecord(value.view)) {
    throw new Error('L’archive est incomplète.');
  }
  const persons = value.persons as Person[];
  const marriages = value.marriages as Marriage[];
  const ids = new Set<string>();
  persons.forEach((person) => {
    if (!isRecord(person) || typeof person.id !== 'string' || !person.id || ids.has(person.id)) {
      throw new Error('Une personne possède un identifiant absent ou dupliqué.');
    }
    if (typeof person.firstName !== 'string' || typeof person.lastName !== 'string' || !validGender(person.gender)) {
      throw new Error(`Les informations de la personne ${person.id} sont invalides.`);
    }
    ['parentIds', 'childrenIds', 'spouseIds'].forEach((key) => {
      if (!Array.isArray(person[key]) || !person[key].every((id) => typeof id === 'string')) {
        throw new Error(`Les relations de la personne ${person.id} sont invalides.`);
      }
    });
    ids.add(person.id);
  });
  persons.forEach((person) => {
    [...person.parentIds, ...person.childrenIds, ...person.spouseIds, ...(person.siblingIds ?? [])].forEach((id) => {
      if (!ids.has(id)) throw new Error(`La relation ${person.id} → ${id} pointe vers une personne absente.`);
    });
  });
  const marriageIds = new Set<string>();
  marriages.forEach((marriage) => {
    if (!isRecord(marriage) || typeof marriage.id !== 'string' || marriageIds.has(marriage.id)) {
      throw new Error('Une union possède un identifiant absent ou dupliqué.');
    }
    if (!ids.has(marriage.spouse1Id) || !ids.has(marriage.spouse2Id) || !(marriage.childrenIds ?? []).every((id) => ids.has(id))) {
      throw new Error(`L’union ${marriage.id} contient une personne absente.`);
    }
    marriageIds.add(marriage.id);
  });
  const view = value.view as unknown as TreeViewOptions;
  if (!['tree', 'radial', 'vertical', 'timeline'].includes(view.viewType) || !Number.isInteger(view.generations) || view.generations < 1 || view.generations > 7) {
    throw new Error('Les paramètres de vue sont invalides.');
  }
  const focusPersonId = ids.has(view.focusPersonId) ? view.focusPersonId : persons[0]?.id ?? '';
  return { ...(value as unknown as FamilyArchive), persons, marriages, view: { ...view, focusPersonId } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function validGender(value: unknown): value is Person['gender'] {
  return value === 'male' || value === 'female' || value === 'unknown';
}
