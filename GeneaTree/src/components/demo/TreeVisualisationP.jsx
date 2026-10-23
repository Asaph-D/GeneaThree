import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { ZoomIn, ZoomOut, Minimize, Plus, User, Trash2 } from 'lucide-react';
import * as d3 from 'd3';
import { Person } from '../../types/family';

interface GenealizationProps {
  viewType: string;
  generations: number;
  focusPerson: string;
  familyData: Person[];
  isEditMode?: boolean;
  onPersonSelect: (person: Person) => void;
  onPersonUpdate?: (person: Person) => void;
  onAddPerson?: (newPerson: Partial<Person>, relationshipType: 'child' | 'parent' | 'spouse', relatedPersonId: string) => void;
  onDeletePerson?: (personId: string) => void;
}

interface TreeNode extends d3.HierarchyNode<Person> {
  x0?: number;
  y0?: number;
  relationship?: string;
}

interface ExtendedPerson extends Person {
  relationship?: string;
  isSpouse?: boolean;
  children?: ExtendedPerson[];
  parents?: ExtendedPerson[];
  siblings?: ExtendedPerson[];
  extended?: {
    uncles?: ExtendedPerson[];
    aunts?: ExtendedPerson[];
    cousins?: ExtendedPerson[];
    grandparents?: ExtendedPerson[];
    grandchildren?: ExtendedPerson[];
  };
}

interface EditableNodeData {
  id: string;
  firstName: string;
  lastName: string;
  originalFirstName: string;
  originalLastName: string;
}

const relationshipColors = {
  self: "#ff6700",
  spouse: "#9370DB",
  child: "#4682B4",
  parent: "#228B22",
  sibling: "#20B2AA",
  grandparent: "#8B4513",
  grandchild: "#4169E1",
  uncle_aunt: "#CD853F",
  cousin: "#6495ED",
  niece_nephew: "#6A5ACD",
  great_grandparent: "#A0522D",
  other: "#708090"
};

const genderColors = {
  male: "#83b3f3",
  female: "#f389b8",
  unknown: "#aaa"
};

