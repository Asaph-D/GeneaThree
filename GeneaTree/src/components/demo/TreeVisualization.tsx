// src/components/tree/TreeVisualization.tsx
import * as d3 from 'd3';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ExtendedPerson, Marriage, Person } from '../../types/family';
import TreeContextMenu from './components/TreeContextMenu';
import TreeControls from './components/TreeControls';
import { genderColors, relationshipColors } from './constants';
import { drawBandTree } from './drawBandTree';
import { printStyles } from './styles';
import { formatRelationship, processFamilyData, relationToFocus } from './utils';

interface TreeNode extends d3.HierarchyNode<ExtendedPerson> {
  x0?: number;
  y0?: number;
  data: ExtendedPerson;
}

interface TreeVisualizationProps {
  viewType: string;
  generations: number;
  focusPerson: string;
  familyData: Person[];
  marriagesData: Marriage[];
  isEditMode?: boolean;
  onPersonSelect: (person: Person, rect?: DOMRect) => void;
  onAddPersonClick: (relatedPersonId: string, relationshipType: 'child' | 'parent' | 'spouse') => void;
  onDeletePerson: (personId: string) => void;
  onPersonHover?: (person: Person, rect: DOMRect) => void;
  onPersonHoverEnd?: () => void;
}

const TreeVisualization = forwardRef<HTMLDivElement, TreeVisualizationProps>(({
  viewType,
  generations,
  focusPerson,
  familyData,
  marriagesData,
  isEditMode = false,
  onPersonSelect,
  onAddPersonClick,
  onDeletePerson,
  onPersonHover,
  onPersonHoverEnd
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const fitKeyRef = useRef('');
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number, personId: string } | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const hoverRef = useRef(onPersonHover);
  const hoverEndRef = useRef(onPersonHoverEnd);
  const selectRef = useRef(onPersonSelect);
  const relationRef = useRef<string | null>(null);
  hoverRef.current = onPersonHover;
  hoverEndRef.current = onPersonHoverEnd;
  selectRef.current = onPersonSelect;
  relationRef.current = selectedRelationship;

  useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

  // Debug logs
  useEffect(() => {
    console.log("Family Data in TreeVisualization:", familyData);
    console.log("Focus Person:", focusPerson);
  }, [familyData, focusPerson]);

  const fitTree = useCallback(() => {
    const host = svgRef.current;
    const zoom = zoomRef.current;
    const content = gRef.current;
    if (!host || !zoom || !content) return;
    const box = content.getBBox();
    if (!box.width || !box.height) return;
    const svgW = host.clientWidth || host.parentElement?.clientWidth || 800;
    const svgH = host.clientHeight || host.parentElement?.clientHeight || 640;
    d3.select(host)
      .attr('width', svgW)
      .attr('height', svgH)
      .attr('viewBox', [0, 0, svgW, svgH]);
    const fit = Math.min((svgW - 48) / box.width, (svgH - 48) / box.height);
    const safeScale = Math.max(0.2, Math.min(0.8, fit));
    const tx = (svgW - box.width * safeScale) / 2 - box.x * safeScale;
    const ty = (svgH - box.height * safeScale) / 2 - box.y * safeScale;
    d3.select(host)
      .transition()
      .duration(450)
      .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(safeScale));
  }, []);

  const initializeTree = useCallback(() => {
    if (!containerRef.current || !svgRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 640;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('aria-label', 'Arbre généalogique');

    const g = svg.append('g');
    gRef.current = g.node();
    fitKeyRef.current = '';

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .clickDistance(8)
      .filter((event) => {
        const pointer = event as MouseEvent;
        const target = pointer.target as Element | null;
        if (pointer.type === 'mousedown' && target?.closest('.tree-node, .edit-indicator')) return false;
        return (!pointer.ctrlKey || pointer.type === 'wheel') && !pointer.button;
      })
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        if (gRef.current) {
          const content = d3.select(gRef.current).attr('transform', event.transform.toString());
          content.selectAll<SVGElement, unknown>('.node-portrait').style('display', event.transform.k < 0.42 ? 'none' : null);
          content.selectAll<SVGElement, unknown>('.node-secondary-detail').style('display', event.transform.k < 0.34 ? 'none' : null);
          content.selectAll<SVGElement, unknown>('.node-tertiary-detail').style('display', event.transform.k < 0.58 ? 'none' : null);
        }
      });

    svg.call(zoom);
    zoomRef.current = zoom;
  }, []);

  const updateTree = useCallback(() => {
    if (!svgRef.current || !gRef.current || !familyData?.length) {
      if (gRef.current) {
        d3.select(gRef.current).selectAll("*").remove();
      }
      return;
    }

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    g.selectAll("*").remove();
    svg.selectAll(".relationship-legend, .family-title, .watermark").remove();

    const personExists = familyData.some(p => p.id === focusPerson);
    const validFocusPerson = personExists ? focusPerson : familyData[0]?.id;

    if (!validFocusPerson) {
      console.error("No valid focus person found. familyData might be empty.");
      return;
    }

    const hidden = new Set<string>();
    const byId = new Map(familyData.map((person) => [person.id, person]));
    collapsedIds.forEach((id) => {
      const queue = [...(byId.get(id)?.childrenIds ?? [])];
      while (queue.length) {
        const childId = queue.shift()!;
        if (hidden.has(childId)) continue;
        hidden.add(childId);
        queue.push(...(byId.get(childId)?.childrenIds ?? []));
      }
    });
    const visibleFamily = familyData.filter((person) => !hidden.has(person.id));
    const visibleIds = new Set(visibleFamily.map((person) => person.id));
    const visibleMarriages = marriagesData
      .filter((marriage) => visibleIds.has(marriage.spouse1Id) && visibleIds.has(marriage.spouse2Id))
      .map((marriage) => ({ ...marriage, childrenIds: (marriage.childrenIds ?? []).filter((id) => visibleIds.has(id)) }));
    const focusRecord = visibleFamily.find((person) => person.id === validFocusPerson);
    const annotated = focusRecord
      ? visibleFamily.map((person) => ({
          ...person,
          relationship: relationToFocus(person, focusRecord, visibleFamily) as Person['relationship'],
        }))
      : visibleFamily;

    if (viewType === 'tree' || viewType === 'vertical') {
      const layout = drawBandTree(
        g,
        annotated,
        visibleMarriages,
        generations,
        validFocusPerson,
        document.body.classList.contains('dark'),
        (person, rect) => selectRef.current(person, rect),
        (person, event) => {
          if (isEditMode) {
            setContextMenuPosition({ x: event.pageX, y: event.pageY, personId: person.id });
          }
        },
        (person, rect) => hoverRef.current?.(person, rect),
        () => hoverEndRef.current?.(),
        (person) => setCollapsedIds((current) => {
          const next = new Set(current);
          if (next.has(person.id)) next.delete(person.id); else if (person.childrenIds.length) next.add(person.id);
          return next;
        })
      );
      const zoom = zoomRef.current;
      const host = svgRef.current;
      if (zoom && host && layout.nodes.length) {
        const svgW = host.clientWidth || 800;
        const svgH = host.clientHeight || 640;
        const fit = Math.min((svgW - 48) / Math.max(layout.width, 1), (svgH - 48) / Math.max(layout.height, 1));
        const safeScale = Math.max(0.2, Math.min(0.8, fit));
        const tx = (svgW - layout.width * safeScale) / 2 - layout.minX * safeScale;
        const ty = (svgH - layout.height * safeScale) / 2 - layout.minY * safeScale;
        const fitKey = `${viewType}|${generations}|${annotated.map((person) => person.id).join(',')}|${visibleMarriages.map((marriage) => marriage.id).join(',')}`;
        if (fitKeyRef.current !== fitKey) {
          fitKeyRef.current = fitKey;
          svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(safeScale));
        }
      }
      return;
    }

    let root: TreeNode;
    try {
      const processedData = processFamilyData(familyData, validFocusPerson, generations);
      root = d3.hierarchy(processedData) as unknown as TreeNode;
    } catch (error) {
      console.error("Error processing family data:", error);
      return;
    }

    const nodeRadius = 40;
    const nodeSpacingX = 200;
    const nodeSpacingY = 120;

    let treeLayout: d3.TreeLayout<ExtendedPerson>;
    switch (viewType) {
      case "radial":
        treeLayout = d3.tree<ExtendedPerson>()
          .size([2 * Math.PI, Math.min(svgRef.current?.clientWidth || 800, svgRef.current?.clientHeight || 600) / 3]);
        break;
      case "vertical":
        treeLayout = d3.tree<ExtendedPerson>()
          .nodeSize([nodeSpacingX, nodeSpacingY]);
        break;
      default: // "tree" (horizontal)
        treeLayout = d3.tree<ExtendedPerson>()
          .nodeSize([nodeSpacingY, nodeSpacingX]);
        break;
    }

    treeLayout(root);
    const nodes = root.descendants();
    const links = root.links();

    // Mise à jour du titre
    const currentFocusPersonObj = familyData.find(p => p.id === focusPerson);
    const newFamilyTitle = currentFocusPersonObj ? `Arbre généalogique - Famille ${currentFocusPersonObj.lastName || 'Inconnu'}` : "Arbre généalogique";
    svg.select(".family-title").text(newFamilyTitle);

    // Groupe des liens
    const linkGroup = g.append("g").attr("class", "links");

    linkGroup.selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d => {
        if (viewType === "radial") {
          const startAngle = d.source.x!;
          const startRadius = d.source.y!;
          const endAngle = d.target.x!;
          const endRadius = d.target.y!;
          const startX = Math.cos(startAngle - Math.PI / 2) * startRadius;
          const startY = Math.sin(startAngle - Math.PI / 2) * startRadius;
          const endX = Math.cos(endAngle - Math.PI / 2) * endRadius;
          const endY = Math.sin(endAngle - Math.PI / 2) * endRadius;
          return `M${startX},${startY}C${startX},${(startY + endY) / 2} ${endX},${(startY + endY) / 2} ${endX},${endY}`;
        } else if (viewType === "vertical") {
          const sx = d.source.x ?? 0;
          const sy = d.source.y ?? 0;
          const tx = d.target.x ?? 0;
          const ty = d.target.y ?? 0;
          return `M${sx},${sy}C${sx},${(sy + ty) / 2} ${tx},${(sy + ty) / 2} ${tx},${ty}`;
        } else {
          const sx = d.source.x ?? 0;
          const sy = d.source.y ?? 0;
          const tx = d.target.x ?? 0;
          const ty = d.target.y ?? 0;
          return `M${sx},${sy}C${(sx + tx) / 2},${sy} ${(sx + tx) / 2},${ty} ${tx},${ty}`;
        }
      })
      .attr("stroke", d => {
        const targetRel = d.target.data.relationship as keyof typeof relationshipColors;
        if (targetRel && relationshipColors[targetRel]) {
          return relationshipColors[targetRel];
        }
        return "#cbd5e0";
      })
      .attr("stroke-width", d => (d.target.data.id === focusPerson || d.source.data.id === focusPerson) ? 3 : 2)
      .attr("fill", "none")
      .attr("opacity", 0.8);

    // Liens de mariage
    marriagesData.forEach(marriage => {
      const spouse1Node = nodes.find(n => n.data.id === marriage.spouse1Id);
      const spouse2Node = nodes.find(n => n.data.id === marriage.spouse2Id);
      if (spouse1Node && spouse2Node) {
        let x1 = spouse1Node.x!, y1 = spouse1Node.y!;
        let x2 = spouse2Node.x!, y2 = spouse2Node.y!;
        if (viewType === "radial") {
          x1 = Math.cos(spouse1Node.x! - Math.PI / 2) * spouse1Node.y!;
          y1 = Math.sin(spouse1Node.x! - Math.PI / 2) * spouse1Node.y!;
          x2 = Math.cos(spouse2Node.x! - Math.PI / 2) * spouse2Node.y!;
          y2 = Math.sin(spouse2Node.x! - Math.PI / 2) * spouse2Node.y!;
        }
        linkGroup.append("line")
          .attr("x1", x1)
          .attr("y1", y1)
          .attr("x2", x2)
          .attr("y2", y2)
          .attr("stroke", relationshipColors.spouse)
          .attr("stroke-width", 3)
          .attr("stroke-dasharray", "8,4")
          .attr("class", `marriage-link marriage-${marriage.id} marriage-link-${marriage.spouse1Id} marriage-link-${marriage.spouse2Id}`)
          .attr("opacity", 0.9);
      }
    });

    // Groupe des nœuds
    const nodeGroup = g.append("g").attr("class", "nodes");

    const nodes_g = nodeGroup.selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", d => `tree-node node-${d.data.id}${d.data.relationship ? ` relationship-${d.data.relationship}` : ''}`)
      .attr("transform", d => {
        if (viewType === "radial") {
          const angle = d.x! - Math.PI / 2;
          const radius = d.y!;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          return `translate(${x},${y})`;
        } else {
          return `translate(${d.x},${d.y})`;
        }
      })
      .style("cursor", "pointer")
      .on("mousedown", function(event, d) {
        event.stopPropagation();
        setContextMenuPosition(null);
        const person = d.data as unknown as Person;
        selectRef.current(person, (this as SVGGElement).getBoundingClientRect());
        // Mise à jour visuelle pour la personne sélectionnée
        d3.selectAll(".tree-node")
          .classed("selected", false)
          .select(".selection-ring")
          .attr("opacity", 0);
        d3.select(this as SVGGElement)
          .classed("selected", true)
          .select(".selection-ring")
          .attr("opacity", 1);
      })
      .on("contextmenu", (event: MouseEvent, d: TreeNode) => {
        if (isEditMode && d.data.id) {
          event.preventDefault();
          event.stopPropagation();
          setContextMenuPosition({
            x: event.pageX,
            y: event.pageY,
            personId: d.data.id
          });
        }
      })
      .on("mouseover", function(this: SVGGElement, _event: MouseEvent, d: TreeNode) {
        if (d3.select(this).classed("is-muted")) return;
        hoverRef.current?.(d.data as unknown as Person, this.getBoundingClientRect());
        if (!gRef.current || relationRef.current) return;
        const nodeGroup = d3.select(gRef.current).select<SVGGElement>(".nodes");
        const linkGroup = d3.select(gRef.current).select<SVGGElement>(".links");
        // Atténuer tous les nœuds sauf ceux liés
        nodeGroup.selectAll<SVGGElement, TreeNode>(".tree-node")
          .style("opacity", 0.3);
        // Mettre en évidence le nœud survolé
        nodeGroup.select(`.node-${d.data.id}`)
          .style("opacity", 1);
        // Mettre en évidence les relations directes
        d.data.parentIds?.forEach(parentId => {
          nodeGroup.select(`.node-${parentId}`).style("opacity", 1);
        });
        d.data.childrenIds?.forEach(childId => {
          nodeGroup.select(`.node-${childId}`).style("opacity", 1);
        });
        d.data.spouseIds?.forEach(spouseId => {
          nodeGroup.select(`.node-${spouseId}`).style("opacity", 1);
        });
        // Atténuer les liens
        linkGroup.selectAll(".link").style("opacity", 0.2);
        linkGroup.selectAll(".marriage-link").style("opacity", 0.2);
        // Mettre en évidence les liens pertinents
        linkGroup.selectAll(`.marriage-link-${d.data.id}`).style("opacity", 1);
        // Afficher le tooltip
        d3.select("body").append("div")
          .attr("class", "tree-tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0, 0, 0, 0.9)")
          .style("color", "white")
          .style("padding", "8px 12px")
          .style("border-radius", "6px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("z-index", "1000")
          .style("opacity", 0)
          .html(`
            <div style="font-weight: bold; margin-bottom: 4px;">
              ${d.data.firstName || 'Inconnu'} ${d.data.lastName || ''}
            </div>
            ${d.data.birthDate ? `<div>Né${d.data.gender === 'female' ? 'e' : ''} en ${new Date(d.data.birthDate).getFullYear()}</div>` : ''}
            ${d.data.occupation ? `<div>${d.data.occupation}</div>` : ''}
            ${d.data.relationship ? `<div style="color: #94a3b8;">${formatRelationship(d.data.relationship)}</div>` : ''}
          `)
          .transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mousemove", function(event: MouseEvent) {
        if (d3.select(this).classed("is-muted")) return;
        d3.select(".tree-tooltip")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        if (d3.select(this).classed("is-muted")) return;
        hoverEndRef.current?.();
        if (!relationRef.current) {
          const nodeGroup = d3.select(gRef.current!).select<SVGGElement>(".nodes");
          const linkGroup = d3.select(gRef.current!).select<SVGGElement>(".links");
          nodeGroup.selectAll(".tree-node").style("opacity", 1);
          linkGroup.selectAll(".link").style("opacity", 0.8);
          linkGroup.selectAll(".marriage-link").style("opacity", 0.9);
        }
        d3.select(".tree-tooltip").remove();
      });

    // Anneau de sélection
    nodes_g.append("circle")
      .attr("class", "selection-ring")
      .attr("r", nodeRadius + 6)
      .attr("fill", "none")
      .attr("stroke", "#4f46e5")
      .attr("stroke-width", 3)
      .attr("opacity", 0)
      .attr("stroke-dasharray", "5,3");

    // Cercle principal du nœud (avec styles dynamiques)
    nodes_g.append("circle")
      .attr("r", nodeRadius)
      .attr("class", "node-circle")
      .attr("fill", d => {
        // Couleur de base selon le genre
        const baseColor = d.data.gender === "male" ? genderColors.male :
                          d.data.gender === "female" ? genderColors.female :
                          genderColors.unknown;
        // Couleur de la relation (si définie)
        const relColor = d.data.relationship ? relationshipColors[d.data.relationship as keyof typeof relationshipColors] : null;
        // Couleur finale : mélange ou priorité à la relation
        return relColor || baseColor;
      })
      .attr("stroke", d => {
        if (d.data.id === focusPerson) return "#2d3748";
        return d.data.relationship ? relationshipColors[d.data.relationship as keyof typeof relationshipColors] : "#4a5568";
      })
      .attr("stroke-width", d => d.data.id === focusPerson ? 4 : 2)
      .attr("opacity", d => d.data.deceased ? 0.7 : 1)
      .style("filter", d => d.data.id === focusPerson ? "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" : "none")
      // Nouveaux attributs pour les décorations
      .attr("stroke-dasharray", d => {
        // Bords pointillés pour les grands-parents et arrière-grands-parents
        if (d.data.relationship === "grandparent" || d.data.relationship === "great_grandparent") {
          return "4, 2";
        }
        return "none";
      })
      .attr("stroke-opacity", d => {
        // Opacité du bord pour les conjoints
        if (d.data.relationship === "spouse") {
          return 0.8;
        }
        return 1;
      });

    // Décorations spécifiques selon la catégorie
    nodes_g.each(function(d) {
      const node = d3.select(this);
      // 1. Bordure colorée pour les enfants et petits-enfants
      if (d.data.relationship === "child" || d.data.relationship === "grandchild") {
        node.insert("circle", ":first-child")
          .attr("r", nodeRadius + 2)
          .attr("fill", "none")
          .attr("stroke", relationshipColors[d.data.relationship as keyof typeof relationshipColors])
          .attr("stroke-width", 2)
          .attr("opacity", 0.7);
      }
      // 2. Étoile pour les conjoints
      if (d.data.relationship === "spouse") {
        node.append("path")
          .attr("d", "M0,-12L4,4L-12,0L4,-4Z") // Forme d'étoile
          .attr("transform", `translate(0, -${nodeRadius + 10})`)
          .attr("fill", relationshipColors.spouse)
          .attr("stroke", "white")
          .attr("stroke-width", 1);
      }
      // 3. Cadre arrondi pour les parents
      if (d.data.relationship === "parent") {
        node.insert("rect", ":first-child")
          .attr("x", -nodeRadius - 2)
          .attr("y", -nodeRadius - 2)
          .attr("width", nodeRadius * 2 + 4)
          .attr("height", nodeRadius * 2 + 4)
          .attr("rx", 8) // Coins arrondis
          .attr("fill", "none")
          .attr("stroke", relationshipColors.parent)
          .attr("stroke-width", 2);
      }
      // 4. Fond dégradé pour les frères/sœurs
      if (d.data.relationship === "sibling") {
        const gradientId = `gradient-sibling-${d.data.id}`;
        const defs = node.insert("defs", ":first-child");
        defs.append("linearGradient")
          .attr("id", gradientId)
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "100%")
          .selectAll("stop")
          .data([
            { offset: "0%", color: relationshipColors.sibling },
            { offset: "100%", color: d.data.gender === "male" ? genderColors.male : genderColors.female }
          ])
          .enter()
          .append("stop")
          .attr("offset", d => d.offset)
          .attr("stop-color", d => d.color);
        node.select(".node-circle")
          .attr("fill", `url(#${gradientId})`);
      }
      // 5. Indicateur de genre (icône ♂/♀)
      node.append("text")
        .attr("class", "gender-icon")
        .attr("x", nodeRadius - 12)
        .attr("y", -nodeRadius + 12)
        .attr("font-size", "12px")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .text(d => {
          if (d.data.gender === "male") return "♂";
          if (d.data.gender === "female") return "♀";
          return "";
        });
    });

    // Indicateur de décès
    nodes_g.filter(d => d.data.deceased)
      .append("path")
      .attr("d", `M${-nodeRadius * 0.7},${-nodeRadius * 0.7}L${nodeRadius * 0.7},${nodeRadius * 0.7}M${-nodeRadius * 0.7},${nodeRadius * 0.7}L${nodeRadius * 0.7},${-nodeRadius * 0.7}`)
      .attr("stroke", "#dc2626")
      .attr("stroke-width", 3)
      .attr("opacity", 0.8);

    // Clipping path pour les images
    nodes_g.append("clipPath")
      .attr("id", d => `clip-${d.data.id}`)
      .append("circle")
      .attr("r", nodeRadius - 2);

    // Images ou initiales
    nodes_g.each(function(d) {
      const node = d3.select(this);
      const person = d.data;
      const photo = person.photoUrl && !person.photoUrl.includes('example.com') ? person.photoUrl : '';
      if (photo) {
        node.append("image")
          .attr("href", photo)
          .attr("x", -nodeRadius + 2)
          .attr("y", -nodeRadius + 2)
          .attr("width", (nodeRadius - 2) * 2)
          .attr("height", (nodeRadius - 2) * 2)
          .attr("clip-path", `url(#clip-${person.id})`);
      } else {
        const source = (person.firstName || person.lastName || '').trim();
        const initials = source ? source.charAt(0).toUpperCase() : '·';
        node.append("text")
          .attr("class", "person-initials")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("font-size", "18px")
          .attr("font-weight", "600")
          .attr("fill", "#ffffff")
          .attr("font-family", "Inter, sans-serif")
          .text(initials.toUpperCase());
      }
    });

    // Nom complet sous le nœud
    nodes_g.append("text")
      .attr("class", "person-name")
      .attr("text-anchor", "middle")
      .attr("y", nodeRadius + 20)
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .attr("fill", document.body.classList.contains('dark') ? '#f8fafc' : '#1c1917')
      .attr("font-family", "Inter, sans-serif")
      .text(d => {
        console.log("Node data for name:", d.data); // Log pour vérifier les données du nœud
        const firstName = d.data.firstName || 'Inconnu';
        const lastName = d.data.lastName || '';
        return `${firstName} ${lastName}`.trim();
      })
      .style("text-shadow", "0 1px 2px rgba(255,255,255,0.8)");

    // Années de naissance/décès
    nodes_g.filter(d => d.data.birthDate)
      .append("text")
      .attr("class", "person-years")
      .attr("text-anchor", "middle")
      .attr("y", nodeRadius + 36)
      .attr("font-size", "11px")
      .attr("fill", "#718096")
      .attr("font-family", "Inter, sans-serif")
      .text(d => {
        try {
          const birthYear = new Date(d.data.birthDate).getFullYear();
          if (d.data.deathDate) {
            const deathYear = new Date(d.data.deathDate).getFullYear();
            return `(${birthYear} - ${deathYear})`;
          } else if (d.data.deceased) {
            return `(${birthYear} - †)`;
          }
          return `(${birthYear})`;
        } catch {
          return "(Date inconnue)";
        }
      });

    // Indicateur de relation
    nodes_g.filter(d => d.data.relationship && d.data.id !== focusPerson)
      .append("circle")
      .attr("class", "relationship-indicator")
      .attr("cx", nodeRadius - 10)
      .attr("cy", -nodeRadius + 10)
      .attr("r", 8)
      .attr("fill", d => relationshipColors[d.data.relationship as keyof typeof relationshipColors] || "#a0aec0")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2);

    nodes_g.filter(d => d.data.relationship && d.data.id !== focusPerson)
      .append("text")
      .attr("class", "relationship-text")
      .attr("x", nodeRadius - 10)
      .attr("y", -nodeRadius + 10)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", "8px")
      .attr("font-weight", "600")
      .attr("fill", "#ffffff")
      .text(d => {
        const rel = d.data.relationship;
        if (rel === 'parent') return 'P';
        if (rel === 'child') return 'E';
        if (rel === 'sibling') return 'F';
        if (rel === 'spouse') return 'C';
        if (rel === 'grandparent') return 'GP';
        if (rel === 'grandchild') return 'PE';
        return rel?.[0]?.toUpperCase() || '';
      });

    // Indicateurs d'édition
    if (isEditMode) {
      nodes_g.append("circle")
        .attr("class", "edit-indicator")
        .attr("cx", -nodeRadius + 10)
        .attr("cy", -nodeRadius + 10)
        .attr("r", 12)
        .attr("fill", "#10b981")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .attr("opacity", 0.9)
        .on("mousedown", function onEditPress(event, d) {
          event.stopPropagation();
          setContextMenuPosition(null);
          selectRef.current(d.data, this.getBoundingClientRect());
        });

      nodes_g.append("text")
        .attr("class", "edit-icon")
        .attr("x", -nodeRadius + 10)
        .attr("y", -nodeRadius + 10)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", "10px")
        .attr("fill", "#ffffff")
        .attr("pointer-events", "none")
        .text("✏");
    }

  }, [viewType, generations, focusPerson, familyData, marriagesData, isEditMode, collapsedIds]);

  useEffect(() => {
    initializeTree();
  }, [initializeTree]);

  useEffect(() => {
    if (containerRef.current && svgRef.current) {
      updateTree();
    }
  }, [viewType, generations, focusPerson, familyData, marriagesData, isEditMode, updateTree]);

  useEffect(() => {
    if (!document.getElementById('geneatree-print-styles')) {
      const style = document.createElement('style');
      style.id = 'geneatree-print-styles';
      style.innerHTML = printStyles;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const contextMenuElement = document.querySelector('.context-menu');
      if (contextMenuPosition && contextMenuElement && !contextMenuElement.contains(event.target as Node)) {
        setContextMenuPosition(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenuPosition]);

  useEffect(() => {
    playRelationFlow(selectedRelationship);
  }, [selectedRelationship, focusPerson, familyData, viewType, generations]);

  function playRelationFlow(relationship: string | null) {
    if (!gRef.current) return;
    const root = d3.select(gRef.current);
    const nodes = root.selectAll<SVGGElement, unknown>('.tree-node');
    const links = root.selectAll<SVGElement, unknown>('.link, .marriage-link');
    root.selectAll('.relation-flow').interrupt().remove();

    const active = new Set<string>([focusPerson]);
    if (relationship) {
      nodes.each(function collectActive() {
        if (this.classList.contains(`relationship-${relationship}`)) {
          const id = personIdFromNode(this);
          if (id) active.add(id);
        }
      });
    }

    nodes.interrupt().each(function markNode() {
      const id = personIdFromNode(this);
      const enabled = !relationship || active.has(id);
      d3.select(this)
        .classed('is-muted', !enabled)
        .style('pointer-events', enabled ? 'auto' : 'none')
        .style('cursor', enabled ? 'pointer' : 'default');
    });

    if (!relationship) {
      nodes.transition().duration(420).style('opacity', 1);
      links.transition().duration(420).style('opacity', 1);
      return;
    }

    nodes.each(function dimRest() {
      const id = personIdFromNode(this);
      const enabled = active.has(id);
      d3.select(this).transition().duration(280).style('opacity', id === focusPerson ? 1 : enabled ? 0.22 : 0.16);
    });
    links.transition().duration(280).style('opacity', 0.08);

    const focusEl = root.select<SVGGElement>(`.node-${focusPerson}`).node();
    if (!focusEl) return;
    const focusPoint = readTranslate(focusEl);
    const flow = root.insert('g', '.nodes').attr('class', 'relation-flow').style('pointer-events', 'none');
    const accent = document.body.classList.contains('dark') ? '#f6b455' : '#b45309';
    let order = 0;

    active.forEach((id) => {
      if (id === focusPerson) return;
      const targetEl = root.select<SVGGElement>(`.node-${id}`).node();
      if (!targetEl) return;
      const toCenter = readTranslate(targetEl);
      const from = pointOnCircle(focusPoint, toCenter, 32);
      const to = pointOnCircle(toCenter, focusPoint, 32);
      const description = relationPath(from, to);
      const path = flow.append('path')
        .attr('d', description)
        .attr('fill', 'none')
        .attr('stroke', accent)
        .attr('stroke-width', 2.25)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .node();
      if (!path) return;
      const length = path.getTotalLength();
      const delay = order * 110;
      order += 1;
      const head = flow.append('circle')
        .attr('r', 3.4)
        .attr('fill', accent)
        .attr('transform', `translate(${from.x},${from.y})`)
        .style('opacity', 0);
      d3.select(path)
        .attr('stroke-dasharray', `${length} ${length}`)
        .attr('stroke-dashoffset', length)
        .transition()
        .delay(delay)
        .duration(780)
        .ease(d3.easeCubicInOut)
        .attr('stroke-dashoffset', 0);
      head.transition()
        .delay(delay)
        .duration(780)
        .ease(d3.easeCubicInOut)
        .style('opacity', 1)
        .attrTween('transform', () => (time) => {
          const point = path.getPointAtLength(time * length);
          return `translate(${point.x},${point.y})`;
        })
        .on('end', () => {
          head.transition().duration(180).style('opacity', 0).remove();
          d3.select(targetEl).transition().duration(280).style('opacity', 1);
        });
    });
  }

  const handleAddRelation = (relationType: 'child' | 'parent' | 'spouse') => {
    if (contextMenuPosition && onAddPersonClick) {
      onAddPersonClick(contextMenuPosition.personId, relationType);
      setContextMenuPosition(null);
    }
  };

  const handleDeletePerson = () => {
    if (contextMenuPosition && onDeletePerson) {
      onDeletePerson(contextMenuPosition.personId);
      setContextMenuPosition(null);
    }
  };

  const handleRelationshipSelect = useCallback((relationship: string | null) => {
    setSelectedRelationship(relationship);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-0 w-full bg-[#f4f1ea] dark:bg-[#09090b]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_30%)]" />
      <svg
        ref={svgRef}
        className="absolute inset-0 z-0 h-full w-full"
      />
      <TreeControls
        zoomRef={zoomRef}
        svgRef={svgRef}
        onRecenter={fitTree}
        onRelationshipSelect={handleRelationshipSelect}
        selectedRelationship={selectedRelationship}
      />
      {contextMenuPosition && isEditMode && (
        <TreeContextMenu
          position={contextMenuPosition}
          onAddChild={() => handleAddRelation('child')}
          onAddParent={() => handleAddRelation('parent')}
          onAddSpouse={() => handleAddRelation('spouse')}
          onDelete={handleDeletePerson}
        />
      )}
      <style>{`
        .tree-tooltip {
          pointer-events: none;
          font-family: 'Inter', sans-serif;
        }
        .tree-node.is-muted,
        .tree-node.is-muted * {
          pointer-events: none;
        }
        .tree-node:hover .node-circle {
          filter: brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }
        .tree-node.selected .node-circle {
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        }
        .gender-icon {
          font-family: 'Arial', sans-serif;
          font-weight: bold;
          text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
        }
        @keyframes pulse-spouse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        path[stroke="#C77DFF"] {
          animation: pulse-spouse 2s infinite;
        }
      `}</style>
    </div>
  );
});

TreeVisualization.displayName = 'TreeVisualization';
export default TreeVisualization;

function personIdFromNode(node: Element) {
  const token = [...node.classList].find((name) => name.startsWith('node-'));
  return token ? token.slice('node-'.length) : '';
}

function readTranslate(node: SVGGElement) {
  const match = /translate\(\s*(-?[\d.]+)[,\s]+(-?[\d.]+)\s*\)/.exec(node.getAttribute('transform') || '');
  return {
    x: match ? Number(match[1]) : 0,
    y: match ? Number(match[2]) : 0,
  };
}

function pointOnCircle(center: { x: number; y: number }, toward: { x: number; y: number }, radius: number) {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: center.x + (dx / length) * radius,
    y: center.y + (dy / length) * radius,
  };
}

function relationPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dy = to.y - from.y;
  if (Math.abs(dy) < 28) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }
  const lift = Math.max(42, Math.min(88, Math.abs(dy) * 0.42));
  const leaveY = from.y + Math.sign(dy) * lift;
  return `M ${from.x} ${from.y} C ${from.x} ${leaveY}, ${to.x} ${leaveY}, ${to.x} ${to.y}`;
}
