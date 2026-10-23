import { Marriage, Person } from '../types/family';
import { loadLocalFamily, saveLocalFamily } from './localFamilyService';
import { API_BASE_URL } from '../config/api';

const API_BASE = API_BASE_URL;

/**
 * Interrupteur lu dans GeneaTree/.env
 * VITE_USE_LOCAL_FAMILY_SERVICE=true  → service local
 * toute autre valeur, ou variable absente → tentative de jointure du backend
 */
export function usesLocalFamilyService(): boolean {
  return import.meta.env.VITE_USE_LOCAL_FAMILY_SERVICE === 'true';
}

export async function loadFamily(): Promise<{ persons: Person[]; marriages: Marriage[] }> {
  if (usesLocalFamilyService()) {
    return loadLocalFamily();
  }

  const [peopleRes, marriagesRes] = await Promise.all([
    fetch(`${API_BASE}/people`),
    fetch(`${API_BASE}/marriages`),
  ]);

  if (!peopleRes.ok || !marriagesRes.ok) {
    throw new Error('Le serveur généalogique ne répond pas.');
  }

  const people = (await peopleRes.json()) as unknown[];
  const marriages = (await marriagesRes.json()) as unknown[];
  return {
    persons: people.map(normalizePerson),
    marriages: marriages.map(normalizeMarriage),
  };
}

export async function clearFamily(): Promise<void> {
  if (usesLocalFamilyService()) {
    saveLocalFamily([], []);
    return;
  }
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  if (!res.ok) {
    throw new Error('Le serveur n’a pas pu réinitialiser le lignage.');
  }
}

export async function saveFamily(persons: Person[], marriages: Marriage[]): Promise<void> {
  if (usesLocalFamilyService()) {
    saveLocalFamily(persons, marriages);
    return;
  }

  for (const person of persons) {
    const res = await fetch(`${API_BASE}/people`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...person,
        birthPlace: placeToString(person.birthPlace),
        deathPlace: placeToString(person.deathPlace),
      }),
    });
    if (!res.ok) {
      throw new Error(`Le serveur a refusé l'enregistrement de ${person.firstName || 'une personne'}.`);
    }
  }

  for (const marriage of marriages) {
    const res = await fetch(`${API_BASE}/marriages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...marriage,
        location: placeToString(marriage.location),
      }),
    });
    if (!res.ok) {
      throw new Error("Le serveur a refusé l'enregistrement d'une union.");
    }
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
