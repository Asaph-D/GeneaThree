import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Mic, RotateCcw, Send, SkipForward, Undo2 } from 'lucide-react';
import TreeVisualization from '../components/demo/TreeVisualization';
import { saveFamily } from '../services/familyGateway';
import { GenderType, Location, Marriage, Person } from '../types/family';

type Phase =
  | 'anchor-first' | 'anchor-last' | 'anchor-gender' | 'anchor-birth' | 'anchor-city'
  | 'spouse-ask' | 'spouse-first' | 'spouse-last' | 'spouse-gender' | 'spouse-more'
  | 'child-ask' | 'child-union' | 'child-first' | 'child-last' | 'child-gender' | 'child-more'
  | 'parent-ask' | 'parent-first' | 'parent-last' | 'parent-gender' | 'parent-second'
  | 'parent2-first' | 'parent2-last' | 'parent2-gender'
  | 'grow' | 'kin-side' | 'kin-link-role' | 'kin-link' | 'kin-link-last' | 'kin-pick' | 'kin-union' | 'kin-first' | 'kin-last' | 'kin-gender';

type KinKind =
  | 'brother' | 'sister'
  | 'grandfather' | 'grandmother'
  | 'uncle' | 'aunt'
  | 'cousin' | 'cousine'
  | 'collateral-spouse'
  | 'node-spouse'
  | 'node-child';

interface Bits {
  id: string;
  firstName: string;
  lastName: string;
  gender: GenderType;
  birthDate: string;
  city: string;
  deceased: boolean;
}

interface Collateral {
  person: Bits;
  spouses: (Bits & { rank: number })[];
}

interface Branch {
  parentId: string;
  grandfather?: Bits;
  grandmother?: Bits;
  collaterals: Collateral[];
  cousins: Array<Bits & { collateralId: string; unionSpouseId: string | null }>;
}

interface AttachedSpouse {
  hostId: string;
  spouse: Bits & { rank: number };
}

interface AttachedChild {
  parentIds: string[];
  child: Bits;
}

interface Draft {
  anchor: Bits;
  spouses: (Bits & { rank: number })[];
  children: (Bits & { unionSpouseId: string | null })[];
  parents: Bits[];
  siblings: Bits[];
  branches: Branch[];
  extraSpouses: AttachedSpouse[];
  extraChildren: AttachedChild[];
}

interface Pending {
  firstName: string;
  lastName: string;
  gender: GenderType;
  unionSpouseId: string | null;
  kin: KinKind | null;
  viaParentId: string | null;
  viaUncleId: string | null;
  hostId: string | null;
  linkAs: 'male' | 'female' | null;
  queue: KinKind | null;
}

interface SpeechRec {
  lang: string;
  start: () => void;
  onresult: ((event: { results: { 0?: { 0?: { transcript: string } } } }) => void) | null;
}

const blankPlace: Location = { city: '', region: '', country: '' };
const genders: { value: GenderType; label: string }[] = [
  { value: 'female', label: 'Femme' },
  { value: 'male', label: 'Homme' },
  { value: 'unknown', label: 'Non précisé' },
];

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function emptyBits(id: string): Bits {
  return { id, firstName: '', lastName: '', gender: 'unknown', birthDate: '', city: '', deceased: false };
}

function freshPending(): Pending {
  return {
    firstName: '',
    lastName: '',
    gender: 'unknown',
    unionSpouseId: null,
    kin: null,
    viaParentId: null,
    viaUncleId: null,
    hostId: null,
    linkAs: null,
    queue: null,
  };
}

function impliedGender(kin: KinKind): GenderType {
  if (kin === 'sister' || kin === 'grandmother' || kin === 'aunt' || kin === 'cousine') return 'female';
  if (kin === 'brother' || kin === 'grandfather' || kin === 'uncle' || kin === 'cousin') return 'male';
  return 'unknown';
}

function fullName(bits: { firstName: string; lastName: string }) {
  return `${bits.firstName} ${bits.lastName}`.trim();
}

function uniq(ids: string[]) {
  return [...new Set(ids)];
}

function surnameChip(candidates: Bits[]) {
  const male = candidates.find((person) => person.gender === 'male' && person.lastName.trim());
  const chosen = male ?? candidates.find((person) => person.lastName.trim());
  return chosen ? [{ label: chosen.lastName, value: chosen.lastName }] : [];
}

function toPerson(bits: Bits, links: Pick<Person, 'parentIds' | 'childrenIds' | 'spouseIds' | 'siblingIds'>): Person {
  return {
    ...bits,
    birthPlace: { ...blankPlace, city: bits.city },
    deathDate: '',
    deathPlace: blankPlace,
    occupation: '',
    photoUrl: '',
    biography: '',
    notes: '',
    contact: {},
    eventIds: [],
    ...links,
  };
}

function emptyBranch(parentId: string): Branch {
  return { parentId, collaterals: [], cousins: [] };
}

function branchOf(draft: Draft, parentId: string) {
  return draft.branches.find((branch) => branch.parentId === parentId);
}

function findCollateral(draft: Draft, id: string) {
  for (const branch of draft.branches) {
    const collateral = branch.collaterals.find((item) => item.person.id === id);
    if (collateral) return { branch, collateral };
  }
  return null;
}

function hostSpouses(draft: Draft, hostId: string): (Bits & { rank: number })[] {
  if (hostId === draft.anchor.id) return draft.spouses;
  const collateral = findCollateral(draft, hostId);
  if (collateral) return collateral.collateral.spouses;
  const extras = draft.extraSpouses.filter((item) => item.hostId === hostId).map((item) => item.spouse);
  const partner = draft.parents.find((parent) => parent.id !== hostId && draft.parents.some((item) => item.id === hostId));
  return partner ? [{ ...partner, rank: 1 }, ...extras] : extras;
}

