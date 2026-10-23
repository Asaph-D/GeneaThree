import { GenderType, Marriage, Person } from '../types/family';

export type OriginKind = 'self' | 'founder';
export type StepId = 'origin' | 'households' | 'branches' | 'review';

export interface DraftPerson {
  id: string;
  firstName: string;
  lastName: string;
  gender: GenderType;
  birthDate: string;
  city: string;
  region: string;
  country: string;
  occupation: string;
  deceased: boolean;
}

export interface DraftHousehold {
  id: string;
  anchorId: string;
  spouseId: string | null;
  rank: number;
  childIds: string[];
}

export interface CreationDraft {
  version: 1;
  origin: OriginKind | null;
  anchorId: string | null;
  people: Record<string, DraftPerson>;
  households: DraftHousehold[];
  step: StepId;
  updatedAt: string;
}

export type CreationAction =
  | { type: 'set-origin'; origin: OriginKind }
  | { type: 'update-person'; id: string; patch: Partial<DraftPerson> }
  | { type: 'add-household'; anchorId: string; spouse: Partial<DraftPerson>; rank: number }
  | { type: 'set-rank'; householdId: string; rank: number }
  | { type: 'remove-household'; householdId: string }
  | { type: 'add-child'; householdId: string; child: Partial<DraftPerson> }
  | { type: 'remove-child'; householdId: string; personId: string }
  | {
      type: 'attach-origin';
      personId: string;
      anchor: Partial<DraftPerson>;
      spouse: Partial<DraftPerson> | null;
      rank: number;
    }
  | { type: 'remove-person'; personId: string }
  | { type: 'set-step'; step: StepId }
  | { type: 'reset' };

export const DRAFT_STORAGE_KEY = 'geneatree.creation.draft';

export const STEPS: { id: StepId; index: string; title: string; hint: string }[] = [
  { id: 'origin', index: '01', title: 'Origine', hint: 'Qui ouvre le lignage' },
  { id: 'households', index: '02', title: 'Foyers', hint: 'Unions et enfants' },
  { id: 'branches', index: '03', title: 'Branches', hint: 'Étendre une personne' },
  { id: 'review', index: '04', title: 'Lecture', hint: 'Vérifier et enregistrer' },
];

export function freshDraft(): CreationDraft {
  return {
    version: 1,
    origin: null,
    anchorId: null,
    people: {},
    households: [],
    step: 'origin',
    updatedAt: new Date().toISOString(),
  };
}

export function blankPerson(partial: Partial<DraftPerson> = {}): DraftPerson {
  return {
    id: crypto.randomUUID(),
    firstName: '',
    lastName: '',
    gender: 'unknown',
    birthDate: '',
    city: '',
    region: '',
    country: '',
    occupation: '',
    deceased: false,
    ...partial,
  };
}

export function loadDraft(): CreationDraft {
  if (typeof localStorage === 'undefined') return freshDraft();
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return freshDraft();
    const parsed = JSON.parse(raw) as CreationDraft;
    if (!parsed || parsed.version !== 1 || !parsed.people) return freshDraft();
    return parsed;
  } catch {
    return freshDraft();
  }
}

export function personName(person?: DraftPerson | null): string {
  if (!person) return 'Personne inconnue';
  const name = `${person.firstName} ${person.lastName}`.trim();
  return name || 'Sans nom';
}

export function formatRank(rank: number): string {
  if (rank === 1) return '1re union';
  return `${rank}e union`;
}

export function nextRank(households: DraftHousehold[], anchorId: string): number {
  const ranks = households.filter((h) => h.anchorId === anchorId).map((h) => h.rank);
  if (ranks.length === 0) return 1;
  return Math.max(...ranks) + 1;
}

export function anchorReady(draft: CreationDraft): boolean {
  if (!draft.anchorId) return false;
  return Boolean(draft.people[draft.anchorId]?.firstName.trim());
}

export function canOpenStep(step: StepId, draft: CreationDraft): boolean {
  if (step === 'origin') return true;
  return anchorReady(draft);
}

export function householdsOf(draft: CreationDraft, anchorId: string): DraftHousehold[] {
  return draft.households
    .filter((h) => h.anchorId === anchorId)
    .slice()
    .sort((a, b) => a.rank - b.rank);
}

export function originHousehold(draft: CreationDraft, personId: string): DraftHousehold | undefined {
  return draft.households.find((h) => h.childIds.includes(personId));
}

