import { Marriage, Person } from '../types/family';
import { loadLocalFamily, saveLocalFamily } from './localFamilyService';
import { API_BASE_URL } from '../config/api';

const API_BASE = API_BASE_URL;

/**
 * Interrupteur lu dans GeneaTree/.env
 * Le service local est le choix sûr par défaut pour la démonstration.
 * Seule la valeur explicite `false` active la synchronisation backend.
 */
export function usesLocalFamilyService(): boolean {
  return import.meta.env.VITE_USE_LOCAL_FAMILY_SERVICE !== 'false';
}

export async function loadFamily(): Promise<{ persons: Person[]; marriages: Marriage[] }> {
  if (usesLocalFamilyService()) {
    return loadLocalFamily();
  }

  try {
    const response = await fetch(`${API_BASE}/family`);
    if (!response.ok) throw new Error('server unavailable');
    const snapshot = await response.json() as { persons?: unknown[]; marriages?: unknown[] };
    return {
      persons: (snapshot.persons ?? []).map(normalizePerson),
      marriages: (snapshot.marriages ?? []).map(normalizeMarriage),
    };
  } catch {
    return loadLocalFamily();
  }
}

export async function clearFamily(): Promise<void> {
  if (usesLocalFamilyService()) {
    saveLocalFamily([], []);
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/family`, { method: 'DELETE' });
    if (!res.ok) throw new Error('server unavailable');
  } catch {
    saveLocalFamily([], []);
  }
}

export async function saveFamily(persons: Person[], marriages: Marriage[]): Promise<void> {
  if (usesLocalFamilyService()) {
    saveLocalFamily(persons, marriages);
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/family`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: 1,
        persons: persons.map((person) => ({
          ...person,
          birthPlace: placeToString(person.birthPlace),
          deathPlace: placeToString(person.deathPlace),
        })),
        marriages: marriages.map((marriage) => ({
          ...marriage,
          location: placeToString(marriage.location),
        })),
      }),
    });
    if (!response.ok) throw new Error('server unavailable');
  } catch {
    saveLocalFamily(persons, marriages);
  }
}

function placeToString(place?: Person['birthPlace'] | string): string {
  if (!place) return '';
  if (typeof place === 'string') return place;
  return [place.city, place.region, place.country].filter(Boolean).join(', ');
}

function asPlace(value: unknown): Person['birthPlace'] {
  if (value && typeof value === 'object') {
    const place = value as Partial<Person['birthPlace']>;
    return {
      city: place.city ?? '',
      region: place.region ?? '',
      country: place.country ?? '',
    };
  }
  return { city: typeof value === 'string' ? value : '', region: '', country: '' };
}

function normalizePerson(raw: unknown): Person {
  const person = (raw ?? {}) as Partial<Person> & { birthPlace?: unknown; deathPlace?: unknown };
  return {
    id: String(person.id ?? crypto.randomUUID()),
    firstName: person.firstName ?? '',
    lastName: person.lastName ?? '',
    birthDate: person.birthDate ?? '',
    birthPlace: asPlace(person.birthPlace),
    deathDate: person.deathDate,
    deathPlace: person.deathPlace ? asPlace(person.deathPlace) : undefined,
    gender: person.gender ?? 'unknown',
    occupation: person.occupation,
    deceased: Boolean(person.deceased),
    photoUrl: person.photoUrl,
    biography: person.biography,
    notes: person.notes,
    contact: person.contact,
    parentIds: person.parentIds ?? [],
    childrenIds: person.childrenIds ?? [],
    spouseIds: person.spouseIds ?? [],
    siblingIds: person.siblingIds ?? [],
    eventIds: person.eventIds ?? [],
  };
}

function normalizeMarriage(raw: unknown): Marriage {
  const marriage = (raw ?? {}) as Partial<Marriage> & { location?: unknown };
  return {
    id: String(marriage.id ?? crypto.randomUUID()),
    spouse1Id: marriage.spouse1Id ?? '',
    spouse2Id: marriage.spouse2Id ?? '',
    marriageDate: marriage.marriageDate,
    divorceDate: marriage.divorceDate,
    location: marriage.location ? asPlace(marriage.location) : undefined,
    childrenIds: marriage.childrenIds ?? [],
    eventId: marriage.eventId,
    rank: marriage.rank,
  };
}