function buildFamily(draft: Draft): { persons: Person[]; marriages: Marriage[] } {
  if (!draft.anchor.firstName.trim()) return { persons: [], marriages: [] };
  const marriages: Marriage[] = [];
  const people = new Map<string, Person>();

  const ensure = (bits: Bits, links: Pick<Person, 'parentIds' | 'childrenIds' | 'spouseIds' | 'siblingIds'>) => {
    const found = people.get(bits.id);
    if (!found) {
      people.set(bits.id, toPerson(bits, {
        parentIds: uniq(links.parentIds ?? []),
        childrenIds: uniq(links.childrenIds ?? []),
        spouseIds: uniq(links.spouseIds ?? []),
        siblingIds: uniq(links.siblingIds ?? []),
      }));
      return;
    }
    found.parentIds = uniq([...(found.parentIds ?? []), ...(links.parentIds ?? [])]);
    found.childrenIds = uniq([...(found.childrenIds ?? []), ...(links.childrenIds ?? [])]);
    found.spouseIds = uniq([...(found.spouseIds ?? []), ...(links.spouseIds ?? [])]);
    found.siblingIds = uniq([...(found.siblingIds ?? []), ...(links.siblingIds ?? [])]);
  };

  const addMarriage = (spouse1Id: string, spouse2Id: string, rank: number, childrenIds: string[]) => {
    marriages.push({
      id: `union-${spouse1Id}-${spouse2Id}`,
      spouse1Id,
      spouse2Id,
      rank,
      childrenIds: uniq(childrenIds),
      marriageDate: '',
      location: blankPlace,
    });
  };

  const siblingIds = draft.siblings.map((sibling) => sibling.id);
  const anchorParents = orderedParents(draft);
  const anchorParentIds = anchorParents.map((parent) => parent.id);

  ensure(draft.anchor, {
    parentIds: anchorParentIds,
    childrenIds: draft.children.map((child) => child.id),
    spouseIds: draft.spouses.map((spouse) => spouse.id),
    siblingIds,
  });

  draft.spouses.forEach((spouse) => {
    const kids = draft.children.filter((child) => child.unionSpouseId === spouse.id).map((child) => child.id);
    ensure(spouse, { parentIds: [], childrenIds: kids, spouseIds: [draft.anchor.id], siblingIds: [] });
    addMarriage(draft.anchor.id, spouse.id, spouse.rank, kids);
  });

  draft.children.forEach((child) => {
    const siblings = draft.children
      .filter((other) => other.id !== child.id && other.unionSpouseId === child.unionSpouseId)
      .map((other) => other.id);
    ensure(child, {
      parentIds: child.unionSpouseId ? [draft.anchor.id, child.unionSpouseId] : [draft.anchor.id],
      childrenIds: [],
      spouseIds: [],
      siblingIds: siblings,
    });
  });

  draft.siblings.forEach((sibling) => {
    ensure(sibling, {
      parentIds: anchorParentIds,
      childrenIds: [],
      spouseIds: draft.extraSpouses.filter((item) => item.hostId === sibling.id).map((item) => item.spouse.id),
      siblingIds: [draft.anchor.id, ...siblingIds.filter((id) => id !== sibling.id)],
    });
  });

  if (anchorParents.length === 2) {
    addMarriage(anchorParents[0].id, anchorParents[1].id, 1, [draft.anchor.id, ...siblingIds]);
  }

  anchorParents.forEach((parent) => {
    const branch = branchOf(draft, parent.id) ?? emptyBranch(parent.id);
    const grandparents = [branch.grandfather, branch.grandmother].filter((item): item is Bits => Boolean(item));
    const grandIds = grandparents.map((item) => item.id);
    const collateralIds = branch.collaterals.map((item) => item.person.id);
    const lineKids = [parent.id, ...collateralIds];
    const other = anchorParents.find((item) => item.id !== parent.id);
    const extra = draft.extraSpouses.filter((item) => item.hostId === parent.id).map((item) => item.spouse);

    ensure(parent, {
      parentIds: grandIds,
      childrenIds: [draft.anchor.id, ...siblingIds],
      spouseIds: [...(other ? [other.id] : []), ...extra.map((spouse) => spouse.id)],
      siblingIds: collateralIds,
    });

    if (branch.grandfather && branch.grandmother) {
      addMarriage(branch.grandfather.id, branch.grandmother.id, 1, lineKids);
    }
    grandparents.forEach((grand) => {
      const partners = grand.id === branch.grandfather?.id
        ? [branch.grandmother, ...draft.extraSpouses.filter((item) => item.hostId === grand.id).map((item) => item.spouse)].filter((item): item is Bits => Boolean(item))
        : [branch.grandfather, ...draft.extraSpouses.filter((item) => item.hostId === grand.id).map((item) => item.spouse)].filter((item): item is Bits => Boolean(item));
      ensure(grand, {
        parentIds: [],
        childrenIds: lineKids,
        spouseIds: partners.map((item) => item.id),
        siblingIds: [],
      });
    });

    let extraRank = branch.grandfather && branch.grandmother ? 2 : 1;
    draft.extraSpouses.filter((item) => item.hostId === branch.grandfather?.id || item.hostId === branch.grandmother?.id).forEach((item) => {
      if (!people.has(item.spouse.id)) {
        ensure(item.spouse, { parentIds: [], childrenIds: [], spouseIds: [item.hostId], siblingIds: [] });
        addMarriage(item.hostId, item.spouse.id, extraRank, []);
        extraRank += 1;
      }
    });

    branch.collaterals.forEach((collateral) => {
      const cousins = branch.cousins.filter((cousin) => cousin.collateralId === collateral.person.id);
      ensure(collateral.person, {
        parentIds: grandIds,
        childrenIds: cousins.map((cousin) => cousin.id),
        spouseIds: collateral.spouses.map((spouse) => spouse.id),
        siblingIds: [parent.id, ...collateralIds.filter((id) => id !== collateral.person.id)],
      });
      collateral.spouses.forEach((spouse) => {
        const kids = cousins.filter((cousin) => cousin.unionSpouseId === spouse.id).map((cousin) => cousin.id);
        ensure(spouse, { parentIds: [], childrenIds: kids, spouseIds: [collateral.person.id], siblingIds: [] });
        addMarriage(collateral.person.id, spouse.id, spouse.rank, kids);
      });
      cousins.forEach((cousin) => {
        const spouseId = cousin.unionSpouseId;
        ensure(cousin, {
          parentIds: spouseId ? [collateral.person.id, spouseId] : [collateral.person.id],
          childrenIds: [],
          spouseIds: draft.extraSpouses.filter((item) => item.hostId === cousin.id).map((item) => item.spouse.id),
          siblingIds: cousins.filter((item) => item.id !== cousin.id).map((item) => item.id),
        });
      });
    });

    extra.forEach((spouse, index) => {
      ensure(spouse, { parentIds: [], childrenIds: [], spouseIds: [parent.id], siblingIds: [] });
      addMarriage(parent.id, spouse.id, spouse.rank || index + 2, []);
    });
  });

  draft.extraSpouses.forEach((item) => {
    if (people.has(item.spouse.id)) return;
    const host = people.get(item.hostId);
    if (host) host.spouseIds = uniq([...host.spouseIds, item.spouse.id]);
    ensure(item.spouse, { parentIds: [], childrenIds: [], spouseIds: [item.hostId], siblingIds: [] });
    addMarriage(item.hostId, item.spouse.id, item.spouse.rank, []);
  });

  draft.extraChildren.forEach((item) => {
    ensure(item.child, { parentIds: item.parentIds, childrenIds: [], spouseIds: [], siblingIds: [] });
    item.parentIds.forEach((parentId) => {
      const parent = people.get(parentId);
      if (parent) parent.childrenIds = uniq([...parent.childrenIds, item.child.id]);
    });
    if (item.parentIds.length === 2) {
      const union = marriages.find((marriage) => item.parentIds.includes(marriage.spouse1Id) && item.parentIds.includes(marriage.spouse2Id));
      if (union) union.childrenIds = uniq([...(union.childrenIds ?? []), item.child.id]);
    }
  });

  return { persons: [...people.values()], marriages };
}

function orderedParents(draft: Draft): Bits[] {
  const linked = draft.parents.filter((parent) => {
    const branch = branchOf(draft, parent.id);
    return Boolean(branch && (branch.grandfather || branch.grandmother || branch.collaterals.length));
  });
  if (linked.length === 1) return [linked[0], ...draft.parents.filter((parent) => parent.id !== linked[0].id)];
  return draft.parents;
}

