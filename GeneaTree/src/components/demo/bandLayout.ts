import { Marriage, Person } from '../../types/family';

const CARD_W = 116;
const GAP = 36;
const ROW = 188;

export interface BandNode {
  person: Person;
  x: number;
  y: number;
  depth: number;
}

export interface BandUnion {
  x1: number;
  x2: number;
  y: number;
  rail: boolean;
  ticks: { x: number }[];
}

export interface BandDrop {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  barY: number;
  span: { x1: number; x2: number };
  drops: { x: number; y: number }[];
}

export interface BandLayout {
  nodes: BandNode[];
  unions: BandUnion[];
  drops: BandDrop[];
  minX: number;
  minY: number;
  width: number;
  height: number;
}

// A shared parental junction does not imply a marriage. Build display-only
// households for known parent pairs, without changing the stored family.
export function parentalHouseholds(people: Person[], marriages: Marriage[]): Marriage[] {
  const byId = new Map(people.map(person => [person.id, person]));
  const result = marriages.map(union => ({ ...union, childrenIds: [...(union.childrenIds ?? [])] }));
  for (const child of people) {
    const parents = [...new Set(child.parentIds)].filter(id => byId.has(id));
    if (parents.length !== 2) continue;
    let household = result.find(union => parents.includes(union.spouse1Id) && parents.includes(union.spouse2Id));
    if (!household) {
      const owner = parents.find(id => marriages.some(union => union.spouse1Id === id))
        ?? parents.find(id => byId.get(id)?.gender === 'male') ?? parents[0];
      household = { id: `parental-${[...parents].sort().join('-')}`, spouse1Id: owner, spouse2Id: parents.find(id => id !== owner)!, childrenIds: [], rank: 0 };
      result.push(household);
    }
    if (!household.childrenIds.includes(child.id)) household.childrenIds.push(child.id);
  }
  return result;
}