export function personSummary(draft: CreationDraft, personId: string): string {
  const parts: string[] = [];
  if (personId === draft.anchorId) {
    parts.push(draft.origin === 'founder' ? 'Fondateur' : 'Point de départ');
  }
  const anchored = householdsOf(draft, personId);
  if (anchored.length > 0) {
    parts.push(`${anchored.length} foyer${anchored.length > 1 ? 's' : ''}`);
  }
  const asSpouse = draft.households.filter((h) => h.spouseId === personId);
  if (asSpouse.length > 0) {
    parts.push(asSpouse.map((h) => formatRank(h.rank)).join(', '));
  }
  const origin = originHousehold(draft, personId);
  if (origin) {
    const anchor = draft.people[origin.anchorId];
    const spouse = origin.spouseId ? draft.people[origin.spouseId] : null;
    parts.push(
      spouse
        ? `enfant de ${personName(anchor)} et ${personName(spouse)}`
        : `enfant de ${personName(anchor)}`
    );
  }
  return parts.join(' · ') || 'Non rattaché';
}

export function generationMap(draft: CreationDraft): Map<string, number> {
  const memo = new Map<string, number>();
  const visiting = new Set<string>();

  const gen = (id: string): number => {
    const known = memo.get(id);
    if (known !== undefined) return known;
    if (visiting.has(id)) return 0;
    visiting.add(id);

    const origins = draft.households.filter((h) => h.childIds.includes(id));
    let value = 0;
    if (origins.length > 0) {
      const parentGens = origins.flatMap((h) => {
        const ids = [h.anchorId, h.spouseId].filter((x): x is string => Boolean(x));
        return ids.map(gen);
      });
      value = Math.max(...parentGens) + 1;
    } else {
      const asSpouse = draft.households.find((h) => h.spouseId === id);
      value = asSpouse ? gen(asSpouse.anchorId) : 0;
    }

    visiting.delete(id);
    memo.set(id, value);
    return value;
  };

  Object.keys(draft.people).forEach(gen);
  return memo;
}

function touch(draft: CreationDraft): CreationDraft {
  return { ...draft, updatedAt: new Date().toISOString() };
}

export function creationReducer(state: CreationDraft, action: CreationAction): CreationDraft {
  switch (action.type) {
    case 'set-origin': {
      if (state.anchorId && state.people[state.anchorId]) {
        return touch({ ...state, origin: action.origin });
      }
      const person = blankPerson();
      return touch({
        ...state,
        origin: action.origin,
        anchorId: person.id,
        people: { ...state.people, [person.id]: person },
      });
    }
    case 'update-person': {
      const current = state.people[action.id];
      if (!current) return state;
      return touch({
        ...state,
        people: {
          ...state.people,
          [action.id]: { ...current, ...action.patch, id: current.id },
        },
      });
    }
    case 'add-household': {
      if (!state.people[action.anchorId]) return state;
      if (!action.spouse.firstName?.trim()) return state;
      const spouse = blankPerson(action.spouse);
      const rank = action.rank < 1 ? 1 : action.rank;
      const conflict = state.households.find((h) => h.anchorId === action.anchorId && h.rank === rank);
      const household: DraftHousehold = {
        id: crypto.randomUUID(),
        anchorId: action.anchorId,
        spouseId: spouse.id,
        rank,
        childIds: [],
      };
      const households = state.households.map((h) => {
        if (conflict && h.id === conflict.id) {
          return { ...h, rank: nextRank(state.households, action.anchorId) };
        }
        return h;
      });
      return touch({
        ...state,
        people: { ...state.people, [spouse.id]: spouse },
        households: [...households, household],
      });
    }
    case 'set-rank': {
      const current = state.households.find((h) => h.id === action.householdId);
      if (!current || action.rank < 1) return state;
      const other = state.households.find(
        (h) => h.anchorId === current.anchorId && h.rank === action.rank && h.id !== current.id
      );
      return touch({
        ...state,
        households: state.households.map((h) => {
          if (h.id === current.id) return { ...h, rank: action.rank };
          if (other && h.id === other.id) return { ...h, rank: current.rank };
          return h;
        }),
      });
    }
    case 'remove-household':
      return touch({
        ...state,
        households: state.households.filter((h) => h.id !== action.householdId),
      });
    case 'add-child': {
      const household = state.households.find((h) => h.id === action.householdId);
      if (!household || !action.child.firstName?.trim()) return state;
      const child = blankPerson(action.child);
      return touch({
        ...state,
        people: { ...state.people, [child.id]: child },
        households: state.households.map((h) =>
          h.id === household.id ? { ...h, childIds: [...h.childIds, child.id] } : h
        ),
      });
    }
    case 'remove-child':
      return touch({
        ...state,
        households: state.households.map((h) =>
          h.id === action.householdId
            ? { ...h, childIds: h.childIds.filter((id) => id !== action.personId) }
            : h
        ),
      });
    case 'attach-origin': {
      if (!state.people[action.personId]) return state;
      if (originHousehold(state, action.personId)) return state;
      if (!action.anchor.firstName?.trim()) return state;
      const anchor = blankPerson(action.anchor);
      const spouse = action.spouse?.firstName?.trim() ? blankPerson(action.spouse) : null;
      const people = { ...state.people, [anchor.id]: anchor };
      if (spouse) people[spouse.id] = spouse;
      const household: DraftHousehold = {
        id: crypto.randomUUID(),
        anchorId: anchor.id,
        spouseId: spouse?.id ?? null,
        rank: action.rank < 1 ? 1 : action.rank,
        childIds: [action.personId],
      };
      return touch({ ...state, people, households: [...state.households, household] });
    }
    case 'remove-person': {
      if (action.personId === state.anchorId) return state;
      const people = { ...state.people };
      delete people[action.personId];
      const households = state.households
        .filter((h) => h.anchorId !== action.personId)
        .map((h) => ({
          ...h,
          spouseId: h.spouseId === action.personId ? null : h.spouseId,
          childIds: h.childIds.filter((id) => id !== action.personId),
        }));
      return touch({ ...state, people, households });
    }
    case 'set-step':
      if (!canOpenStep(action.step, state)) return state;
      return touch({ ...state, step: action.step });
    case 'reset':
      return freshDraft();
    default:
      return state;
  }
}

