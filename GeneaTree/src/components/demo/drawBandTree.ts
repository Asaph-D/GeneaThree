import * as d3 from 'd3';
import { Marriage, Person } from '../../types/family';
import { BandLayout, layoutBands } from './bandLayout';

function usablePhoto(url?: string): boolean {
  if (!url) return false;
  if (url.includes('example.com')) return false;
  return url.startsWith('http') || url.startsWith('data:') || url.startsWith('/');
}

function letter(person: Person): string {
  const source = (person.firstName || person.lastName || '').trim();
  return source ? source.charAt(0).toUpperCase() : '·';
}

function displayFirst(person: Person): string {
  return person.firstName?.trim() || 'Sans nom';
}

export function drawBandTree(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  people: Person[],
  marriages: Marriage[],
  maxGenerations: number,
  focusId: string,
  dark: boolean,
  onSelect: (person: Person, rect: DOMRect) => void,
  onContextMenu?: (person: Person, event: MouseEvent) => void,
  onHover?: (person: Person, rect: DOMRect) => void,
  onHoverEnd?: () => void,
  onToggleCollapse?: (person: Person) => void,
  previousPositions: Map<string, { x: number; y: number }> = new Map()
): BandLayout {
  const layout = layoutBands(people, marriages, maxGenerations);
  const ink = dark ? '#e7e5e4' : '#1c1917';
  const muted = dark ? '#a8a29e' : '#57534e';
  const line = dark ? '#d6d3d1' : '#44403c';

  const depthLabels = [...new Set(layout.nodes.map((node) => node.depth))];
  depthLabels.forEach((depth) => {
    const y = layout.nodes.find((node) => node.depth === depth)?.y ?? 0;
    g.append('text')
      .attr('x', layout.minX + 8)
      .attr('y', y)
      .attr('fill', muted)
      .attr('font-size', 11)
      .attr('font-family', 'Inter, sans-serif')
      .text(`G${depth}`);
  });

  const linkGroup = g.append('g').attr('class', 'links');
  const defs = linkGroup.append('defs');
  const paper = dark ? '#09090b' : '#f4f1ea';
  const joints: { x: number; y: number }[] = [];

  const fadeToward = (id: string, x1: number, y1: number, x2: number, y2: number) => {
    const gradient = defs.append('linearGradient')
      .attr('id', id)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2);
    gradient.append('stop').attr('offset', '0%').attr('stop-color', line).attr('stop-opacity', 1);
    gradient.append('stop').attr('offset', '58%').attr('stop-color', line).attr('stop-opacity', 0.9);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', line).attr('stop-opacity', 0);
    return `url(#${id})`;
  };

  const fadeBothEnds = (id: string, x1: number, y1: number, x2: number, y2: number) => {
    const gradient = defs.append('linearGradient')
      .attr('id', id)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2);
    gradient.append('stop').attr('offset', '0%').attr('stop-color', line).attr('stop-opacity', 0);
    gradient.append('stop').attr('offset', '24%').attr('stop-color', line).attr('stop-opacity', 1);
    gradient.append('stop').attr('offset', '76%').attr('stop-color', line).attr('stop-opacity', 1);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', line).attr('stop-opacity', 0);
    return `url(#${id})`;
  };

  layout.unions.forEach((union, index) => {
    if (union.rail) {
      const xs = [...new Set(union.ticks.map((tick) => tick.x))].sort((a, b) => a - b);
      xs.forEach((x, tickIndex) => {
        if (tickIndex < xs.length - 1) {
          const next = xs[tickIndex + 1];
          linkGroup.append('line')
            .attr('x1', x)
            .attr('x2', next)
            .attr('y1', union.y)
            .attr('y2', union.y)
            .attr('stroke', fadeBothEnds(`rail-joint-${index}-${tickIndex}`, x, union.y, next, union.y))
            .attr('stroke-width', 1.5)
            .attr('class', 'link');
        }
        linkGroup.append('line')
          .attr('x1', x)
          .attr('x2', x)
          .attr('y1', union.y - 42)
          .attr('y2', union.y)
          .attr('stroke', fadeToward(`tick-joint-${index}-${tickIndex}`, x, union.y - 42, x, union.y))
          .attr('stroke-width', 1.5)
          .attr('class', 'link');
        joints.push({ x, y: union.y });
      });
      return;
    }
    const mid = (union.x1 + union.x2) / 2;
    linkGroup.append('line')
      .attr('x1', union.x1)
      .attr('x2', mid)
      .attr('y1', union.y)
      .attr('y2', union.y)
      .attr('stroke', fadeToward(`union-left-${index}`, union.x1, union.y, mid, union.y))
      .attr('stroke-width', 1.5)
      .attr('class', 'link');
    linkGroup.append('line')
      .attr('x1', union.x2)
      .attr('x2', mid)
      .attr('y1', union.y)
      .attr('y2', union.y)
      .attr('stroke', fadeToward(`union-right-${index}`, union.x2, union.y, mid, union.y))
      .attr('stroke-width', 1.5)
      .attr('class', 'link');
    joints.push({ x: mid, y: union.y });
  });

  layout.drops.forEach((drop, index) => {
    linkGroup.append('line')
      .attr('x1', drop.x1)
      .attr('x2', drop.x1)
      .attr('y1', drop.y1)
      .attr('y2', drop.barY)
      .attr('stroke', fadeToward(`stem-joint-${index}`, drop.x1, drop.barY, drop.x1, drop.y1))
      .attr('stroke-width', 1.5)
      .attr('class', 'link');
    if (drop.span.x1 !== drop.span.x2) {
      linkGroup.append('line')
        .attr('x1', drop.span.x1)
        .attr('x2', drop.span.x2)
        .attr('y1', drop.barY)
        .attr('y2', drop.barY)
        .attr('stroke', line)
        .attr('stroke-width', 1.5)
        .attr('class', 'link');
    }
    drop.drops.forEach((child) => {
      linkGroup.append('line')
        .attr('x1', child.x)
        .attr('x2', child.x)
        .attr('y1', drop.barY)
        .attr('y2', child.y)
        .attr('stroke', line)
        .attr('stroke-width', 1.5)
        .attr('class', 'link');
    });
  });

  linkGroup.selectAll<SVGElement, unknown>('.link')
    .attr('vector-effect', 'non-scaling-stroke')
    .attr('stroke-linecap', 'round');

  joints.forEach(({ x, y }) => {
    const diamond = linkGroup.append('g')
      .attr('class', 'fusion-diamond')
      .attr('transform', `translate(${x},${y})`);
    diamond.append('rect')
      .attr('x', -6)
      .attr('y', -6)
      .attr('width', 12)
      .attr('height', 12)
      .attr('transform', 'rotate(45)')
      .attr('fill', paper)
      .attr('stroke', line)
      .attr('stroke-width', 1.35);
    diamond.append('rect')
      .attr('x', -2.6)
      .attr('y', -2.6)
      .attr('width', 5.2)
      .attr('height', 5.2)
      .attr('transform', 'rotate(45)')
      .attr('fill', 'none')
      .attr('stroke', line)
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 0.8);
  });

  const nodeGroup = g.append('g').attr('class', 'nodes');
  const cards = nodeGroup.selectAll('g.tree-node')
    .data(layout.nodes)
    .enter()
    .append('g')
    .attr('class', (node) => `tree-node node-${node.person.id}${node.person.relationship ? ` relationship-${node.person.relationship}` : ''}`)
    .attr('transform', (node) => {
      const previous = previousPositions.get(node.person.id);
      if (previous) return `translate(${previous.x},${previous.y})`;
      const related = [...node.person.parentIds, ...node.person.spouseIds, ...node.person.childrenIds]
        .map((id) => previousPositions.get(id))
        .filter((point): point is { x: number; y: number } => Boolean(point));
      const origin = related.length
        ? {
            x: related.reduce((sum, point) => sum + point.x, 0) / related.length,
            y: related.reduce((sum, point) => sum + point.y, 0) / related.length,
          }
        : { x: node.x, y: node.y };
      return `translate(${origin.x},${origin.y}) scale(0.2)`;
    })
    .style('opacity', (node) => previousPositions.has(node.person.id) ? 1 : 0)
    .style('cursor', 'pointer')
    .on('mousedown', function onNodePress(event, node) {
      event.stopPropagation();
      onSelect(node.person, this.getBoundingClientRect());
    })
    .on('contextmenu', (event, node) => {
      event.preventDefault();
      onContextMenu?.(node.person, event);
    })
    .on('dblclick', (event, node) => {
      event.stopPropagation();
      onToggleCollapse?.(node.person);
    })
    .on('mouseenter', function onNodeEnter(_event, node) {
      if (d3.select(this).classed('is-muted')) return;
      onHover?.(node.person, this.getBoundingClientRect());
    })
    .on('mouseleave', function onNodeLeave() {
      if (d3.select(this).classed('is-muted')) return;
      onHoverEnd?.();
    });

  cards.transition('layout')
    .duration(620)
    .ease(d3.easeCubicInOut)
    .attr('transform', (node) => `translate(${node.x},${node.y}) scale(1)`)
    .style('opacity', 1);

  cards.append('circle')
    .attr('r', 28)
    .attr('fill', (node) => node.person.gender === 'female' ? '#9f4454' : node.person.gender === 'male' ? '#2f5f86' : '#6b7280')
    .attr('stroke', (node) => node.person.id === focusId ? '#b45309' : 'transparent')
    .attr('stroke-width', 3);

  cards.each(function bindPortrait(node) {
    const card = d3.select(this);
    const person = node.person;
    if (usablePhoto(person.photoUrl)) {
      card.append('clipPath')
        .attr('id', `clip-${person.id}`)
        .append('circle')
        .attr('r', 26);
      card.append('image')
        .attr('class', 'node-portrait')
        .attr('href', person.photoUrl!)
        .attr('x', -26)
        .attr('y', -26)
        .attr('width', 52)
        .attr('height', 52)
        .attr('clip-path', `url(#clip-${person.id})`)
        .on('error', function onPhotoError() {
          d3.select(this).remove();
          card.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', '#ffffff')
            .attr('font-size', 18)
            .attr('font-family', 'Inter, sans-serif')
            .text(letter(person));
        });
      return;
    }
    card.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#ffffff')
      .attr('font-size', 18)
      .attr('font-weight', 600)
      .attr('font-family', 'Inter, sans-serif')
      .text(letter(person));
  });

  cards.append('text')
    .attr('class', 'node-first-name')
    .attr('text-anchor', 'middle')
    .attr('y', 46)
    .attr('fill', ink)
    .attr('font-size', 13)
    .attr('font-weight', 600)
    .attr('font-family', 'Inter, sans-serif')
    .text((node) => displayFirst(node.person));

  cards.append('text')
    .attr('class', 'node-secondary-detail')
    .attr('text-anchor', 'middle')
    .attr('y', 62)
    .attr('fill', ink)
    .attr('font-size', 12)
    .attr('font-family', 'Inter, sans-serif')
    .text((node) => node.person.lastName?.trim() || '');

  cards.filter((node) => Boolean(node.person.birthDate))
    .append('text')
    .attr('class', 'node-tertiary-detail')
    .attr('text-anchor', 'middle')
    .attr('y', 76)
    .attr('fill', muted)
    .attr('font-size', 10)
    .attr('font-family', 'Inter, sans-serif')
    .text((node) => {
      const year = new Date(node.person.birthDate).getFullYear();
      return Number.isNaN(year) ? '' : String(year);
    });

  if (layout.nodes.some((node) => !previousPositions.has(node.person.id))) {
    linkGroup.selectAll<SVGGeometryElement, unknown>('.link').each(function animateLink() {
      const length = this.getTotalLength?.() ?? 0;
      if (!length) return;
      d3.select(this)
        .attr('stroke-dasharray', `${length} ${length}`)
        .attr('stroke-dashoffset', length)
        .style('opacity', 0.25)
        .transition('link-draw')
        .duration(700)
        .ease(d3.easeCubicInOut)
        .attr('stroke-dashoffset', 0)
        .style('opacity', 1);
    });
  }

  return layout;
}
