import { Marriage, Person } from '../types/family';

const SNAPSHOT_KEY = 'geneatree.family.snapshot';

export interface FamilySnapshot {
  persons: Person[];
  marriages: Marriage[];
}

export function loadLocalFamily(): FamilySnapshot {
  if (typeof localStorage === 'undefined') {
    return { persons: [], marriages: [] };
  }
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return { persons: [], marriages: [] };
    const parsed = JSON.parse(raw) as FamilySnapshot;
    return {
      persons: Array.isArray(parsed.persons) ? parsed.persons : [],
      marriages: Array.isArray(parsed.marriages) ? parsed.marriages : [],
    };
  } catch {
    return { persons: [], marriages: [] };
  }
}

export function saveLocalFamily(persons: Person[], marriages: Marriage[]): void {
  const snapshot: FamilySnapshot = { persons, marriages };
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
}