export function layoutBands(people: Person[], recordedMarriages: Marriage[], maxGenerations: number): BandLayout {
  const marriages = parentalHouseholds(people, recordedMarriages);
  const byId = new Map(people.map((person) => [person.id, person]));
  const partnersOf = new Map(people.map(person => [person.id, new Set<string>()]));
  marriages.forEach(union => {
    partnersOf.get(union.spouse1Id)?.add(union.spouse2Id);
    partnersOf.get(union.spouse2Id)?.add(union.spouse1Id);
  });
  // A family hub can be stored as either spouse. This is a display-only copy.
  marriages.forEach(union => {
    if ((partnersOf.get(union.spouse2Id)?.size ?? 0) > (partnersOf.get(union.spouse1Id)?.size ?? 0)) {
      [union.spouse1Id, union.spouse2Id] = [union.spouse2Id, union.spouse1Id];
    }
  });
  const childrenById = new Map(people.map(person => [person.id, new Set(person.childrenIds.filter(id => byId.has(id)))]));
  people.forEach(child => child.parentIds.forEach(id => childrenById.get(id)?.add(child.id)));
  marriages.forEach(union => (union.childrenIds ?? []).forEach(id => {
    if (!byId.has(id)) return;
    childrenById.get(union.spouse1Id)?.add(id);
    childrenById.get(union.spouse2Id)?.add(id);
  }));
  const descendantsByUnion = new Map(marriages.map(union => {
    const descendants = new Set<string>();
    const queue = [...(union.childrenIds ?? [])];
    while (queue.length) {
      const id = queue.pop()!;
      if (!byId.has(id) || descendants.has(id) || id === union.spouse1Id || id === union.spouse2Id) continue;
      descendants.add(id);
      queue.push(...(childrenById.get(id) ?? []));
    }
    return [union.id, descendants] as const;
  }));
  const principalSide = new Map<string, -1 | 1>();
  const bridgeRoots = new Map<string, Set<string>>();
  const maxDepth = Math.max(0, maxGenerations - 1);
  const nodes: BandNode[] = [];
  const unions: BandUnion[] = [];
  const drops: BandDrop[] = [];
  const placed = new Set<string>();
  const rootHints = new Map<string, { childId: string; side: -1 | 1 }>();
  const generationById = calculateGenerations(people, marriages);

  const householdsOf = (id: string) => {
    const households = marriages
      .filter((marriage) => marriage.spouse1Id === id && byId.has(marriage.spouse2Id))
      .slice()
      .sort((a, b) => (principalSide.get(id) ?? 1) * (
        (descendantsByUnion.get(a.id)?.size ?? 0) - (descendantsByUnion.get(b.id)?.size ?? 0)
        || (b.rank ?? 99) - (a.rank ?? 99) || b.id.localeCompare(a.id)
      ));
    if (households.length > 2) {
      const bridges = households.filter(union => (bridgeRoots.get(union.id)?.size ?? 0) > 0);
      const side = principalSide.get(id) ?? 1;
      const principal = side > 0 ? households[households.length - 1] : households[0];
      if (bridges.length === 1 && bridges[0] !== principal) {
        const bridge = households.splice(households.indexOf(bridges[0]), 1)[0];
        if (side > 0) households.unshift(bridge); else households.push(bridge);
      }
    }
    return households;
  };

  const kidsOf = (marriage: Marriage) =>
    (marriage.childrenIds ?? []).filter((id) => byId.has(id));

  const measuring = new Set<string>();

  const marriedChildren = new Set(marriages.flatMap((marriage) => marriage.childrenIds ?? []));

  function looseKids(id: string): string[] {
    const person = byId.get(id);
    if (!person) return [];
    return (person.childrenIds ?? []).filter((childId) => byId.has(childId) && !marriedChildren.has(childId));
  }

  function mixedHouseholds(id: string, households: Marriage[]): boolean {
    return looseKids(id).length > 0 || households.some(union => looseKids(union.spouse2Id).length > 0);
  }

  function childrenWidth(children: string[], depth: number): number {
    return Math.max(CARD_W, children.reduce((sum, childId, index) => sum + measure(childId, depth) + (index ? GAP : 0), 0));
  }

  function measure(id: string, depth: number): number {
    if (!byId.has(id) || depth > maxDepth || measuring.has(id)) return CARD_W;
    if (placed.has(id)) return CARD_W;
    const households = householdsOf(id);
    if (depth === maxDepth) {
      if (!households.length) return CARD_W;
      if (households.length === 1) return CARD_W * 2 + 20;
      return CARD_W * (households.length + 1) + GAP * households.length;
    }
    if (households.length === 0) {
      const loose = looseKids(id);
      if (!loose.length) return CARD_W;
      measuring.add(id);
      let width = 0;
      loose.forEach((childId, index) => {
        width += measure(childId, depth + 1);
        if (index) width += GAP;
      });
      measuring.delete(id);
      return Math.max(CARD_W, width);
    }
    measuring.add(id);
    let width = CARD_W;
    const loose = looseKids(id);
    if (mixedHouseholds(id, households)) {
      width = childrenWidth(loose, depth + 1) + households.reduce((sum, household) => sum + GAP + measureColumn(household, depth), 0);
    } else if (households.length === 1) {
      width = measurePair(households[0], depth);
    } else if (households.length === 2) {
      width = measureColumn(households[0], depth) + GAP + CARD_W + GAP + measureColumn(households[1], depth);
    } else {
      width = CARD_W;
      households.forEach((household) => {
        width += GAP + measureColumn(household, depth);
      });
    }
    measuring.delete(id);
    return Math.max(CARD_W, width);
  }

  function measureColumn(marriage: Marriage, depth: number): number {
    const children = kidsOf(marriage);
    const spouseChildren = looseKids(marriage.spouse2Id);
    if (depth + 1 > maxDepth) return CARD_W;
    if (spouseChildren.length) return childrenWidth(children, depth + 1) + GAP + childrenWidth(spouseChildren, depth + 1);
    if (children.length === 0) return CARD_W;
    let width = 0;
    children.forEach((id, index) => {
      width += measure(id, depth + 1);
      if (index) width += GAP;
    });
    return Math.max(CARD_W, width);
  }

  function measurePair(marriage: Marriage, depth: number): number {
    const children = kidsOf(marriage);
    const pair = CARD_W * 2 + 20;
    if (depth + 1 > maxDepth || children.length === 0) return pair;
    let width = 0;
    children.forEach((id, index) => {
      width += measure(id, depth + 1);
      if (index) width += GAP;
    });
    return Math.max(pair, width);
  }

  function placeChildren(children: string[], left: number, width: number, depth: number) {
    if (depth > maxDepth || children.length === 0) return [];
    const sizes = children.map((id) => measure(id, depth));
    const kidsWidth = sizes.reduce((sum, size) => sum + size, 0) + GAP * Math.max(0, children.length - 1);
    let cursor = left + (width - kidsWidth) / 2;
    const centers: { x: number; y: number }[] = [];
    children.forEach((id, index) => {
      const childWidth = sizes[index];
      const placedChild = place(id, cursor, depth);
      if (placedChild) centers.push(placedChild);
      cursor += childWidth + GAP;
    });
    return centers;
  }

  function familyOrderedChildren(ownerId: string, marriage: Marriage) {
    const children = kidsOf(marriage);
    const hint = rootHints.get(ownerId);
    if (hint && children.includes(hint.childId)) {
      const others = children.filter((id) => id !== hint.childId);
      return hint.side === 1 ? [hint.childId, ...others] : [...others, hint.childId];
    }
    // A couple joining two ancestries belongs at the boundary of those families.
    // A sibling married to someone without visible parents must not take its place.
    const externalBridge = children.find((childId) => marriages.some((union) => {
      const partnerId = union.spouse1Id === childId ? union.spouse2Id : union.spouse2Id === childId ? union.spouse1Id : null;
      return partnerId && !children.includes(partnerId) && (byId.get(partnerId)?.parentIds.length ?? 0) > 0;
    }));
    const bridge = externalBridge ?? children.find((childId) => marriages.some((union) => union.spouse1Id === childId || union.spouse2Id === childId));
    if (!bridge) return children;
    const ownUnion = marriages.find((union) => union.spouse1Id === bridge || union.spouse2Id === bridge);
    const others = children.filter((id) => id !== bridge);
    return ownUnion?.spouse1Id === bridge ? [...others, bridge] : [bridge, ...others];
  }

  function place(id: string, left: number, depth: number): { x: number; y: number } | null {
    const person = byId.get(id);
    const generation = generationById.get(id) ?? depth;
    if (!person || generation > maxDepth) return null;
    if (placed.has(id)) {
      const node = nodes.find((item) => item.person.id === id);
      return node ? { x: node.x, y: node.y } : null;
    }
    const width = measure(id, depth);
    const y = 56 + generation * ROW;
    const households = householdsOf(id);

    if (households.length === 0) {
      const x = left + width / 2;
      nodes.push({ person, x, y, depth: generation });
      placed.add(id);
      placeChildren(looseKids(id), left, width, depth + 1);
      return { x, y };
    }

    // A person can have children whose other parent is unknown as well as
    // children assigned to unions. Reserve an independent column for each;
    // previously the unassigned branch disappeared as soon as a union existed.
    const loose = looseKids(id);
    if (mixedHouseholds(id, households)) {
      const ownWidth = childrenWidth(loose, depth + 1);
      const columns = households.map(household => measureColumn(household, depth));
      const ownLeft = households.length === 2 ? left + columns[0] + GAP : left;
      const anchorX = ownLeft + ownWidth / 2;
      nodes.push({ person, x: anchorX, y, depth: generation });
      placed.add(id);
      let columnLeft = households.length === 2 ? left : ownLeft + ownWidth + GAP;
      households.forEach((marriage, index) => {
        if (households.length === 2 && index === 1) columnLeft = ownLeft + ownWidth + GAP;
        const spouse = byId.get(marriage.spouse2Id)!;
        if (!placed.has(spouse.id)) {
          nodes.push({ person: spouse, x: columnLeft + columns[index] / 2, y, depth: generationById.get(spouse.id) ?? generation });
          placed.add(spouse.id);
        }
        const spouseChildren = looseKids(spouse.id);
        const unionWidth = spouseChildren.length ? childrenWidth(kidsOf(marriage), depth + 1) : columns[index];
        placeChildren(familyOrderedChildren(id, marriage), columnLeft, unionWidth, depth + 1);
        if (spouseChildren.length) placeChildren(spouseChildren, columnLeft + unionWidth + GAP, childrenWidth(spouseChildren, depth + 1), depth + 1);
        columnLeft += columns[index] + GAP;
      });
      placeChildren(loose, ownLeft, ownWidth, depth + 1);
      return { x: anchorX, y };
    }

    if (households.length === 1) {
      const marriage = households[0];
      const spouse = byId.get(marriage.spouse2Id)!;
      const pair = CARD_W * 2 + 20;
      const pairLeft = left + (width - pair) / 2;
      const anchorX = pairLeft + CARD_W / 2;
      const spouseX = pairLeft + CARD_W + 20 + CARD_W / 2;
      nodes.push({ person, x: anchorX, y, depth: generation });
      placed.add(id);
      if (!placed.has(spouse.id)) {
        nodes.push({ person: spouse, x: spouseX, y, depth: generationById.get(spouse.id) ?? generation });
        placed.add(spouse.id);
      }
      placeChildren(familyOrderedChildren(id, marriage), left, width, depth + 1);
      return { x: anchorX, y };
    }

    const columns = households.map((household) => measureColumn(household, depth));
    let anchorX = left + CARD_W / 2;
    const wifeSlots: { marriage: Marriage; left: number; width: number }[] = [];

    if (households.length === 2) {
      const firstLeft = left;
      anchorX = left + columns[0] + GAP + CARD_W / 2;
      wifeSlots.push(
        { marriage: households[0], left: firstLeft, width: columns[0] },
        { marriage: households[1], left: anchorX + CARD_W / 2 + GAP, width: columns[1] }
      );
    } else {
      let cursor = left + CARD_W + GAP;
      households.forEach((household, index) => {
        wifeSlots.push({ marriage: household, left: cursor, width: columns[index] });
        cursor += columns[index] + GAP;
      });
    }

    nodes.push({ person, x: anchorX, y, depth: generation });
    placed.add(id);

    wifeSlots.forEach((slot) => {
      const spouse = byId.get(slot.marriage.spouse2Id);
      if (!spouse) return;
      const spouseX = slot.left + CARD_W / 2;
      if (!placed.has(spouse.id)) {
        nodes.push({ person: spouse, x: spouseX, y, depth: generationById.get(spouse.id) ?? generation });
        placed.add(spouse.id);
      }
      placeChildren(familyOrderedChildren(id, slot.marriage), slot.left, slot.width, depth + 1);
    });

    return { x: anchorX, y };
  }

  const childIds = new Set([
    ...marriages.flatMap((marriage) => marriage.childrenIds ?? []),
    ...people.flatMap((person) => person.childrenIds ?? []),
  ]);
  const secondarySpouses = new Set(
    marriages
      .map((marriage) => marriage.spouse2Id)
      .filter((id) => !childIds.has(id) && !marriages.some((marriage) => marriage.spouse1Id === id))
  );
  const roots = people.filter((person) => !childIds.has(person.id) && !secondarySpouses.has(person.id));
  let rootList = roots.length ? roots : people.slice(0, 1);
  const rootIndex = new Map(rootList.map((root, index) => [root.id, index]));
  const ancestryRoots = (id: string) => {
    const found = new Set<string>();
    const visited = new Set<string>();
    const queue = [id];
    while (queue.length) {
      const current = queue.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      if (rootIndex.has(current)) { found.add(current); continue; }
      const parents = byId.get(current)?.parentIds.filter(parent => byId.has(parent)) ?? [];
      if (parents.length) queue.push(...parents);
      else marriages.filter(union => union.spouse2Id === current).forEach(union => queue.push(union.spouse1Id));
    }
    return found;
  };
  for (const root of rootList) {
    const households = householdsOf(root.id);
    if (households.length < 2) continue;
    for (const household of households) {
      const descendants = descendantsByUnion.get(household.id)!;
      const external = new Set<string>();
      marriages.forEach(union => {
        const other = descendants.has(union.spouse1Id) && !descendants.has(union.spouse2Id) ? union.spouse2Id
          : descendants.has(union.spouse2Id) && !descendants.has(union.spouse1Id) ? union.spouse1Id : null;
        if (other && byId.get(other)?.parentIds.some(id => byId.has(id))) {
          ancestryRoots(other).forEach(id => { if (id !== root.id) external.add(id); });
        }
      });
      bridgeRoots.set(household.id, external);
    }
    const neighbours = households.flatMap(household => [...(bridgeRoots.get(household.id) ?? [])]);
    if (neighbours.length) {
      const average = neighbours.reduce((sum, id) => sum + rootIndex.get(id)!, 0) / neighbours.length;
      principalSide.set(root.id, average < rootIndex.get(root.id)! ? -1 : 1);
    }
  }
  // When the largest branch changes, move the other ancestry to the boundary
  // used by its actual bridge child, rather than stretching through a co-wife.
  const before = new Map(rootList.map(root => [root.id, new Set<string>()]));
  const reaches = (from: string, target: string, visited = new Set<string>()): boolean => {
    if (from === target) return true;
    if (visited.has(from)) return false;
    visited.add(from);
    return [...(before.get(from) ?? [])].some(id => reaches(id, target, visited));
  };
  const rootLinks: { left: string; right: string; weight: number }[] = [];
  for (const root of rootList) {
    const households = householdsOf(root.id);
    if (households.length < 2) continue;
    households.forEach((household, index) => {
      const side = index < households.length / 2 ? -1 : 1;
      bridgeRoots.get(household.id)?.forEach(other => rootLinks.push({
        left: side < 0 ? other : root.id, right: side < 0 ? root.id : other,
        weight: descendantsByUnion.get(household.id)?.size ?? 0,
      }));
    });
  }
  rootLinks.sort((a, b) => b.weight - a.weight || a.left.localeCompare(b.left) || a.right.localeCompare(b.right)).forEach(link => {
    if (!reaches(link.right, link.left)) before.get(link.left)?.add(link.right);
  });
  const pendingRoots = new Set(rootList.map(root => root.id));
  const orderedRoots: Person[] = [];
  while (pendingRoots.size) {
    const next = rootList.find(root => pendingRoots.has(root.id) && ![...pendingRoots].some(id => before.get(id)?.has(root.id)));
    if (!next) break;
    orderedRoots.push(next);
    pendingRoots.delete(next.id);
  }
  if (orderedRoots.length === rootList.length) rootList = orderedRoots;

  let cursor = 48;
  rootList.forEach((root) => {
    const positionedChild = (root.childrenIds ?? [])
      .map((childId) => nodes.find((node) => node.person.id === childId))
      .find((node): node is BandNode => Boolean(node));
    if (positionedChild) {
      const union = marriages.find((marriage) => marriage.spouse1Id === positionedChild.person.id || marriage.spouse2Id === positionedChild.person.id);
      const partnerId = union?.spouse1Id === positionedChild.person.id ? union.spouse2Id : union?.spouse1Id;
      const partner = nodes.find((node) => node.person.id === partnerId);
      rootHints.set(root.id, { childId: positionedChild.person.id, side: partner && positionedChild.x < partner.x ? -1 : 1 });
    }
    const width = measure(root.id, 0);
    const hint = rootHints.get(root.id);
    const child = hint ? nodes.find((node) => node.person.id === hint.childId) : null;
    const left = !hint || !child
      ? cursor
      : hint.side === 1
        ? child.x - CARD_W / 2
        : child.x - width + CARD_W / 2;
    place(root.id, left, 0);
    cursor = Math.max(cursor, left + width + GAP * 2);
  });

  people.forEach((person) => {
    if (!placed.has(person.id) && !childIds.has(person.id)) {
      const depth = generationById.get(person.id) ?? 0;
      if (depth > maxDepth) return;
      const y = 56 + depth * ROW;
      nodes.push({ person, x: cursor + CARD_W / 2, y, depth });
      placed.add(person.id);
      cursor += CARD_W + GAP;
    }
  });

  // Converging ancestries can reserve the same space on a generation. Keep the
  // family order but expand the row before deriving any connection coordinates.
  const rows = new Map<number, BandNode[]>();
  nodes.forEach((node) => {
    const row = rows.get(node.depth) ?? [];
    row.push(node);
    rows.set(node.depth, row);
  });
  const nodeById = new Map(nodes.map(node => [node.person.id, node]));
  [...rows.entries()].sort(([a], [b]) => a - b).forEach(([, row]) => {
    row.sort((a, b) => a.x - b.x);
    // Keep a household's partners together. Aligning a second ancestry to an
    // already placed child must not insert its parents between two partners.
    // Partners with their own ancestry retain that family's boundary instead.
    const groups = new Map(row.map(node => [node.person.id, node.person.id]));
    const groupOf = (id: string): string => {
      const parent = groups.get(id)!;
      if (parent === id) return id;
      const root = groupOf(parent);
      groups.set(id, root);
      return root;
    };
    for (const union of marriages) {
      if (!groups.has(union.spouse1Id) || !groups.has(union.spouse2Id)) continue;
      const first = byId.get(union.spouse1Id)!;
      const second = byId.get(union.spouse2Id)!;
      if (first.parentIds.some(id => byId.has(id)) && second.parentIds.some(id => byId.has(id))) continue;
      groups.set(groupOf(second.id), groupOf(first.id));
    }
    const blocks = new Map<string, BandNode[]>();
    row.forEach(node => {
      const key = groupOf(node.person.id);
      const block = blocks.get(key) ?? [];
      block.push(node);
      blocks.set(key, block);
    });
    const ordered = [...blocks.values()].flat();
    if (ordered.some((node, index) => row[index] !== node)) {
      blocks.forEach(block => {
        const start = block[0].x;
        block.forEach((node, index) => { node.x = start + index * (CARD_W + 20); });
      });
      row.splice(0, row.length, ...ordered);
    }
    const originalCenter = row.reduce((sum, node) => sum + node.x, 0) / row.length;
    for (let index = 1; index < row.length; index += 1) {
      row[index].x = Math.max(row[index].x, row[index - 1].x + CARD_W);
    }
    const offset = row.reduce((sum, node) => sum + node.x, 0) / row.length - originalCenter;
    row.forEach((node) => { node.x -= offset; });

    // A bridge couple must be adjacent at the boundary of its two families.
    // Choosing a side from spouse1/spouse2 alone fails when an archive or an
    // assistant round trip reverses the couple, or changes the order of roots.
    const partners = new Map(row.map(node => [node.person.id, node.person.id]));
    const partnerGroup = (id: string): string => {
      const parent = partners.get(id)!;
      if (parent === id) return id;
      const root = partnerGroup(parent);
      partners.set(id, root);
      return root;
    };
    for (const union of marriages) {
      if (partners.has(union.spouse1Id) && partners.has(union.spouse2Id)) {
        partners.set(partnerGroup(union.spouse2Id), partnerGroup(union.spouse1Id));
      }
    }
    const couples = new Map<string, BandNode[]>();
    row.forEach(node => {
      const key = partnerGroup(node.person.id);
      const unit = couples.get(key) ?? [];
      unit.push(node);
      couples.set(key, unit);
    });
    const siblingGroups = new Map<string, BandNode[]>();
    row.forEach(node => {
      const parents = node.person.parentIds.filter(id => byId.has(id)).sort();
      if (!parents.length) return;
      const key = JSON.stringify(parents);
      const siblings = siblingGroups.get(key) ?? [];
      siblings.push(node);
      siblingGroups.set(key, siblings);
    });
    const constraints = [
      ...blocks.values(), ...couples.values(),
      ...[...siblingGroups.values()].filter(siblings => siblings.length > 1).map(siblings =>
        siblings.flatMap(sibling => blocks.get(groupOf(sibling.person.id)) ?? [sibling])),
    ].map(members => new Set(members.map(member => member.person.id))).filter(members => members.size > 1);
    const violations = (order: BandNode[]) => {
      const indices = new Map(order.map((node, index) => [node.person.id, index]));
      let count = constraints.reduce((count, members) => {
        const positions = [...members].map(id => indices.get(id)!);
        return count + Math.max(...positions) - Math.min(...positions) + 1 - members.size;
      }, 0);
      // Half-sibling branches must follow their own parental columns, even if
      // one branch currently contains just one child (for example Léon).
      for (const owner of people) {
        const households = householdsOf(owner.id).filter(union => nodeById.has(union.spouse2Id));
        for (let first = 0; first < households.length; first++) for (let second = first + 1; second < households.length; second++) {
          const a = households[first], b = households[second];
          const da = descendantsByUnion.get(a.id)!, db = descendantsByUnion.get(b.id)!;
          const ia = order.filter(node => da.has(node.person.id) && !db.has(node.person.id)).map(node => indices.get(node.person.id)!);
          const ib = order.filter(node => db.has(node.person.id) && !da.has(node.person.id)).map(node => indices.get(node.person.id)!);
          if (!ia.length || !ib.length) continue;
          const leftFirst = nodeById.get(a.spouse2Id)!.x < nodeById.get(b.spouse2Id)!.x;
          count += leftFirst ? ia.filter(index => index > Math.min(...ib)).length + ib.filter(index => index < Math.max(...ia)).length
            : ib.filter(index => index > Math.min(...ia)).length + ia.filter(index => index < Math.max(...ib)).length;
        }
      }
      return count;
    };
    const crossedSiblingFamilies = (order: BandNode[]) => {
      const indices = new Map(order.map((node, index) => [node.person.id, index]));
      return marriages.reduce((count, union) => {
        const children = kidsOf(union).filter(id => indices.has(id));
        if (children.length < 2) return count;
        const related = new Set(children.flatMap(id => [id, ...(byId.get(id)?.spouseIds ?? [])]));
        const positions = children.map(id => indices.get(id)!);
        return count + order.slice(Math.min(...positions), Math.max(...positions) + 1).filter(node => !related.has(node.person.id)).length;
      }, 0);
    };
    if (violations(row) > 0) {
      const ancestryCenter = (members: BandNode[]) => {
        const parents = [...new Set(members.flatMap(member => member.person.parentIds))]
          .map(id => nodeById.get(id)).filter((parent): parent is BandNode => Boolean(parent));
        return parents.length ? parents.reduce((sum, parent) => sum + parent.x, 0) / parents.length
          : members.reduce((sum, member) => sum + member.x, 0) / members.length;
      };
      const candidate = [...couples.values()].sort((a, b) => ancestryCenter(a) - ancestryCenter(b)).flatMap(unit => {
        const inner = new Map<string, BandNode[]>();
        unit.forEach(node => {
          const key = groupOf(node.person.id);
          const group = inner.get(key) ?? [];
          group.push(node);
          inner.set(key, group);
        });
        return [...inner.values()].sort((a, b) => ancestryCenter(a) - ancestryCenter(b)).flat();
      });
      if (violations(candidate) < violations(row) && crossedSiblingFamilies(candidate) <= crossedSiblingFamilies(row)) {
        const slots = row.map(node => node.x);
        candidate.forEach((node, index) => { node.x = slots[index]; });
        row.splice(0, row.length, ...candidate);
      }
    }
  });

  // A spouse may already have been placed by their own ancestry. Rebuild links
  // from the final nodes instead of the unused slot reserved by another branch.
  const positioned = new Map(nodes.map((node) => [node.person.id, node]));
  people.forEach((person) => {
    const anchor = positioned.get(person.id);
    if (!anchor) return;
    const households = householdsOf(person.id).filter((union) => positioned.has(union.spouse2Id));
    const rail = households.length > 1 || (households.length > 0 && mixedHouseholds(person.id, households));
    if (rail) {
      const xs = [anchor.x, ...households.map((union) => positioned.get(union.spouse2Id)!.x)];
      unions.push({ x1: Math.min(...xs), x2: Math.max(...xs), y: anchor.y + 100, rail: true, ticks: xs.map((x) => ({ x })) });
    }
    households.forEach((union) => {
      const spouse = positioned.get(union.spouse2Id)!;
      if (!rail) {
        unions.push({ x1: Math.min(anchor.x, spouse.x) + 28, x2: Math.max(anchor.x, spouse.x) - 28, y: anchor.y, rail: false, ticks: [] });
      }
      const children = kidsOf(union).map((id) => positioned.get(id)).filter((node): node is BandNode => Boolean(node));
      if (children.length) drops.push(childStem(rail ? spouse.x : (anchor.x + spouse.x) / 2, anchor.y + (rail ? 100 : 0), children));
    });
    const loose = looseKids(person.id).map((id) => positioned.get(id)).filter((node): node is BandNode => Boolean(node));
    if (loose.length) drops.push(childStem(anchor.x, anchor.y + 36, loose));
  });

  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);
  const minX = Math.min(48, ...xs) - 70;
  const minY = Math.min(20, ...ys) - 50;
  const maxX = Math.max(...xs, 0) + 90;
  const maxY = Math.max(...ys, 0) + 90;

  return {
    nodes,
    unions,
    drops,
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function familyGenerationCount(people: Person[], marriages: Marriage[]): number {
  return Math.max(0, ...calculateGenerations(people, parentalHouseholds(people, marriages)).values()) + 1;
}

function calculateGenerations(people: Person[], marriages: Marriage[]): Map<string, number> {
  const generations = new Map(people.map((person) => [person.id, 0]));
  const known = new Set(generations.keys());
  const limit = Math.max(1, people.length * 2);

  for (let pass = 0; pass < limit; pass += 1) {
    let changed = false;
    const raise = (id: string, level: number) => {
      if (!known.has(id) || (generations.get(id) ?? 0) >= level) return;
      generations.set(id, level);
      changed = true;
    };

    people.forEach((person) => {
      person.parentIds.forEach((parentId) => raise(person.id, (generations.get(parentId) ?? 0) + 1));
    });
    marriages.forEach((marriage) => {
      const spouseLevel = Math.max(generations.get(marriage.spouse1Id) ?? 0, generations.get(marriage.spouse2Id) ?? 0);
      raise(marriage.spouse1Id, spouseLevel);
      raise(marriage.spouse2Id, spouseLevel);
      (marriage.childrenIds ?? []).forEach((childId) => raise(childId, spouseLevel + 1));
    });
    if (!changed) break;
  }

  return generations;
}

function childStem(originX: number, originY: number, children: { x: number; y: number }[]) {
  const barY = children[0].y - 48;
  const xs = children.map((child) => child.x);
  return {
    x1: originX,
    y1: originY,
    x2: originX,
    y2: barY,
    barY,
    drops: children.map((child) => ({ x: child.x, y: child.y - 28 })),
    span: { x1: Math.min(originX, ...xs), x2: Math.max(originX, ...xs) },
  };
}
