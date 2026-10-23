// src/components/tree/utils.ts
import * as d3 from 'd3';
import { ExtendedPerson, Person } from '../../types/family';
import { relationshipColors } from './constants';
import { TreeNode } from './types';

export const processFamilyData = (familyData: Person[], focusPersonId: string, maxGenerations: number): TreeNode => {
  const personMap = new Map<string, ExtendedPerson>();
  familyData.forEach(p => {
    personMap.set(p.id, {
      ...p,
      relationship: p.id === focusPersonId ? 'self' : undefined,
      children: [],
      parents: [],
      siblings: [],
      extended: {}
    });
  });

  const buildD3Hierarchy = (currentPersonId: string, depth = 0, visitedNodes = new Set<string>()): ExtendedPerson | null => {
    if (depth > maxGenerations || visitedNodes.has(currentPersonId)) {
      return null;
    }

    const person = personMap.get(currentPersonId);
    if (!person) return null;

    visitedNodes.add(currentPersonId);
    const node: ExtendedPerson = { ...person };
    node.children = [];

    // Déterminer la relation par rapport à la personne focale
    if (currentPersonId !== focusPersonId) {
      const focusP = personMap.get(focusPersonId);
      if (focusP) {
        // Relations directes
        if (focusP.parentIds.includes(currentPersonId)) {
          node.relationship = 'parent';
        } else if (focusP.childrenIds.includes(currentPersonId)) {
          node.relationship = 'child';
        } else if (focusP.spouseIds.includes(currentPersonId)) {
          node.relationship = 'spouse';
        } else {
          // Relations étendues
          let foundRelationship = false;

          // Grands-parents
          focusP.parentIds.forEach(parentId => {
            const parent = personMap.get(parentId);
            if (parent && parent.parentIds.includes(currentPersonId)) {
              node.relationship = 'grandparent';
              foundRelationship = true;
            }
          });

          // Petits-enfants
          if (!foundRelationship) {
            focusP.childrenIds.forEach(childId => {
              const child = personMap.get(childId);
              if (child && child.childrenIds.includes(currentPersonId)) {
                node.relationship = 'grandchild';
                foundRelationship = true;
              }
            });
          }

          // Frères/soeurs
          if (!foundRelationship) {
            focusP.parentIds.forEach(parentId => {
              const parent = personMap.get(parentId);
              if (parent && parent.childrenIds.includes(currentPersonId) && currentPersonId !== focusPersonId) {
                node.relationship = 'sibling';
                foundRelationship = true;
              }
            });
          }

          // Oncles/tantes
          if (!foundRelationship) {
            focusP.parentIds.forEach(parentId => {
              const parent = personMap.get(parentId);
              if (parent) {
                parent.parentIds.forEach(grandparentId => {
                  const grandparent = personMap.get(grandparentId);
                  if (grandparent && grandparent.childrenIds.includes(currentPersonId) && currentPersonId !== parentId) {
                    node.relationship = 'uncle_aunt';
                    foundRelationship = true;
                  }
                });
              }
            });
          }

          // Cousins
          if (!foundRelationship) {
            focusP.parentIds.forEach(parentId => {
              const parent = personMap.get(parentId);
              if (parent) {
                parent.parentIds.forEach(grandparentId => {
                  const grandparent = personMap.get(grandparentId);
                  if (grandparent) {
                    grandparent.childrenIds.forEach(uncleAuntId => {
                      const uncleAunt = personMap.get(uncleAuntId);
                      if (uncleAunt && uncleAunt.childrenIds.includes(currentPersonId)) {
                        node.relationship = 'cousin';
                        foundRelationship = true;
                      }
                    });
                  }
                });
              }
            });
          }

          // Si aucune relation trouvée
          if (!foundRelationship) {
            node.relationship = 'other';
          }
        }
      }
    } else {
      node.relationship = 'self';
    }

    // Ajouter les enfants
    person.childrenIds.forEach(childId => {
      const childNode = buildD3Hierarchy(childId, depth + 1, visitedNodes);
      if (childNode) {
        if (childNode.id !== focusPersonId && !childNode.relationship) {
          childNode.relationship = 'child';
        }
        node.children!.push(childNode);
      }
    });

    return node;
  };

  const d3DataRoot = buildD3Hierarchy(focusPersonId, 0, new Set<string>());
  if (!d3DataRoot) {
    console.error("Failed to create D3 hierarchy root. Returning an empty tree.");
    // Return a dummy root if no data or focus person is invalid, to prevent crashing
    return d3.hierarchy({
        id: "dummy",
        firstName: "No",
        lastName: "Data",
        gender: "unknown",
        birthDate: "",
        birthPlace: {},
        deceased: false,
        parentIds: [],
        childrenIds: [],
        spouseIds: [],
        biography: "",
        notes: "",
        children: [] // Ensure the dummy data includes a 'children' property to match TreeNode structure
    } as unknown as Person) as TreeNode;
  }

  const rootNode: TreeNode = d3.hierarchy(d3DataRoot, d => d.children);

  return rootNode;
};

