import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { FamilyTreeState, Person, FamilyStats } from '../types/family';

interface FamilyTreeStore extends FamilyTreeState {
  addPerson: (person: Person) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  setSelectedPerson: (person: Person | null) => void;
  calculateStats: () => FamilyStats;
  getAncestors: (personId: string, generations: number) => Person[];
  getDescendants: (personId: string, generations: number) => Person[];
  searchPeople: (query: string) => Person[];
}

const useFamilyTreeStore = create<FamilyTreeStore>()(
  devtools(
    persist(
      (set, get) => ({
        people: [],
        selectedPerson: null,
        loading: false,
        error: null,

        addPerson: (person) => {
          set((state) => ({
            people: [...state.people, person],
            error: null,
          }));
        },

        updatePerson: (id, updates) => {
          set((state) => ({
            people: state.people.map((p) =>
              p.id === id ? { ...p, ...updates } : p
            ),
            error: null,
          }));
        },

        deletePerson: (id) => {
          set((state) => ({
            people: state.people.filter((p) => p.id !== id),
            error: null,
          }));
        },

        setSelectedPerson: (person) => {
          set({ selectedPerson: person, error: null });
        },

        calculateStats: () => {
          const { people } = get();
          const now = new Date();
        
          // Default empty stats
          const emptyStats: FamilyStats = {
            totalPeople: 0,
            generations: 0,
            averageAge: 0,
            maxAge: {
              age: 0,
              person: {
                id: '',
                firstName: 'N/A',
                lastName: 'N/A',
                birthDate: '',
                birthPlace: '',
                gender: 'unknown',
                occupation: '',
                deceased: false,
                parentIds: [],
                childrenIds: []
              }
            },
            countries: []
          };
        
          if (people.length === 0) {
            return emptyStats;
          }
        
          const ages = people.map((person) => {
            const birth = new Date(person.birthDate);
            const death = person.deathDate ? new Date(person.deathDate) : now;
            return Math.floor((death.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
          });
        
          const maxAge = Math.max(...ages);
          const maxAgePerson = people[ages.indexOf(maxAge)];
        
          const countries = [...new Set(people
            .map((p) => p.birthPlace.split(', ').pop() || '')
            .filter(Boolean)
          )];
        
          return {
            totalPeople: people.length,
            generations: calculateGenerations(people),
            averageAge: Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) || 0,
            maxAge: {
              age: maxAge,
              person: maxAgePerson,
            },
            countries,
          };
        },

        getAncestors: (personId, generations) => {
          const person = get().people.find((p) => p.id === personId);
          if (!person || generations === 0) return [];

          const ancestors = [];
          const queue = [{ person, generation: 0 }];

          while (queue.length > 0) {
            const { person: current, generation } = queue.shift()!;
            if (generation >= generations) continue;

            const parents = current.parentIds
              .map((id) => get().people.find((p) => p.id === id))
              .filter((p): p is Person => p !== undefined);

            ancestors.push(...parents);
            parents.forEach((parent) => {
              queue.push({ person: parent, generation: generation + 1 });
            });
          }

          return ancestors;
        },

        getDescendants: (personId, generations) => {
          const person = get().people.find((p) => p.id === personId);
          if (!person || generations === 0) return [];

          const descendants = [];
          const queue = [{ person, generation: 0 }];

          while (queue.length > 0) {
            const { person: current, generation } = queue.shift()!;
            if (generation >= generations) continue;

            const children = current.childrenIds
              .map((id) => get().people.find((p) => p.id === id))
              .filter((p): p is Person => p !== undefined);

            descendants.push(...children);
            children.forEach((child) => {
              queue.push({ person: child, generation: generation + 1 });
            });
          }

          return descendants;
        },

        searchPeople: (query) => {
          const searchTerms = query.toLowerCase().split(' ');
          return get().people.filter((person) => {
            const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
            return searchTerms.every((term) => fullName.includes(term));
          });
        },
      }),
      {
        name: 'family-tree-storage',
      }
    )
  )
);

function calculateGenerations(people: Person[]): number {
  let maxGen = 0;
  const visited = new Set<string>();

  function dfs(personId: string, gen: number) {
    if (visited.has(personId)) return;
    visited.add(personId);
    maxGen = Math.max(maxGen, gen);

    const person = people.find((p) => p.id === personId);
    if (!person) return;

    person.childrenIds.forEach((childId) => {
      dfs(childId, gen + 1);
    });
  }

  // Find root nodes (people without parents)
  const roots = people.filter((p) => p.parentIds.length === 0);
  roots.forEach((root) => dfs(root.id, 0));

  return maxGen + 1;
}

export default useFamilyTreeStore;