function addUnique(list: string[], id: string) {
  if (!list.includes(id)) list.push(id);
}

export function draftToSnapshot(draft: CreationDraft): { persons: Person[]; marriages: Marriage[] } {
  const parentIds: Record<string, string[]> = {};
  const childrenIds: Record<string, string[]> = {};
  const spouseIds: Record<string, string[]> = {};
  const siblingIds: Record<string, string[]> = {};

  const ensure = (id: string) => {
    parentIds[id] ??= [];
    childrenIds[id] ??= [];
    spouseIds[id] ??= [];
    siblingIds[id] ??= [];
  };

  Object.keys(draft.people).forEach(ensure);

  const marriages: Marriage[] = [];

  for (const household of draft.households) {
    ensure(household.anchorId);
    if (household.spouseId && draft.people[household.spouseId]) {
      ensure(household.spouseId);
      addUnique(spouseIds[household.anchorId], household.spouseId);
      addUnique(spouseIds[household.spouseId], household.anchorId);
      marriages.push({
        id: household.id,
        spouse1Id: household.anchorId,
        spouse2Id: household.spouseId,
        childrenIds: [...household.childIds],
        rank: household.rank,
        location: { city: '', region: '', country: '' },
      });
    }

    const parents = [household.anchorId, household.spouseId].filter(
      (id): id is string => Boolean(id && draft.people[id])
    );

    for (const childId of household.childIds) {
      if (!draft.people[childId]) continue;
      ensure(childId);
      for (const parentId of parents) {
        addUnique(parentIds[childId], parentId);
        addUnique(childrenIds[parentId], childId);
      }
      for (const siblingId of household.childIds) {
        if (siblingId !== childId && draft.people[siblingId]) {
          addUnique(siblingIds[childId], siblingId);
        }
      }
    }
  }

  const persons: Person[] = Object.values(draft.people).map((person) => ({
    id: person.id,
    firstName: person.firstName.trim(),
    lastName: person.lastName.trim(),
    birthDate: person.birthDate,
    birthPlace: { city: person.city, region: person.region, country: person.country },
    gender: person.gender,
    occupation: person.occupation,
    deceased: person.deceased,
    parentIds: parentIds[person.id] ?? [],
    childrenIds: childrenIds[person.id] ?? [],
    spouseIds: spouseIds[person.id] ?? [],
    siblingIds: siblingIds[person.id] ?? [],
  }));

  return { persons, marriages };
}