function withBranch(draft: Draft, parentId: string, update: (branch: Branch) => Branch): Draft {
  const current = branchOf(draft, parentId) ?? emptyBranch(parentId);
  const next = update(current);
  const branches = draft.branches.some((branch) => branch.parentId === parentId)
    ? draft.branches.map((branch) => (branch.parentId === parentId ? next : branch))
    : [...draft.branches, next];
  return { ...draft, branches };
}

function routeKin(kin: KinKind, draft: Draft, parentId: string): { phase: Phase; pendingPatch: Partial<Pending> } {
  const branch = branchOf(draft, parentId);
  if (kin === 'brother' || kin === 'sister' || kin === 'grandfather' || kin === 'grandmother') {
    return { phase: 'kin-first', pendingPatch: {} };
  }
  if (kin === 'uncle' || kin === 'aunt') {
    return { phase: branch?.grandfather || branch?.grandmother ? 'kin-first' : 'kin-link-role', pendingPatch: {} };
  }
  if (kin === 'cousin' || kin === 'cousine') return { phase: 'kin-pick', pendingPatch: {} };
  return { phase: 'grow', pendingPatch: {} };
}

function carryKin(pending: Pending, extra: Partial<Pending> = {}): Pending {
  return {
    ...freshPending(),
    kin: pending.kin,
    gender: pending.gender,
    queue: pending.queue,
    viaParentId: pending.viaParentId,
    viaUncleId: pending.viaUncleId,
    hostId: pending.hostId,
    linkAs: pending.linkAs,
    unionSpouseId: pending.unionSpouseId,
    ...extra,
  };
}

function afterParents(pending: Pending, draft: Draft): { phase: Phase; pending: Pending } {
  if (!pending.kin) return { phase: 'grow', pending: freshPending() };
  if (pending.kin === 'node-spouse' || pending.kin === 'node-child' || pending.kin === 'collateral-spouse') {
    return { phase: 'kin-pick', pending: carryKin(pending) };
  }
  if (pending.kin === 'brother' || pending.kin === 'sister') return { phase: 'kin-first', pending: carryKin(pending) };
  if (draft.parents.length <= 1) {
    const via = draft.parents[0]?.id ?? null;
    if (!via) return { phase: 'grow', pending: freshPending() };
    const route = routeKin(pending.kin, draft, via);
    return { phase: route.phase, pending: { ...carryKin(pending, route.pendingPatch), viaParentId: via } };
  }
  return { phase: 'kin-side', pending: carryKin(pending) };
}

function slotTaken(draft: Draft, parentId: string, kin: KinKind) {
  const branch = branchOf(draft, parentId);
  if (kin === 'grandfather') return branch?.grandfather;
  if (kin === 'grandmother') return branch?.grandmother;
  return undefined;
}

function peopleChoices(draft: Draft) {
  const items: { value: string; label: string }[] = [];
  const push = (bits?: Bits, hint = '') => {
    if (!bits?.firstName) return;
    items.push({ value: bits.id, label: hint ? `${fullName(bits)} · ${hint}` : fullName(bits) });
  };
  push(draft.anchor);
  draft.spouses.forEach((spouse) => push(spouse, 'conjoint'));
  draft.parents.forEach((parent) => push(parent, 'parent'));
  draft.siblings.forEach((sibling) => push(sibling));
  draft.children.forEach((child) => push(child));
  draft.branches.forEach((branch) => {
    push(branch.grandfather, 'grand-père');
    push(branch.grandmother, 'grand-mère');
    branch.collaterals.forEach((collateral) => {
      push(collateral.person, collateral.person.gender === 'female' ? 'tante' : 'oncle');
      collateral.spouses.forEach((spouse) => push(spouse, `conjoint de ${collateral.person.firstName}`));
    });
    branch.cousins.forEach((cousin) => push(cousin));
  });
  draft.extraSpouses.forEach((item) => push(item.spouse, 'conjoint'));
  return items;
}

function collateralChoices(draft: Draft) {
  return draft.branches.flatMap((branch) => {
    const parent = draft.parents.find((item) => item.id === branch.parentId);
    return branch.collaterals.map((collateral) => ({
      value: collateral.person.id,
      label: `${fullName(collateral.person)} · ${collateral.person.gender === 'female' ? 'tante' : 'oncle'} de ${parent?.firstName ?? ''}`.trim(),
    }));
  });
}

function kinSurnameChip(draft: Draft, pending: Pending) {
  if (pending.kin === 'brother' || pending.kin === 'sister') return surnameChip(draft.parents);
  if (pending.kin === 'uncle' || pending.kin === 'aunt') {
    const branch = pending.viaParentId ? branchOf(draft, pending.viaParentId) : undefined;
    return surnameChip([branch?.grandfather, branch?.grandmother].filter((item): item is Bits => Boolean(item)));
  }
  if (pending.kin === 'cousin' || pending.kin === 'cousine' || (pending.kin === 'node-child' && pending.viaUncleId)) {
    const found = pending.viaUncleId ? findCollateral(draft, pending.viaUncleId) : null;
    const spouse = found?.collateral.spouses.find((item) => item.id === pending.unionSpouseId);
    return surnameChip([found?.collateral.person, spouse].filter((item): item is Bits => Boolean(item)));
  }
  if (pending.kin === 'node-child' && pending.hostId) {
    const hostBits = hostPerson(draft, pending.hostId);
    const spouse = hostSpouses(draft, pending.hostId).find((item) => item.id === pending.unionSpouseId);
    return surnameChip([hostBits, spouse].filter((item): item is Bits => Boolean(item)));
  }
  return [];
}

function hostPerson(draft: Draft, id: string): Bits | undefined {
  if (draft.anchor.id === id) return draft.anchor;
  const pools: Bits[] = [
    ...draft.spouses,
    ...draft.parents,
    ...draft.siblings,
    ...draft.children,
    ...draft.extraSpouses.map((item) => item.spouse),
    ...draft.extraChildren.map((item) => item.child),
  ];
  draft.branches.forEach((branch) => {
    if (branch.grandfather) pools.push(branch.grandfather);
    if (branch.grandmother) pools.push(branch.grandmother);
    branch.collaterals.forEach((collateral) => {
      pools.push(collateral.person);
      pools.push(...collateral.spouses);
    });
    pools.push(...branch.cousins);
  });
  return pools.find((item) => item.id === id);
}