const Genealization = forwardRef<HTMLDivElement, GenealizationProps>(({
    viewType,
    generations,
    focusPerson,
    familyData,
    isEditMode = false,
    onPersonSelect,
    onPersonUpdate,
    onAddPerson,
    onDeletePerson
  }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const gRef = useRef<SVGGElement | null>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

    const [editingNode, setEditingNode] = useState<EditableNodeData | null>(null);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number, personId: string } | null>(null);
    const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);

    useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    const printStyles = `
      @media print {
        .tree-visualization-container {
          width: 100% !important;
          height: 100vh !important;
          page-break-inside: avoid;
        }

        .controls, .context-menu, .edit-indicator, .edit-icon {
          display: none !important;
        }

        svg {
          width: 100% !important;
          height: 100% !important;
        }

        .tree-node text {
          font-family: Arial, sans-serif;
          font-weight: 600;
        }

        .relationship-legend {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: white;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
          font-size: 10px;
        }

        .relationship-legend-item {
          display: flex;
          align-items: center;
          margin: 3px 0;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 5px;
        }

        .family-title {
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 10px;
        }
      }
    `;

    useEffect(() => {
      if (containerRef.current) {
        initializeTree();

        const styleElement = document.createElement('style');
        styleElement.textContent = printStyles;
        document.head.appendChild(styleElement);

        return () => {
          document.head.removeChild(styleElement);
          if (containerRef.current) {
            d3.select(containerRef.current).selectAll("svg").remove();
          }
        };
      }
    }, []);

    useEffect(() => {
      if (containerRef.current && svgRef.current) {
        updateTree();
      }
    }, [viewType, generations, focusPerson, familyData, isEditMode, selectedRelationship]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (contextMenuPosition && !event.target) {
          setContextMenuPosition(null);
        }
      };

      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }, [contextMenuPosition]);

    const initializeTree = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      d3.select(container).select("svg").remove();

      const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("max-width", "100%")
        .style("height", "auto");

      svgRef.current = svg.node();

      const g = svg.append("g");
      gRef.current = g.node();

      svg.append("text")
        .attr("class", "watermark")
        .attr("x", width / 2)
        .attr("y", height - 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#999")
        .text("Généré avec GeneaTreePro");

      const focusPersonObj = familyData.find(p => p.id === focusPerson);
      const familyTitle = focusPersonObj ? `Arbre généalogique - Famille ${focusPersonObj.lastName}` : "Arbre généalogique";

      svg.append("text")
        .attr("class", "family-title")
        .attr("x", width / 2)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .text(familyTitle);

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 3])
        .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          if (gRef.current) {
            d3.select(gRef.current).attr("transform", event.transform.toString());
          }
        });

      svg.call(zoom);
      zoomRef.current = zoom;

      const initialTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(0.8);
      svg.call(zoom.transform, initialTransform);

      updateTree();
    };

    const updateTree = () => {
      if (!svgRef.current || !gRef.current || !familyData?.length) return;

      const svg = d3.select(svgRef.current);
      const g = d3.select(gRef.current);
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;

      g.selectAll("*").remove();

      let root: TreeNode;
      const personExists = familyData.some(p => p.id === focusPerson);
      const validFocusPerson = personExists ? focusPerson : familyData[0]?.id;

      if (!validFocusPerson) {
        console.error("No valid focus person found. familyData might be empty.");
        return;
      }

      try {
        root = processFamilyData(familyData, validFocusPerson);
      } catch (error) {
        console.error("Error processing family data:", error);
        return;
      }

      const nodeRadius = 35;
      const nodePadding = 15;

      let treeLayout: d3.TreeLayout<TreeNode>;
      switch (viewType) {
        case "radial":
          treeLayout = d3.tree<TreeNode>()
            .size([2 * Math.PI, Math.min(width, height) / 3]);
          root.x0 = 0;
          root.y0 = 0;
          break;
        case "vertical":
          treeLayout = d3.tree<TreeNode>()
            .nodeSize([nodeRadius * 3, nodeRadius * 6]);
          root.x0 = width / 2;
          root.y0 = 50;
          break;
        default:
          treeLayout = d3.tree<TreeNode>()
            .nodeSize([nodeRadius * 6, nodeRadius * 4]);
          root.x0 = height / 2;
          root.y0 = 50;
          break;
      }

      treeLayout(root);

      const nodes = root.descendants();
      const links = root.links();

      const linkGroup = g.append("g").attr("class", "links");

      linkGroup.selectAll("path")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d => {
          if (viewType === "radial") {
            const startX = Math.cos(d.source.x) * d.source.y;
            const startY = Math.sin(d.source.x) * d.source.y;
            const endX = Math.cos(d.target.x) * d.target.y;
            const endY = Math.sin(d.target.x) * d.target.y;
            return `M${startX},${startY}L${endX},${endY}`;
          } else if (viewType === "vertical") {
            return `M${d.source.x},${d.source.y}C${d.source.x},${(d.source.y + d.target.y) / 2} ${d.target.x},${(d.source.y + d.target.y) / 2} ${d.target.x},${d.target.y}`;
          } else {
            return `M${d.source.x},${d.source.y}C${(d.source.x + d.target.x) / 2},${d.source.y} ${(d.source.x + d.target.x) / 2},${d.target.y} ${d.target.x},${d.target.y}`;
          }
        })
        .attr("stroke", d => {
          const sourceRelationship = d.source.data.relationship || 'other';
          const targetRelationship = d.target.data.relationship || 'other';

          if (sourceRelationship === 'self' || targetRelationship === 'self') {
            return relationshipColors.self;
          } else if (targetRelationship === 'spouse') {
            return relationshipColors.spouse;
          } else if (targetRelationship === 'child') {
            return relationshipColors.child;
          } else if (targetRelationship === 'parent') {
            return relationshipColors.parent;
          } else if (targetRelationship === 'sibling') {
            return relationshipColors.sibling;
          } else if (targetRelationship === 'grandparent') {
            return relationshipColors.grandparent;
          } else if (targetRelationship === 'grandchild') {
            return relationshipColors.grandchild;
          } else if (targetRelationship === 'uncle_aunt') {
            return relationshipColors.uncle_aunt;
          } else if (targetRelationship === 'cousin') {
            return relationshipColors.cousin;
          } else {
            return "#999";
          }
        })
        .attr("stroke-width", d => (d.target.data.id === focusPerson || d.source.data.id === focusPerson) ? 2.5 : 1.5)
        .attr("stroke-dasharray", d => d.target.data.relationship === 'spouse' ? "5,5" : "none")
        .attr("fill", "none");

      const nodeGroup = g.append("g").attr("class", "nodes");

      const nodes_g = nodeGroup.selectAll("g")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", d => `tree-node node-${d.data.id}${d.data.relationship ? ` relationship-${d.data.relationship}` : ''}`)
        .attr("transform", d => {
          if (viewType === "radial") {
            const x = Math.cos(d.x) * d.y;
            const y = Math.sin(d.x) * d.y;
            return `translate(${x},${y})`;
          } else if (viewType === "vertical") {
            return `translate(${d.x},${d.y})`;
          } else {
            return `translate(${d.x},${d.y})`;
          }
        })
        .on("click", (event, d) => {
          if (!isEditMode || !onPersonUpdate) {
            onPersonSelect(d.data);
          } else if (!editingNode) {
            setEditingNode({
              id: d.data.id,
              firstName: d.data.firstName,
              lastName: d.data.lastName,
              originalFirstName: d.data.firstName,
              originalLastName: d.data.lastName
            });
          }
        })
        .on("contextmenu", (event, d) => {
          if (isEditMode) {
            event.preventDefault();
            setContextMenuPosition({
              x: event.pageX,
              y: event.pageY,
              personId: d.data.id
            });
          }
        })
        .on("mouseover", (event, d) => {
          highlightRelatedNodes(d.data.id);
        })
        .on("mouseout", () => {
          if (!selectedRelationship) {
            nodeGroup.selectAll(".tree-node")
              .classed("highlighted", false)
              .classed("dimmed", false);
          }
        });

      nodes_g.append("circle")
        .attr("r", nodeRadius)
        .attr("fill", d => {
          const baseColor = d.data.gender === "male" ? genderColors.male :
                          d.data.gender === "female" ? genderColors.female :
                          genderColors.unknown;

          return d.data.relationship ? adjustColor(baseColor, d.data.relationship) : baseColor;
        })
        .attr("stroke", d => {
          if (d.data.id === focusPerson) return relationshipColors.self;
          return d.data.relationship ? relationshipColors[d.data.relationship as keyof typeof relationshipColors] || "#666" : "#666";
        })
        .attr("stroke-width", d => d.data.id === focusPerson ? 3 : 1.5)
        .attr("opacity", d => d.data.deceased ? 0.7 : 1);

      if (selectedRelationship) {
        nodes_g.filter(d => d.data.relationship === selectedRelationship)
          .append("circle")
          .attr("r", nodeRadius + 5)
          .attr("fill", "none")
          .attr("stroke", "#ff6700")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,3")
          .attr("opacity", 0.8);
      }

      nodes_g.append("text")
        .filter(d => d.data.relationship && d.data.id !== focusPerson)
        .attr("class", "relationship-indicator")
        .attr("x", -nodeRadius)
        .attr("y", -nodeRadius - 5)
        .attr("text-anchor", "start")
        .attr("font-size", "9px")
        .attr("fill", d => relationshipColors[d.data.relationship as keyof typeof relationshipColors] || "#666")
        .text(d => formatRelationship(d.data.relationship || ''));

      nodes_g.each(function(d) {
        const node = d3.select(this);
        const person = d.data;
        const isEditing = editingNode && editingNode.id === person.id;

        if (isEditing) {
          const inputGroup = node.append("foreignObject")
            .attr("x", -nodeRadius - 20)
            .attr("y", -25)
            .attr("width", (nodeRadius + 20) * 2)
            .attr("height", 70);

          const form = inputGroup.append("xhtml:div")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "center")
            .style("background-color", "white")
            .style("border-radius", "5px")
            .style("padding", "2px")
            .style("box-shadow", "0 2px 5px rgba(0,0,0,0.2)");

          form.append("xhtml:input")
            .attr("type", "text")
            .attr("value", editingNode.firstName)
            .style("width", "80px")
            .style("margin-bottom", "2px")
            .style("text-align", "center")
            .style("font-size", "10px")
            .style("border", "1px solid #ccc")
            .style("border-radius", "3px")
            .on("input", function() {
              setEditingNode({
                ...editingNode,
                firstName: this.value
              });
            });

          form.append("xhtml:input")
            .attr("type", "text")
            .attr("value", editingNode.lastName)
            .style("width", "80px")
            .style("text-align", "center")
            .style("font-size", "10px")
            .style("border", "1px solid #ccc")
            .style("border-radius", "3px")
            .on("input", function() {
              setEditingNode({
                ...editingNode,
                lastName: this.value
              });
            });

          form.append("xhtml:div")
            .style("display", "flex")
            .style("margin-top", "3px")
            .style("justify-content", "center")
            .style("gap", "5px")
            .html(`
              <button style="background-color:#4CAF50;color:white;border:none;padding:2px 5px;border-radius:3px;font-size:10px;cursor:pointer;">
                Save
              </button>
              <button style="background-color:#f44336;color:white;border:none;padding:2px 5px;border-radius:3px;font-size:10px;cursor:pointer;">
                Cancel
              </button>
            `)
            .on("click", function(event) {
              event.stopPropagation();
              const target = event.target as HTMLElement;

              if (target.textContent === "Save" && onPersonUpdate) {
                const updatedPerson = {
                  ...person,
                  firstName: editingNode.firstName,
                  lastName: editingNode.lastName
                };
                onPersonUpdate(updatedPerson);
                setEditingNode(null);
              } else if (target.textContent === "Cancel") {
                setEditingNode(null);
              }
            });
        } else {
          node.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", -5)
            .attr("class", "person-firstname")
            .text(d.data.firstName)
            .attr("fill", "white")
            .attr("font-size", "12px")
            .attr("font-weight", d.data.id === focusPerson ? "bold" : "normal");

          node.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", 10)
            .attr("class", "person-lastname")
            .text(d.data.lastName)
            .attr("fill", "white")
            .attr("font-size", "10px")
            .attr("font-weight", d.data.id === focusPerson ? "bold" : "normal");

          let yearsText = "";
          if (d.data.birthDate) {
            const birthYear = new Date(d.data.birthDate).getFullYear();
            yearsText = `${birthYear}`;

            if (d.data.deathDate) {
              const deathYear = new Date(d.data.deathDate).getFullYear();
              yearsText += ` - ${deathYear}`;
            } else if (d.data.deceased) {
              yearsText += " - †";
            }
          }

          if (yearsText) {
            node.append("text")
              .attr("text-anchor", "middle")
              .attr("dy", 25)
              .attr("class", "person-years")
              .text(yearsText)
              .attr("fill", "white")
              .attr("font-size", "9px");
          }
        }
      });

      if (isEditMode && onPersonUpdate) {
        nodes_g.append("circle")
          .attr("class", "edit-indicator")
          .attr("r", 10)
          .attr("cx", nodeRadius - 5)
          .attr("cy", -nodeRadius + 5)
          .attr("fill", "#4CAF50")
          .attr("opacity", 0.8)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1)
          .attr("cursor", "pointer")
          .on("click", (event, d) => {
            event.stopPropagation();
            setEditingNode({
              id: d.data.id,
              firstName: d.data.firstName,
              lastName: d.data.lastName,
              originalFirstName: d.data.firstName,
              originalLastName: d.data.lastName
            });
          });

        nodes_g.append("text")
          .attr("class", "edit-icon")
          .attr("x", nodeRadius - 5)
          .attr("y", -nodeRadius + 5)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("fill", "#fff")
          .attr("font-size", "10px")
          .attr("pointer-events", "none")
          .text("✏️");
      }

      const relationshipOptions = [
        { id: 'parent', label: 'Parents' },
        { id: 'sibling', label: 'Frères et Soeurs' },
        { id: 'child', label: 'Enfants' },
        { id: 'grandparent', label: 'Grands-parents' },
        { id: 'grandchild', label: 'Petits-enfants' },
        { id: 'uncle_aunt', label: 'Oncles et Tantes' },
        { id: 'cousin', label: 'Cousins' },
        { id: 'spouse', label: 'Conjoints' }
      ];

      const legendGroup = svg.append("g")
        .attr("class", "relationship-legend")
        .attr("transform", `translate(20, ${height - 20 - (relationshipOptions.length * 15)})`);

      legendGroup.append("rect")
        .attr("width", 120)
        .attr("height", relationshipOptions.length * 15 + 10)
        .attr("fill", "white")
        .attr("stroke", "#ccc")
        .attr("rx", 5);

      legendGroup.append("text")
        .attr("x", 60)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .text("Légende");

      relationshipOptions.forEach((rel, i) => {
        const itemGroup = legendGroup.append("g")
          .attr("transform", `translate(10, ${i * 15 + 25})`);

        itemGroup.append("circle")
          .attr("r", 5)
          .attr("fill", relationshipColors[rel.id as keyof typeof relationshipColors]);

        itemGroup.append("text")
          .attr("x", 15)
          .attr("y", 3)
          .attr("font-size", "8px")
          .text(rel.label);
      });

      const filterDiv = d3.select(containerRef.current)
        .selectAll(".relationship-filters")
        .data([null])
        .join("div")
        .attr("class", "relationship-filters")
        .style("position", "absolute")
        .style("left", "10px")
        .style("top", "10px")
        .style("background", "white")
        .style("color", "black")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("border", "1px solid #ccc")
        .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)")
        .style("z-index", "5")
        .style("display", isEditMode ? "none" : "block");

      filterDiv.selectAll("button")
        .data([{ id: null, label: 'Tous' }, ...relationshipOptions])
        .join("button")
        .style("margin", "2px")
        .style("padding", "3px 8px")
        .style("border", d => d.id === selectedRelationship ? "2px solid #ff6700" : "1px solid #ccc")
        .style("border-radius", "3px")
        .style("background", d => d.id === selectedRelationship ? "#fff9f5" : "white")
        .style("font-size", "10px")
        .style("cursor", "pointer")
        .text(d => d.label)
        .on("click", (event, d) => {
          setSelectedRelationship(d.id);
          if (d.id) {
            highlightRelationship(d.id);
          } else {
            nodeGroup.selectAll(".tree-node")
              .classed("highlighted", false)
              .classed("dimmed", false);
          }
        });
    };

    const highlightRelatedNodes = (personId: string) => {
      const svg = d3.select(svgRef.current);
      const nodeGroup = svg.select(".nodes");

      nodeGroup.selectAll(".tree-node")
        .classed("dimmed", true)
        .style("opacity", 0.3);

      nodeGroup.select(`.node-${personId}`)
        .classed("dimmed", false)
        .classed("highlighted", true)
        .style("opacity", 1);

      const person = familyData.find(p => p.id === personId);
      if (person) {
        person.parentIds.forEach(id => {
          nodeGroup.select(`.node-${id}`)
            .classed("dimmed", false)
            .classed("highlighted", true)
            .style("opacity", 1);
        });

        person.childrenIds.forEach(id => {
          nodeGroup.select(`.node-${id}`)
            .classed("dimmed", false)
            .classed("highlighted", true)
            .style("opacity", 1);
        });

        if (person.spouseId) {
          nodeGroup.select(`.node-${person.spouseId}`)
            .classed("dimmed", false)
            .classed("highlighted", true)
            .style("opacity", 1);
        }
      }
    };

    const highlightRelationship = (relationship: string) => {
      const svg = d3.select(svgRef.current);
      const nodeGroup = svg.select(".nodes");

      nodeGroup.selectAll(".tree-node")
        .classed("highlighted", d => d.data.relationship === relationship)
        .classed("dimmed", d => d.data.relationship !== relationship && d.data.id !== focusPerson)
        .style("opacity", d => d.data.relationship === relationship || d.data.id === focusPerson ? 1 : 0.3);
    };

    const adjustColor = (baseColor: string, relationship: string): string => {
      const color = d3.color(baseColor);
      if (!color) return baseColor;

      switch (relationship) {
        case 'parent':
          return color.brighter(0.5).toString();
        case 'child':
          return color.darker(0.3).toString();
        case 'spouse':
          return color.toString();
        default:
          return color.toString();
      }
    };

    const formatRelationship = (relationship: string): string => {
      switch (relationship) {
        case 'self': return 'Moi';
        case 'spouse': return 'Conjoint';
        case 'child': return 'Enfant';
        case 'parent': return 'Parent';
        case 'sibling': return 'Frère/Sœur';
        case 'grandparent': return 'Grand-parent';
        case 'grandchild': return 'Petit-enfant';
        case 'uncle_aunt': return 'Oncle/Tante';
        case 'cousin': return 'Cousin(e)';
        case 'niece_nephew': return 'Neveu/Nièce';
        case 'great_grandparent': return 'Arrière-grand-parent';
        default: return '';
      }
    };

    const processFamilyData = (familyData: Person[], focusPersonId: string): TreeNode => {
      const focusPerson = familyData.find(p => p.id === focusPersonId);
      if (!focusPerson) {
        throw new Error(`Person with id "${focusPersonId}" not found in familyData`);
      }

      const personMap = new Map<string, ExtendedPerson>();
      familyData.forEach(p => {
        personMap.set(p.id, {
          ...p,
          relationship: p.id === focusPersonId ? 'self' : undefined
        });
      });

      const buildTree = (personId: string, visited = new Set<string>()): ExtendedPerson => {
        if (visited.has(personId)) {
          const p = personMap.get(personId);
          return p ? { ...p } : { ...familyData.find(p => p.id === personId)! };
        }
        visited.add(personId);

        const person = personMap.get(personId);
        if (!person) {
          throw new Error(`Person with id ${personId} not found`);
        }

        const children = person.childrenIds
          .map(childId => {
            const child = buildTree(childId, new Set(visited));
            if (child) {
              child.relationship = 'child';
            }
            return child;
          })
          .filter(Boolean) as ExtendedPerson[];

        const parents = person.parentIds
          .map(parentId => {
            const parent = buildTree(parentId, new Set(visited));
            if (parent) {
              parent.relationship = 'parent';
            }
            return parent;
          })
          .filter(Boolean) as ExtendedPerson[];

        const siblings = parents.flatMap(parent =>
          parent.childrenIds
            .filter(childId => childId !== personId)
            .map(childId => {
              const sibling = buildTree(childId, new Set(visited));
              if (sibling && !sibling.relationship) {
                sibling.relationship = 'sibling';
              }
              return sibling;
            })
            .filter(Boolean)
        ) as ExtendedPerson[];

        let spouse = null;
        if (person.spouseId) {
          spouse = buildTree(person.spouseId, new Set(visited));
          if (spouse && !spouse.relationship) {
            spouse.relationship = 'spouse';
          }
        }

        const grandparents = parents.flatMap(parent =>
          parent.parentIds.map(grandparentId => {
            const grandparent = buildTree(grandparentId, new Set(visited));
            if (grandparent && !grandparent.relationship) {
              grandparent.relationship = 'grandparent';
            }
            return grandparent;
          })
          .filter(Boolean)
        ) as ExtendedPerson[];

        const unclesAunts = parents.flatMap(parent =>
          parent.parentIds.flatMap(grandparentId => {
            const grandparent = personMap.get(grandparentId);
            if (!grandparent) return [];
            return grandparent.childrenIds
              .filter(childId => childId !== parent.id)
              .map(auntUncleId => {
                const auntUncle = buildTree(auntUncleId, new Set(visited));
                if (auntUncle && !auntUncle.relationship) {
                  auntUncle.relationship = 'uncle_aunt';
                }
                return auntUncle;
              })
              .filter(Boolean);
          })
        ) as ExtendedPerson[];

        const cousins = unclesAunts.flatMap(uncleAunt =>
          uncleAunt.childrenIds.map(cousinId => {
            const cousin = buildTree(cousinId, new Set(visited));
            if (cousin && !cousin.relationship) {
              cousin.relationship = 'cousin';
            }
            return cousin;
          })
          .filter(Boolean)
        ) as ExtendedPerson[];

        const grandchildren = children.flatMap(child =>
          child.childrenIds.map(grandchildId => {
            const grandchild = buildTree(grandchildId, new Set(visited));
            if (grandchild && !grandchild.relationship) {
              grandchild.relationship = 'grandchild';
            }
            return grandchild;
          })
          .filter(Boolean)
        ) as ExtendedPerson[];

        return {
          ...person,
          children: children.length > 0 ? children : undefined,
          parents: parents.length > 0 ? parents : undefined,
          siblings: siblings.length > 0 ? siblings : undefined,
          extended: {
            uncles: unclesAunts,
            aunts: unclesAunts,
            cousins,
            grandparents,
            grandchildren
          }
        };
      };

      const hierarchyData = buildTree(focusPersonId);
      const root = d3.hierarchy(hierarchyData);

      return root as TreeNode;
    };

    const handleAddRelation = (relationType: 'child' | 'parent' | 'spouse') => {
      if (contextMenuPosition && onAddPerson) {
        const personId = contextMenuPosition.personId;
        const newPerson: Partial<Person> = {
          firstName: "Nouveau",
          lastName: "",
          gender: "unknown",
          birthDate: "",
          birthPlace: "",
          occupation: "",
          deceased: false
        };

        onAddPerson(newPerson, relationType, personId);
        setContextMenuPosition(null);
      }
    };

    const handleDeletePerson = () => {
      if (contextMenuPosition && onDeletePerson) {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette personne ?")) {
          onDeletePerson(contextMenuPosition.personId);
          setContextMenuPosition(null);
        }
      }
    };

    return (
      <div
        ref={containerRef}
        className="tree-visualization-container"
        style={{ width: '100%', height: '500px', position: 'relative' }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ display: 'block' }}
        ></svg>

        <div
          className="controls"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            gap: '8px',
            zIndex: 1,
            background: 'rgba(255,255,255,0.8)',
            padding: '5px',
            borderRadius: '4px'
          }}
        >
          <button
            className="p-1 bg-white rounded-md shadow-sm hover:bg-gray-100"
            onClick={() =>
              zoomRef.current &&
              svgRef.current &&
              zoomRef.current.scaleBy(d3.select(svgRef.current), 1.2)
            }
          >
            <ZoomIn size={20} />
          </button>
          <button
            className="p-1 bg-white rounded-md shadow-sm hover:bg-gray-100"
            onClick={() =>
              zoomRef.current &&
              svgRef.current &&
              zoomRef.current.scaleBy(d3.select(svgRef.current), 0.8)
            }
          >
            <ZoomOut size={20} />
          </button>
          <button
            className="p-1 bg-white rounded-md shadow-sm hover:bg-gray-100"
            onClick={() => {
              if (zoomRef.current && svgRef.current) {
                const width = svgRef.current.clientWidth;
                const height = svgRef.current.clientHeight;
                const resetTransform = d3.zoomIdentity
                  .translate(width / 2, height / 2)
                  .scale(0.8);
                d3.select(svgRef.current)
                  .transition()
                  .duration(500)
                  .call(zoomRef.current.transform, resetTransform);
              }
            }}
          >
            <Minimize size={20} />
          </button>
        </div>

        {contextMenuPosition && isEditMode && (
          <div
            className="context-menu"
            style={{
              position: 'absolute',
              top: contextMenuPosition.y,
              left: contextMenuPosition.x,
              background: 'white',
              border: '1px solid #ccc',
              borderRadius: '5px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              zIndex: 1000,
            }}
          >
            <div className="px-3 py-1 font-medium bg-gray-100 border-b border-gray-200 context-menu-title">
              Actions
            </div>
            <div className="py-1">
              <button
                className="flex items-center w-full px-4 py-1 text-left hover:bg-gray-100"
                onClick={() => handleAddRelation('child')}
              >
                <Plus size={16} className="mr-2" /> Ajouter un enfant
              </button>
              <button
                className="flex items-center w-full px-4 py-1 text-left hover:bg-gray-100"
                onClick={() => handleAddRelation('parent')}
              >
                <Plus size={16} className="mr-2" /> Ajouter un parent
              </button>
              <button
                className="flex items-center w-full px-4 py-1 text-left hover:bg-gray-100"
                onClick={() => handleAddRelation('spouse')}
              >
                <User size={16} className="mr-2" /> Ajouter un conjoint
              </button>
              <div className="my-1 border-t border-gray-200"></div>
              <button
                className="flex items-center w-full px-4 py-1 text-left text-red-600 hover:bg-red-100"
                onClick={handleDeletePerson}
              >
                <Trash2 size={16} className="mr-2" /> Supprimer
              </button>
            </div>
          </div>
        )}
      </div>
    );

    Genealization.displayName = 'Genealization';

});

export default GenealizationPreviously;
