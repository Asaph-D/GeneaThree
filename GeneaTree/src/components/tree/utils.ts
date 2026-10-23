// src/components/tree/utils.ts
import { Person, ExtendedPerson } from '../../types/family';

interface StyleSelection {
  style: (name: string, value: number) => unknown;
}

interface NodeGroupSelection {
  selectAll: (selector: string) => StyleSelection;
  select: (selector: string) => StyleSelection;
}

export const formatRelationship = (relationship: string): string => {
  const relationships = {
    parent: 'Parent',
    child: 'Enfant',
    sibling: 'Frère/Sœur',
    spouse: 'Conjoint(e)',
    grandparent: 'Grand-parent',
    grandchild: 'Petit-enfant',
    uncle_aunt: 'Oncle/Tante',
    cousin: 'Cousin(e)',
    nephew_niece: 'Neveu/Nièce'
  };
  return relationships[relationship as keyof typeof relationships] || relationship;
};

export const highlightRelationship = (
  relationship: string,
  nodeGroup: NodeGroupSelection,
  focusPerson: string
): void => {
  // Atténuer tous les nœuds
  nodeGroup.selectAll('.tree-node').style('opacity', 0.3);
  
  // Mettre en évidence les nœuds avec la relation sélectionnée
  nodeGroup.selectAll(`.relationship-${relationship}`).style('opacity', 1);
  
  // Toujours montrer la personne focale
  nodeGroup.select(`.node-${focusPerson}`).style('opacity', 1);
};

export const processFamilyData = (
  familyData: Person[],
  focusPersonId: string,
  maxGenerations: number
): ExtendedPerson => {
  const findPerson = (id: string): Person | undefined => {
    return familyData.find(p => p.id === id);
  };

  const processPersonRecursively = (
    personId: string,
    generation: number,
    visited: Set<string> = new Set()
  ): ExtendedPerson | null => {
    if (visited.has(personId) || Math.abs(generation) > maxGenerations) {
      return null;
    }
    
    visited.add(personId);
    const person = findPerson(personId);
    if (!person) return null;

    const extendedPerson: ExtendedPerson = {
      ...person,
      children: [],
      parents: [],
      siblings: [],
      relationship: generation === 0 ? 'self' : 
                   generation > 0 ? 'parent' :
                   generation < 0 ? 'child' : undefined
    };

    // Traiter les enfants (génération -1)
    if (generation > -maxGenerations && person.childrenIds) {
      extendedPerson.children = person.childrenIds
        .map(childId => processPersonRecursively(childId, generation - 1, new Set(visited)))
        .filter((child): child is ExtendedPerson => child !== null);
    }

    // Traiter les parents (génération +1)
    if (generation < maxGenerations && person.parentIds) {
      extendedPerson.parents = person.parentIds
        .map(parentId => processPersonRecursively(parentId, generation + 1, new Set(visited)))
        .filter((parent): parent is ExtendedPerson => parent !== null);
    }

    // Traiter les frères et sœurs (même génération)
    if (person.siblingIds) {
      extendedPerson.siblings = person.siblingIds
        .map(siblingId => {
          const sibling = findPerson(siblingId);
          if (!sibling) return null;
          return {
            ...sibling,
            relationship: 'sibling',
            children: [],
            parents: [],
            siblings: []
          } as ExtendedPerson;
        })
        .filter((sibling): sibling is ExtendedPerson => sibling !== null);
    }

    return extendedPerson;
  };

  const rootPerson = processPersonRecursively(focusPersonId, 0);
  if (!rootPerson) {
    // Fallback si la personne focale n'est pas trouvée
    const firstPerson = familyData[0];
    if (!firstPerson) {
      throw new Error('Aucune donnée familiale disponible');
    }
    return {
      ...firstPerson,
      relationship: 'self',
      children: [],
      parents: [],
      siblings: []
    };
  }

  return rootPerson;
};