export const highlightRelatedNodes = (personId: string, nodeGroup: d3.Selection<SVGGElement, TreeNode, SVGGElement, unknown>) => {
  // Reset all nodes to default state first
  nodeGroup.selectAll<SVGGElement, TreeNode>(".tree-node")
    .classed("highlighted", false)
    .classed("dimmed", true)
    .style("opacity", 0.3);

  // Highlight the selected person's node
  nodeGroup.select<SVGGElement>(`.node-${personId}`)
    .classed("highlighted", true)
    .classed("dimmed", false)
    .style("opacity", 1);

  // Get the data for the selected person
  const selectedNode = nodeGroup.select<SVGGElement>(`.node-${personId}`).datum();
  if (!selectedNode) return;

  // Highlight direct family members
  const relationships = ['parent', 'child', 'spouse', 'sibling'];
  relationships.forEach(rel => {
    nodeGroup.selectAll<SVGGElement, d3.HierarchyNode<ExtendedPerson>>(".tree-node")
      .filter(d => d.data.relationship === rel)
      .classed("highlighted", true)
      .classed("dimmed", false)
      .style("opacity", 1);
  });

  // Highlight extended family (grandparents, grandchildren, etc.)
  const extendedRelationships = ['grandparent', 'grandchild', 'great_grandparent', 'great_grandchild'];
  extendedRelationships.forEach(rel => {
    nodeGroup.selectAll<SVGGElement, d3.HierarchyNode<ExtendedPerson>>(".tree-node")
      .filter(d => d.data.relationship === rel)
      .classed("highlighted", true)
      .classed("dimmed", false)
      .style("opacity", 0.8); // Slightly dimmer than direct relations
  });

  // Add transition for smooth visual effect
  nodeGroup.selectAll(".tree-node")
    .transition()
    .duration(300);
};

export const highlightRelationship = (relationship: string, nodeGroup: d3.Selection<SVGGElement, TreeNode, SVGGElement, unknown>, focusPersonId: string) => {
    nodeGroup.selectAll(".tree-node")
        .classed("highlighted", false)
        .classed("dimmed", true)
        .style("opacity", 0.3); // Dim all

    nodeGroup.selectAll(`.relationship-${relationship}`)
        .classed("highlighted", true)
        .classed("dimmed", false)
        .style("opacity", 1); // Highlight selected

    // Always keep focus person visible
    nodeGroup.select(`.node-${focusPersonId}`)
        .classed("dimmed", false)
        .style("opacity", 1);
};


export const adjustColor = (baseColor: string, relationship: string) => {
  const relColor = relationshipColors[relationship as keyof typeof relationshipColors];
  if (relColor) {
    // A simple blend or overlay might be needed for real combination effects
    // For now, let's just prioritize the relationship color if a strong one exists
    return relColor;
  }
  return baseColor;
};

export function relationToFocus(person: Person, focus: Person, people: Person[]): string {
  if (person.id === focus.id) return 'self';
  if (focus.parentIds.includes(person.id)) return 'parent';
  if (focus.childrenIds.includes(person.id)) return 'child';
  if (focus.spouseIds.includes(person.id)) return 'spouse';
  const byId = new Map(people.map((item) => [item.id, item]));
  const parents = focus.parentIds.map((id) => byId.get(id)).filter((item): item is Person => Boolean(item));
  if (
    focus.siblingIds?.includes(person.id) ||
    person.siblingIds?.includes(focus.id) ||
    parents.some((parent) => parent.childrenIds.includes(person.id))
  ) return 'sibling';
  if (parents.some((parent) => parent.parentIds.includes(person.id))) return 'grandparent';
  if (parents.some((parent) => parent.siblingIds?.includes(person.id))) return 'uncle_aunt';

  const children = focus.childrenIds.map((id) => byId.get(id)).filter((item): item is Person => Boolean(item));
  if (children.some((child) => child.childrenIds.includes(person.id))) return 'grandchild';

  const uncleIds = parents.flatMap((parent) => parent.siblingIds ?? []);
  if (uncleIds.some((id) => byId.get(id)?.childrenIds.includes(person.id))) return 'cousin';

  return '';
}

export const formatRelationship = (rel: string): string => {
  switch (rel) {
    case 'parent': return 'Parent';
    case 'child': return 'Enfant';
    case 'spouse': return 'Conjoint';
    case 'sibling': return 'Frère/Soeur';
    case 'grandparent': return 'Grand-parent';
    case 'grandchild': return 'Petit-enfant';
    case 'uncle_aunt': return 'Oncle/Tante';
    case 'cousin': return 'Cousin(e)';
    case 'niece_nephew': return 'Neveu/Nièce';
    case 'great_grandparent': return 'Arr-grand-parent';
    case 'self': return 'Vous';
    default: return rel;
  }
};