function finishKin(draft: Draft, source: Pending): { draft: Draft; phase: Phase; pending: Pending; notice: string } {
  const bits = { firstName: source.firstName, lastName: source.lastName, gender: source.gender };
  const done = { phase: 'grow' as Phase, pending: freshPending(), notice: '' };

  if (source.kin === 'brother' || source.kin === 'sister') {
    const sibling = { ...emptyBits(uid('sb')), ...bits };
    return { ...done, draft: { ...draft, siblings: [...draft.siblings, sibling] } };
  }

  if ((source.kin === 'grandfather' || source.kin === 'grandmother') && source.viaParentId) {
    const key = source.kin === 'grandfather' ? 'grandfather' : 'grandmother';
    const prefix = source.kin === 'grandfather' ? 'gf' : 'gm';
    const person = { ...emptyBits(uid(prefix)), ...bits };
    return { ...done, draft: withBranch(draft, source.viaParentId, (branch) => ({ ...branch, [key]: person })) };
  }

  if ((source.kin === 'uncle' || source.kin === 'aunt') && source.viaParentId) {
    const person = { ...emptyBits(uid(source.kin === 'aunt' ? 'au' : 'un')), ...bits };
    const next = withBranch(draft, source.viaParentId, (branch) => ({
      ...branch,
      collaterals: [...branch.collaterals, { person, spouses: [] }],
    }));
    if (source.queue === 'cousin' || source.queue === 'cousine') {
      return {
        draft: next,
        phase: 'kin-first',
        pending: { ...freshPending(), kin: source.queue, gender: impliedGender(source.queue), viaParentId: source.viaParentId, viaUncleId: person.id },
        notice: '',
      };
    }
    return { ...done, draft: next };
  }

  if ((source.kin === 'cousin' || source.kin === 'cousine') && source.viaParentId && source.viaUncleId) {
    const cousin = {
      ...emptyBits(uid('co')),
      ...bits,
      collateralId: source.viaUncleId,
      unionSpouseId: source.unionSpouseId === 'none' ? null : source.unionSpouseId,
    };
    return {
      ...done,
      draft: withBranch(draft, source.viaParentId, (branch) => ({ ...branch, cousins: [...branch.cousins, cousin] })),
    };
  }

  if (source.kin === 'collateral-spouse' && source.hostId) {
    const found = findCollateral(draft, source.hostId);
    if (!found) return { ...done, draft, notice: 'Cet oncle ou cette tante n’est plus dans l’arbre.' };
    const spouse = { ...emptyBits(uid('sp')), ...bits, rank: found.collateral.spouses.length + 1 };
    return {
      ...done,
      draft: withBranch(draft, found.branch.parentId, (branch) => ({
        ...branch,
        collaterals: branch.collaterals.map((item) => (
          item.person.id === source.hostId ? { ...item, spouses: [...item.spouses, spouse] } : item
        )),
      })),
    };
  }

  if (source.kin === 'node-spouse' && source.hostId) {
    const spouse = { ...emptyBits(uid('sp')), ...bits, rank: hostSpouses(draft, source.hostId).length + 1 };
    if (source.hostId === draft.anchor.id) {
      return { ...done, draft: { ...draft, spouses: [...draft.spouses, spouse] } };
    }
    const found = findCollateral(draft, source.hostId);
    if (found) {
      return {
        ...done,
        draft: withBranch(draft, found.branch.parentId, (branch) => ({
          ...branch,
          collaterals: branch.collaterals.map((item) => (
            item.person.id === source.hostId ? { ...item, spouses: [...item.spouses, spouse] } : item
          )),
        })),
      };
    }
    return { ...done, draft: { ...draft, extraSpouses: [...draft.extraSpouses, { hostId: source.hostId, spouse }] } };
  }

  if (source.kin === 'node-child' && source.hostId) {
    const child = { ...emptyBits(uid('ch')), ...bits };
    const other = source.unionSpouseId && source.unionSpouseId !== 'none' ? source.unionSpouseId : null;
    if (source.hostId === draft.anchor.id) {
      return {
        ...done,
        draft: { ...draft, children: [...draft.children, { ...child, unionSpouseId: other }] },
      };
    }
    const found = findCollateral(draft, source.hostId);
    if (found) {
      return {
        ...done,
        draft: withBranch(draft, found.branch.parentId, (branch) => ({
          ...branch,
          cousins: [...branch.cousins, { ...child, collateralId: source.hostId!, unionSpouseId: other }],
        })),
      };
    }
    const parent = draft.parents.find((item) => item.id === source.hostId);
    const partner = draft.parents.find((item) => item.id !== source.hostId);
    if (parent && partner && other === partner.id) {
      return { ...done, draft: { ...draft, siblings: [...draft.siblings, child] } };
    }
    return {
      ...done,
      draft: { ...draft, extraChildren: [...draft.extraChildren, { parentIds: other ? [source.hostId, other] : [source.hostId], child }] },
    };
  }

  return { ...done, draft };
}
const AssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const [anchorId] = useState(() => uid('as'));
  const [phase, setPhase] = useState<Phase>('anchor-first');
  const [draft, setDraft] = useState<Draft>(() => ({
    anchor: emptyBits(anchorId),
    spouses: [],
    children: [],
    parents: [],
    siblings: [],
    branches: [],
    extraSpouses: [],
    extraChildren: [],
  }));
  const [pending, setPending] = useState<Pending>(freshPending);
  const [text, setText] = useState('');
  const [notice, setNotice] = useState('');
  const [history, setHistory] = useState<{ phase: Phase; draft: Draft; pending: Pending }[]>([]);
  const [saving, setSaving] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; text: string }[]>([
    { role: 'assistant', text: 'Quel est le prénom qui ouvre l’arbre ?' },
  ]);
  const spokenRef = useRef('');
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Assistant — GeneaTreePro';
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, helpOpen]);

  const family = useMemo(() => buildFamily(draft), [draft]);
  const kind = kindOf(phase);
  const optional = phase === 'anchor-birth' || phase === 'anchor-city';

  const remember = () => {
    setHistory((items) => [...items, { phase, draft: structuredClone(draft), pending: { ...pending } }]);
  };

  const go = (next: Phase, nextDraft = draft, nextPending = pending, keep = '') => {
    const said = spokenRef.current;
    spokenRef.current = '';
    remember();
    setDraft(nextDraft);
    setPending(nextPending);
    setPhase(next);
    setText('');
    setNotice(keep);
    setHelpOpen(false);
    if (said) {
      let follow = promptFor(next, nextDraft, nextPending);
      if (next === 'grow') follow = 'L’arbre peut s’ouvrir. Les liens sont rangés en dessous.';
      if (next === 'parent-first' && nextPending.kin) follow = 'Pour le placer dans l’arbre, un parent d’abord. Quel est son prénom ?';
      setMessages((items) => [...items, { role: 'user', text: said }, { role: 'assistant', text: follow }]);
    }
  };

  const answer = (value: string) => {
    if (phase === 'grow') {
      if (value.startsWith('kin:')) {
        beginKin(value.slice(4) as KinKind);
        return;
      }
      setNotice('Choisissez un lien sous le message, ou ouvrez l’arbre.');
      return;
    }
    const read = interpret(phase, value, optional, draft, pending);
    if (!read.ok) {
      setNotice(read.error);
      return;
    }
    if (phase === 'anchor-birth' && read.value && read.value > new Date().toISOString().slice(0, 10)) {
      setNotice('La naissance ne peut pas être dans le futur.');
      return;
    }
    spokenRef.current = read.label;
    const clean = read.value;

    const anchor = { ...draft.anchor };
    const nextPending = { ...pending };

    switch (phase) {
      case 'anchor-first':
        go('anchor-last', { ...draft, anchor: { ...anchor, firstName: clean } });
        return;
      case 'anchor-last':
        go('anchor-gender', { ...draft, anchor: { ...anchor, lastName: clean } });
        return;
      case 'anchor-gender':
        go('anchor-birth', { ...draft, anchor: { ...anchor, gender: clean as GenderType } });
        return;
      case 'anchor-birth':
        go('anchor-city', { ...draft, anchor: { ...anchor, birthDate: clean } });
        return;
      case 'anchor-city':
        go('spouse-ask', { ...draft, anchor: { ...anchor, city: clean } });
        return;
      case 'spouse-ask':
        go(value === 'oui' ? 'spouse-first' : 'child-ask', draft, freshPending());
        return;
      case 'spouse-first':
        go('spouse-last', draft, { ...nextPending, firstName: clean });
        return;
      case 'spouse-last':
        go('spouse-gender', draft, { ...nextPending, lastName: clean });
        return;
      case 'spouse-gender': {
        const spouse = {
          ...emptyBits(uid('sp')),
          firstName: pending.firstName,
          lastName: pending.lastName,
          gender: clean as GenderType,
          rank: draft.spouses.length + 1,
        };
        go('spouse-more', { ...draft, spouses: [...draft.spouses, spouse] }, freshPending());
        return;
      }
      case 'spouse-more':
        go(value === 'oui' ? 'spouse-first' : 'child-ask', draft, freshPending());
        return;
      case 'child-ask':
        if (value !== 'oui') {
          go('parent-ask');
          return;
        }
        if (draft.spouses.length > 1) go('child-union', draft, freshPending());
        else go('child-first', draft, { ...freshPending(), unionSpouseId: draft.spouses[0]?.id ?? null });
        return;
      case 'child-union':
        go('child-first', draft, { ...nextPending, unionSpouseId: value });
        return;
      case 'child-first':
        go('child-last', draft, { ...nextPending, firstName: clean });
        return;
      case 'child-last':
        go('child-gender', draft, { ...nextPending, lastName: clean });
        return;
      case 'child-gender': {
        const child = {
          ...emptyBits(uid('ch')),
          firstName: pending.firstName,
          lastName: pending.lastName,
          gender: clean as GenderType,
          unionSpouseId: pending.unionSpouseId,
        };
        go('child-more', { ...draft, children: [...draft.children, child] }, freshPending());
        return;
      }
      case 'child-more':
        if (value !== 'oui') {
          go('parent-ask');
          return;
        }
        if (draft.spouses.length > 1) go('child-union', draft, freshPending());
        else go('child-first', draft, { ...freshPending(), unionSpouseId: draft.spouses[0]?.id ?? null });
        return;
      case 'parent-ask':
        go(value === 'oui' ? 'parent-first' : 'grow', draft, freshPending());
        return;
      case 'parent-first':
        go('parent-last', draft, { ...nextPending, firstName: clean });
        return;
      case 'parent-last':
        go('parent-gender', draft, { ...nextPending, lastName: clean });
        return;
      case 'parent-gender': {
        const parent = { ...emptyBits(uid('pa')), firstName: pending.firstName, lastName: pending.lastName, gender: clean as GenderType };
        go('parent-second', { ...draft, parents: [...draft.parents, parent] }, carryKin(pending));
        return;
      }
      case 'parent-second': {
        if (value === 'oui') {
          go('parent2-first', draft, carryKin(pending));
          return;
        }
        const next = afterParents(pending, draft);
        go(next.phase, draft, next.pending);
        return;
      }
      case 'parent2-first':
        go('parent2-last', draft, { ...nextPending, firstName: clean });
        return;
      case 'parent2-last':
        go('parent2-gender', draft, { ...nextPending, lastName: clean });
        return;
      case 'parent2-gender': {
        const parent = { ...emptyBits(uid('pa')), firstName: pending.firstName, lastName: pending.lastName, gender: clean as GenderType };
        const nextDraft = { ...draft, parents: [...draft.parents, parent] };
        const next = afterParents(pending, nextDraft);
        go(next.phase, nextDraft, next.pending);
        return;
      }
      case 'kin-side': {
        if (!pending.kin) {
          go('grow');
          return;
        }
        const taken = slotTaken(draft, clean, pending.kin);
        if (taken) {
          go('grow', draft, freshPending(), `${taken.firstName} est déjà enregistré de ce côté.`);
          return;
        }
        const route = routeKin(pending.kin, draft, clean);
        go(route.phase, draft, { ...pending, viaParentId: clean, ...route.pendingPatch });
        return;
      }
      case 'kin-link-role': {
        const linkAs = clean === 'mother' ? 'female' : 'male';
        const branch = pending.viaParentId ? branchOf(draft, pending.viaParentId) : undefined;
        const existing = linkAs === 'female' ? branch?.grandmother : branch?.grandfather;
        if (existing) {
          go('kin-first', draft, { ...pending, linkAs, firstName: '', lastName: '' });
          return;
        }
        go('kin-link', draft, { ...pending, linkAs, firstName: '', lastName: '' });
        return;
      }
      case 'kin-link':
        go('kin-link-last', draft, { ...nextPending, firstName: clean });
        return;
      case 'kin-link-last': {
        if (!pending.viaParentId || !pending.linkAs) {
          go('grow');
          return;
        }
        const key = pending.linkAs === 'female' ? 'grandmother' : 'grandfather';
        const person = { ...emptyBits(uid(pending.linkAs === 'female' ? 'gm' : 'gf')), firstName: pending.firstName, lastName: clean, gender: pending.linkAs };
        go('kin-first', withBranch(draft, pending.viaParentId, (branch) => ({ ...branch, [key]: person })), { ...pending, firstName: '', lastName: '' });
        return;
      }
      case 'kin-pick': {
        if (clean === 'new-uncle' || clean === 'new-aunt') {
          const kin = clean === 'new-aunt' ? 'aunt' : 'uncle';
          const parentId = pending.viaParentId ?? draft.parents[0]?.id ?? null;
          if (!parentId) {
            go('parent-first', draft, { ...freshPending(), kin, gender: impliedGender(kin), queue: pending.kin });
            return;
          }
          const route = routeKin(kin, draft, parentId);
          go(route.phase, draft, { ...freshPending(), kin, gender: impliedGender(kin), queue: pending.kin, viaParentId: parentId, ...route.pendingPatch });
          return;
        }
        if (pending.kin === 'cousin' || pending.kin === 'cousine') {
          const found = findCollateral(draft, clean);
          const spouses = found?.collateral.spouses ?? [];
          const nextPending = { ...freshPending(), kin: pending.kin, gender: pending.gender, viaParentId: found?.branch.parentId ?? pending.viaParentId, viaUncleId: clean };
          go(spouses.length ? 'kin-union' : 'kin-first', draft, nextPending);
          return;
        }
        const spouses = hostSpouses(draft, clean);
        const next = { ...freshPending(), kin: pending.kin, gender: impliedGender(pending.kin ?? 'node-spouse'), hostId: clean, viaUncleId: findCollateral(draft, clean) ? clean : null };
        go(pending.kin === 'node-child' && spouses.length ? 'kin-union' : 'kin-first', draft, next);
        return;
      }
      case 'kin-union':
        go('kin-first', draft, { ...pending, unionSpouseId: clean === 'none' ? null : clean });
        return;
      case 'kin-first':
        go('kin-last', draft, { ...nextPending, firstName: clean });
        return;
      case 'kin-last': {
        const named = { ...pending, lastName: clean };
        if (named.gender === 'unknown') {
          go('kin-gender', draft, named);
          return;
        }
        const result = finishKin(draft, named);
        go(result.phase, result.draft, result.pending, result.notice);
        return;
      }
      case 'kin-gender': {
        const result = finishKin(draft, { ...pending, gender: clean as GenderType });
        go(result.phase, result.draft, result.pending, result.notice);
        return;
      }
      default:
        return;
    }
  };

  const beginKin = (kin: KinKind) => {
    const gender = impliedGender(kin);
    const base = { ...freshPending(), kin, gender };
    spokenRef.current = kinLabel(kin);
    if (kin === 'node-spouse' || kin === 'node-child') {
      go('kin-pick', draft, base);
      return;
    }
    if (kin === 'collateral-spouse') {
      if (!collateralChoices(draft).length) {
        go('grow', draft, freshPending(), 'Ajoutez d’abord un oncle ou une tante.');
        return;
      }
      go('kin-pick', draft, base);
      return;
    }
    if (draft.parents.length === 0) {
      go('parent-first', draft, base);
      return;
    }
    if (kin === 'brother' || kin === 'sister') {
      go('kin-first', draft, base);
      return;
    }
    if (draft.parents.length === 1) {
      const via = draft.parents[0].id;
      const taken = slotTaken(draft, via, kin);
      if (taken) {
        go('grow', draft, freshPending(), `${taken.firstName} est déjà enregistré de ce côté.`);
        return;
      }
      const route = routeKin(kin, draft, via);
      go(route.phase, draft, { ...base, viaParentId: via, ...route.pendingPatch });
      return;
    }
    go('kin-side', draft, base);
  };

  const back = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    setPhase(previous.phase);
    setDraft(previous.draft);
    setPending(previous.pending);
    setText('');
    setNotice('');
    setMessages((items) => (items.length > 2 ? items.slice(0, -2) : items));
  };

  const resetDraft = () => {
    setDraft({ anchor: emptyBits(anchorId), spouses: [], children: [], parents: [], siblings: [], branches: [], extraSpouses: [], extraChildren: [] });
    setPending(freshPending());
    setPhase('anchor-first');
    setHistory([]);
    setText('');
    setNotice('');
    setHelpOpen(false);
    setMessages([{ role: 'assistant', text: 'Quel est le prénom qui ouvre l’arbre ?' }]);
  };

  const listen = () => {
    const host = window as Window & {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
    const Recognition = host.SpeechRecognition || host.webkitSpeechRecognition;
    if (!Recognition) {
      setNotice('La dictée n’est pas disponible dans ce navigateur.');
      return;
    }
    const rec = new Recognition();
    rec.lang = 'fr-FR';
    rec.onresult = (event) => setText(event.results[0]?.[0]?.transcript ?? '');
    rec.start();
  };

  const openDemo = async () => {
    setSaving(true);
    setNotice('');
    try {
      localStorage.setItem('geneatree.example', 'custom');
      localStorage.setItem('focusPerson', draft.anchor.id);
      await saveFamily(family.persons, family.marriages);
      navigate('/demo');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'L’enregistrement a échoué.');
      setSaving(false);
    }
  };

  const chips = chipsFor(phase, draft, optional, pending);

  return (
    <div className="flex h-full overflow-hidden bg-[#f4f1ea] dark:bg-[#09090b]">
      <section className="relative flex h-full w-full shrink-0 flex-col border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/85 md:max-w-md md:border-r">
        <div className="pointer-events-none absolute h-28 w-full bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_70%)]" />
        <div className="relative flex items-center justify-between border-b border-zinc-200/80 px-4 py-3 dark:border-white/10">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">Assistant</p>
            <h1 className="font-serif text-xl text-zinc-950 dark:text-white">Nouvel arbre</h1>
          </div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">{labelFor(kind)}</p>
        </div>
        <div ref={threadRef} className="relative flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <p className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.role === 'user' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950' : 'bg-white text-zinc-800 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'}`}>
                {message.text}
              </p>
            </div>
          ))}
          {helpOpen && (
            <p className="rounded-2xl border border-dashed border-primary-300 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300">
              {helpFor(kind)} Les pastilles remplissent la réponse. Le bouton à droite de la zone envoie.
            </p>
          )}
          {notice && <p className="text-sm text-red-700 dark:text-red-300">{notice}</p>}
        </div>
        <div className="border-t border-zinc-200/80 bg-white/90 px-3 py-3 backdrop-blur dark:border-white/10 dark:bg-zinc-950/90">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <button key={chip.label} type="button" onClick={() => answer(chip.value)} className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-800 hover:border-primary-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                {chip.label}
              </button>
            ))}
            {phase === 'grow' && (
              <div className="mb-2 w-full space-y-1.5">
                <button type="button" disabled={saving || family.persons.length === 0} onClick={openDemo} className="rounded-full bg-zinc-950 px-3 py-1.5 text-xs text-white disabled:opacity-50 dark:bg-white dark:text-zinc-950">
                  {saving ? 'Ouverture…' : 'Ouvrir l’arbre'}
                </button>
                <div className="max-h-[min(26rem,50dvh)] space-y-1 overflow-y-auto overscroll-contain">
                {([
                  ['Fratrie', [['brother', 'Frère'], ['sister', 'Sœur']]],
                  ['Grands-parents', [['grandfather', 'Grand-père'], ['grandmother', 'Grand-mère']]],
                  ['Oncles et tantes', [['uncle', 'Oncle'], ['aunt', 'Tante'], ['collateral-spouse', 'Leur conjoint']]],
                  ['Cousins', [['cousin', 'Cousin'], ['cousine', 'Cousine']]],
                  ['Une personne déjà présente', [['node-spouse', 'Ajouter un conjoint'], ['node-child', 'Ajouter un enfant']]],
                ] as const).map(([title, items]) => (
                  <div key={title}>
                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">{title}</p>
                    <div className="flex flex-wrap gap-1">
                      {items.map(([kin, label]) => (
                        <button key={kin} type="button" onClick={() => beginKin(kin)} className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs text-zinc-800 hover:border-primary-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
          <form className="flex items-center gap-2" onSubmit={(event) => { event.preventDefault(); answer(text); }}>
            <input
              autoFocus
              type={kind === 'date' ? 'date' : 'text'}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={phase === 'grow' ? 'Ou choisissez un lien' : 'Écrire la réponse'}
              className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button type="submit" aria-label="Envoyer" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <ToolButton label="Revenir" disabled={history.length === 0} onClick={back}><Undo2 className="h-3.5 w-3.5" /></ToolButton>
            <ToolButton label="Passer" disabled={!optional} onClick={() => answer('')}><SkipForward className="h-3.5 w-3.5" /></ToolButton>
            <ToolButton label="Dicter" onClick={listen}><Mic className="h-3.5 w-3.5" /></ToolButton>
            <ToolButton label="Aide" onClick={() => setHelpOpen((open) => !open)}><HelpCircle className="h-3.5 w-3.5" /></ToolButton>
            <ToolButton label="Recommencer" onClick={resetDraft}><RotateCcw className="h-3.5 w-3.5" /></ToolButton>
          </div>
        </div>
      </section>
      <div className="relative hidden min-w-0 flex-1 md:block">
        <div className="pointer-events-none absolute left-4 top-4 z-30 flex flex-col gap-2">
          <span className="pointer-events-auto rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs text-zinc-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/80 dark:text-zinc-200">
            {family.persons.length} personne{family.persons.length > 1 ? 's' : ''}
          </span>
          <span className="pointer-events-auto rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs text-zinc-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/80 dark:text-zinc-200">
            {family.marriages.length} union{family.marriages.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="absolute right-4 top-4 z-30 flex gap-2">
          <ToolButton label="Aide" onClick={() => setHelpOpen(true)}><HelpCircle className="h-3.5 w-3.5" /></ToolButton>
          <ToolButton label="Revenir" disabled={history.length === 0} onClick={back}><Undo2 className="h-3.5 w-3.5" /></ToolButton>
        </div>
        <button type="button" onClick={resetDraft} className="absolute bottom-24 right-4 z-30 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-xs text-zinc-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/80 dark:text-zinc-200">
          Recommencer
        </button>
        {family.persons.length > 0 ? (
          <TreeVisualization
            viewType="tree"
            generations={5}
            focusPerson={draft.anchor.id}
            familyData={family.persons}
            marriagesData={family.marriages}
            onPersonSelect={() => undefined}
            onAddPersonClick={() => undefined}
            onDeletePerson={() => undefined}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-8 text-center text-zinc-500">
            La vue de la démonstration apparaît avec le premier prénom.
          </div>
        )}
      </div>
    </div>
  );
};

function ToolButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800">
      {children}
      {label}
    </button>
  );
}

function kinLabel(kin: KinKind) {
  const labels: Record<KinKind, string> = {
    brother: 'Frère',
    sister: 'Sœur',
    cousin: 'Cousin',
    cousine: 'Cousine',
    uncle: 'Oncle',
    aunt: 'Tante',
    grandfather: 'Grand-père',
    grandmother: 'Grand-mère',
    'collateral-spouse': 'Conjoint',
    'node-spouse': 'Ajouter un conjoint',
    'node-child': 'Ajouter un enfant',
  };
  return labels[kin];
}

function kindOf(phase: Phase): 'text' | 'date' | 'choice' | 'yesno' | 'grow' {
  if (phase === 'grow') return 'grow';
  if (phase === 'kin-side' || phase === 'kin-link-role' || phase === 'kin-pick' || phase === 'kin-union' || phase.endsWith('gender') || phase === 'child-union') return 'choice';
  if (phase.endsWith('ask') || phase.endsWith('more') || phase === 'parent-second') return 'yesno';
  if (phase === 'anchor-birth') return 'date';
  return 'text';
}

function labelFor(kind: ReturnType<typeof kindOf>) {
  if (kind === 'yesno') return 'Oui ou non';
  if (kind === 'choice') return 'Un choix';
  if (kind === 'date') return 'Une date';
  if (kind === 'grow') return 'Étendre';
  return 'Une réponse écrite';
}

function namedParent(draft: Draft, pending?: Pending) {
  return draft.parents.find((parent) => parent.id === pending?.viaParentId)?.firstName || 'ce parent';
}

function namedHost(draft: Draft, pending?: Pending) {
  if (!pending?.hostId && !pending?.viaUncleId) return 'cette personne';
  return hostPerson(draft, pending.hostId || pending.viaUncleId || '')?.firstName || 'cette personne';
}

function promptFor(phase: Phase, draft: Draft, pending?: Pending) {
  const name = draft.anchor.firstName || 'cette personne';
  const parent = namedParent(draft, pending);
  switch (phase) {
    case 'anchor-first': return 'Quel est le prénom qui ouvre l’arbre ?';
    case 'anchor-last': return 'Quel est le nom de famille ?';
    case 'anchor-gender': return 'Quel genre enregistrer ?';
    case 'anchor-birth': return 'Quelle est la date de naissance ?';
    case 'anchor-city':
      if (draft.anchor.gender === 'female') return `Dans quelle ville ${name} est-elle née ?`;
      if (draft.anchor.gender === 'male') return `Dans quelle ville ${name} est-il né ?`;
      return `Dans quelle ville ${name} est né ?`;
    case 'spouse-ask': return `Enregistrer un conjoint de ${name} ?`;
    case 'spouse-first': return 'Quel est le prénom du conjoint ?';
    case 'spouse-last': return 'Quel est le nom du conjoint ?';
    case 'spouse-gender': return 'Quel genre pour ce conjoint ?';
    case 'spouse-more': return 'Ajouter un autre conjoint, avec le rang suivant ?';
    case 'child-ask': return draft.spouses.length > 1 ? 'Ajouter un enfant à l’une des unions ?' : `Ajouter un enfant de ${name} ?`;
    case 'child-union': return 'De quelle union est cet enfant ?';
    case 'child-first': return 'Quel est le prénom de l’enfant ?';
    case 'child-last': return 'Quel est le nom de l’enfant ?';
    case 'child-gender': return 'Quel genre pour cet enfant ?';
    case 'child-more': return 'Ajouter un autre enfant ?';
    case 'parent-ask': return `Connaissez-vous un parent de ${name} ?`;
    case 'parent-first': return 'Quel est le prénom du parent ?';
    case 'parent-last': return 'Quel est le nom du parent ?';
    case 'parent-gender': return 'Quel genre pour ce parent ?';
    case 'parent-second': return 'Connaissez-vous l’autre parent ?';
    case 'parent2-first': return 'Quel est le prénom de l’autre parent ?';
    case 'parent2-last': return 'Quel est le nom de l’autre parent ?';
    case 'parent2-gender': return 'Quel genre pour l’autre parent ?';
    case 'grow': return 'L’arbre peut s’ouvrir. Les liens sont rangés en dessous : fratrie, grands-parents, oncles et tantes, leur conjoint, cousins, ou un conjoint et un enfant pour une personne déjà présente.';
    case 'kin-side': return 'Ce lien est du côté de quel parent ?';
    case 'kin-link-role': return `Qui est le parent commun de ${parent} et de cette personne ?`;
    case 'kin-link': return pending?.linkAs === 'female' ? `Quel est le prénom de la mère de ${parent} ?` : `Quel est le prénom du père de ${parent} ?`;
    case 'kin-link-last': return 'Quel est son nom ?';
    case 'kin-pick':
      if (pending?.kin === 'cousin' || pending?.kin === 'cousine') return 'Cet enfant est celui de quel oncle ou quelle tante ?';
      if (pending?.kin === 'collateral-spouse') return 'Le conjoint de quel oncle ou quelle tante ?';
      if (pending?.kin === 'node-child') return 'L’enfant de quelle personne ?';
      return 'Le conjoint de quelle personne ?';
    case 'kin-union': return 'Dans quelle union ?';
    case 'kin-gender': return 'Quel genre enregistrer ?';
    case 'kin-last': return 'Quel est le nom ?';
    case 'kin-first':
      if (pending?.kin === 'sister') return 'Quel est le prénom de la sœur ?';
      if (pending?.kin === 'brother') return 'Quel est le prénom du frère ?';
      if (pending?.kin === 'aunt') return `Quel est le prénom de la sœur de ${parent} ?`;
      if (pending?.kin === 'uncle') return `Quel est le prénom du frère de ${parent} ?`;
      if (pending?.kin === 'cousine') return 'Quel est le prénom de la cousine ?';
      if (pending?.kin === 'cousin') return 'Quel est le prénom du cousin ?';
      if (pending?.kin === 'grandmother') return `Quel est le prénom de la mère de ${parent} ?`;
      if (pending?.kin === 'grandfather') return `Quel est le prénom du père de ${parent} ?`;
      if (pending?.kin === 'collateral-spouse' || pending?.kin === 'node-spouse') return `Quel est le prénom du conjoint de ${namedHost(draft, pending)} ?`;
      if (pending?.kin === 'node-child') return `Quel est le prénom de l’enfant de ${namedHost(draft, pending)} ?`;
      return 'Quel est le prénom ?';
    default: return 'Le lignage est prêt.';
  }
}

function interpret(phase: Phase, raw: string, optional: boolean, draft: Draft, pending?: Pending): { ok: true; value: string; label: string } | { ok: false; error: string } {
  const clean = raw.trim();
  const kind = kindOf(phase);
  if (kind === 'yesno') {
    if (/^(oui|yes|o|ouais)$/i.test(clean)) return { ok: true, value: 'oui', label: 'Oui' };
    if (/^(non|no|n)$/i.test(clean)) return { ok: true, value: 'non', label: 'Non' };
    return { ok: false, error: 'Répondez oui ou non, ou touchez une pastille.' };
  }
  if (phase.endsWith('gender')) {
    if (clean === 'female' || /^femme$/i.test(clean)) return { ok: true, value: 'female', label: 'Femme' };
    if (clean === 'male' || /^homme$/i.test(clean)) return { ok: true, value: 'male', label: 'Homme' };
    if (clean === 'unknown' || /non pr[eé]cis/i.test(clean)) return { ok: true, value: 'unknown', label: 'Non précisé' };
    return { ok: false, error: 'Choisissez Femme, Homme ou Non précisé.' };
  }
  if (phase === 'child-union') {
    const found = draft.spouses.find((spouse) => spouse.id === clean || spouse.firstName.toLowerCase() === clean.toLowerCase());
    if (!found) return { ok: false, error: 'Choisissez l’union avec une pastille.' };
    return { ok: true, value: found.id, label: `${found.firstName} ${found.lastName}` };
  }
  if (phase === 'kin-side') {
    const parent = draft.parents.find((item) => item.id === clean);
    if (!parent) return { ok: false, error: 'Choisissez le parent.' };
    return { ok: true, value: parent.id, label: parent.firstName };
  }
  if (phase === 'kin-link-role') {
    if (clean === 'father' || /p[eè]re/i.test(clean)) return { ok: true, value: 'father', label: 'Son père' };
    if (clean === 'mother' || /m[eè]re/i.test(clean)) return { ok: true, value: 'mother', label: 'Sa mère' };
    return { ok: false, error: 'Choisissez le père ou la mère.' };
  }
  if (phase === 'kin-pick' || phase === 'kin-union') {
    const choice = (pending ? chipsFor(phase, draft, false, pending) : []).find((item) => item.value === clean);
    if (!choice) return { ok: false, error: 'Choisissez une pastille.' };
    return { ok: true, value: choice.value, label: choice.label };
  }
  if ((kind === 'text' || kind === 'date') && !optional && !clean) {
    return { ok: false, error: 'Écrivez la réponse, puis envoyez.' };
  }
  return { ok: true, value: clean, label: clean || 'Passé' };
}

function chipsFor(phase: Phase, draft: Draft, optional: boolean, pending?: Pending) {
  if (kindOf(phase) === 'yesno') return [{ label: 'Oui', value: 'oui' }, { label: 'Non', value: 'non' }];
  if (phase.endsWith('gender')) return genders.map((item) => ({ label: item.label, value: item.value }));
  if (phase === 'child-union') return draft.spouses.map((spouse) => ({ label: `${spouse.firstName} · rang ${spouse.rank}`, value: spouse.id }));
  if (phase === 'kin-side') return draft.parents.map((parent) => ({ label: parent.firstName, value: parent.id }));
  if (phase === 'kin-link-role') return [{ label: 'Son père', value: 'father' }, { label: 'Sa mère', value: 'mother' }];
  if (phase === 'kin-pick' && pending) {
    if (pending.kin === 'cousin' || pending.kin === 'cousine') {
      const existing = collateralChoices(draft).filter((item) => !pending.viaParentId || draft.branches.some((branch) => branch.parentId === pending.viaParentId && branch.collaterals.some((collateral) => collateral.person.id === item.value)));
      return [...existing, { label: 'Un nouvel oncle', value: 'new-uncle' }, { label: 'Une nouvelle tante', value: 'new-aunt' }];
    }
    if (pending.kin === 'collateral-spouse') return collateralChoices(draft);
    return peopleChoices(draft);
  }
  if (phase === 'kin-union' && pending) {
    const hostId = pending.hostId || pending.viaUncleId;
    if (!hostId) return [];
    const host = hostPerson(draft, hostId);
    const spouses = hostSpouses(draft, hostId);
    return [
      { label: host?.firstName ? `${host.firstName} seul` : 'Seul', value: 'none' },
      ...spouses.map((spouse) => ({ label: `${host?.firstName ?? ''} et ${spouse.firstName}`, value: spouse.id })),
    ];
  }
  if (phase === 'anchor-city') return ['Yaoundé', 'Douala', 'Bafoussam', 'Garoua'].map((city) => ({ label: city, value: city }));
  if (phase === 'child-last') {
    const spouse = draft.spouses.find((item) => item.id === pending?.unionSpouseId);
    return surnameChip([draft.anchor, spouse].filter((item): item is Bits => Boolean(item)));
  }
  if (phase === 'kin-last' && pending) return kinSurnameChip(draft, pending);
  if (optional) return [{ label: 'Passer', value: '' }];
  return [];
}

function helpFor(kind: ReturnType<typeof kindOf>) {
  if (kind === 'yesno') return 'Cette question attend oui ou non.';
  if (kind === 'choice') return 'Un choix parmi les pastilles, ou le mot correspondant.';
  if (kind === 'date') return 'Une date, ou Passez si elle est inconnue.';
  if (kind === 'grow') return 'Ouvrez l’arbre, ou ajoutez un lien dans un des groupes : fratrie, grands-parents, oncles et tantes, cousins, conjoint ou enfant d’une personne déjà présente.';
  return 'Une réponse écrite : prénom ou nom. Le nom n’est pas recopié tout seul.';
}

export default AssistantPage;
