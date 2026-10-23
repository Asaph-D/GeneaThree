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

export function layoutBands(people: Person[], marriages: Marriage[], maxGenerations: number): BandLayout {
  const byId = new Map(people.map((person) => [person.id, person]));
  const maxDepth = Math.max(0, maxGenerations - 1);
  const nodes: BandNode[] = [];
  const unions: BandUnion[] = [];
  const drops: BandDrop[] = [];
  const placed = new Set<string>();

  const householdsOf = (id: string) =>
    marriages
      .filter((marriage) => marriage.spouse1Id === id && byId.has(marriage.spouse2Id))
      .slice()
      .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  const kidsOf = (marriage: Marriage) =>
    (marriage.childrenIds ?? []).filter((id) => byId.has(id));

  const measuring = new Set<string>();

  const marriedChildren = new Set(marriages.flatMap((marriage) => marriage.childrenIds ?? []));

  function looseKids(id: string): string[] {
    const person = byId.get(id);
    if (!person) return [];
    return (person.childrenIds ?? []).filter((childId) => byId.has(childId) && !marriedChildren.has(childId));
  }

  function measure(id: string, depth: number): number {
    if (!byId.has(id) || depth > maxDepth || measuring.has(id)) return CARD_W;
    const households = householdsOf(id);
    if (depth === maxDepth) return CARD_W;
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
    if (households.length === 1) {
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
    if (depth + 1 > maxDepth || children.length === 0) return CARD_W;
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

  function place(id: string, left: number, depth: number): { x: number; y: number } | null {
    const person = byId.get(id);
    if (!person || depth > maxDepth) return null;
    if (placed.has(id)) {
      const node = nodes.find((item) => item.person.id === id);
      return node ? { x: node.x, y: node.y } : null;
    }
    const width = measure(id, depth);
    const y = 56 + depth * ROW;
    const households = depth === maxDepth ? [] : householdsOf(id);

    if (households.length === 0) {
      const x = left + width / 2;
      nodes.push({ person, x, y, depth });
      placed.add(id);
      const centers = placeChildren(looseKids(id), left, width, depth + 1);
      if (centers.length) drops.push(childStem(x, y + 36, centers));
      return { x, y };
    }

    if (households.length === 1) {
      const marriage = households[0];
      const spouse = byId.get(marriage.spouse2Id)!;
      const pair = CARD_W * 2 + 20;
      const pairLeft = left + (width - pair) / 2;
      const anchorX = pairLeft + CARD_W / 2;
      const spouseX = pairLeft + CARD_W + 20 + CARD_W / 2;
      nodes.push({ person, x: anchorX, y, depth });
      placed.add(id);
      if (!placed.has(spouse.id)) {
        nodes.push({ person: spouse, x: spouseX, y, depth });
        placed.add(spouse.id);
      }
      unions.push({ x1: anchorX + 28, x2: spouseX - 28, y, rail: false, ticks: [] });
      const childCenters = placeChildren(kidsOf(marriage), left, width, depth + 1);
      if (childCenters.length) {
        drops.push(childStem((anchorX + spouseX) / 2, y, childCenters));
      }
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

    nodes.push({ person, x: anchorX, y, depth });
    placed.add(id);

    const wifeCenters: number[] = [];
    wifeSlots.forEach((slot) => {
      const spouse = byId.get(slot.marriage.spouse2Id);
      if (!spouse) return;
      const spouseX = slot.left + CARD_W / 2;
      wifeCenters.push(spouseX);
      if (!placed.has(spouse.id)) {
        nodes.push({ person: spouse, x: spouseX, y, depth });
        placed.add(spouse.id);
      }
      const childCenters = placeChildren(kidsOf(slot.marriage), slot.left, slot.width, depth + 1);
      if (childCenters.length) {
        drops.push(childStem(spouseX, y + 100, childCenters));
      }
    });
    if (wifeCenters.length) {
      const railY = y + 100;
      unions.push({
        x1: Math.min(anchorX, ...wifeCenters),
        x2: Math.max(anchorX, ...wifeCenters),
        y: railY,
        rail: true,
        ticks: [{ x: anchorX }, ...wifeCenters.map((x) => ({ x }))],
      });
    }

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
  const rootList = roots.length ? roots : people.slice(0, 1);

  let cursor = 48;
  rootList.forEach((root) => {
    const width = measure(root.id, 0);
    place(root.id, cursor, 0);
    cursor += width + GAP * 2;
  });

  people.forEach((person) => {
    if (!placed.has(person.id) && !childIds.has(person.id)) {
      const y = 56;
      nodes.push({ person, x: cursor + CARD_W / 2, y, depth: 0 });
      placed.add(person.id);
      cursor += CARD_W + GAP;
    }
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
