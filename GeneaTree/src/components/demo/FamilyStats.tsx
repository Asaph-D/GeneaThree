//src\components\demo\FamilyStats.tsx
import React from 'react';
import { Person, FamilyStats as FamilyStatsType } from '../../types/family';

interface FamilyStatsProps {
  familyData: Person[];
  compact?: boolean;
}

const FamilyStats: React.FC<FamilyStatsProps> = ({ familyData, compact = false }) => {
  // Calculate family statistics directly in the component
  const calculateStats = (): FamilyStatsType => {
    if (!familyData || familyData.length === 0) {
      return {
        totalPeople: 0,
        generations: 0,
        averageAge: 0,
        maxAge: { age: 0, person: {} as Person },
        countries: []
      };
    }

    // Get total people count
    const totalPeople = familyData.length;

    // Calculate generations
    let maxGenerations = 0;
    
    const findGenerationDepth = (personId: string, depth: number = 0, visited = new Set<string>()): number => {
      if (visited.has(personId)) return depth; // Prevent circular references
      visited.add(personId);
      
      const person = familyData.find(p => p.id === personId);
      if (!person) return depth;
      
      if (person.childrenIds.length === 0) return depth;
      
      const childrenDepths = person.childrenIds.map(childId => 
        findGenerationDepth(childId, depth + 1, new Set(visited))
      );
      
      return Math.max(...childrenDepths, depth);
    };
    
    // Find root people (with no parents)
    const rootPeople = familyData.filter(p => p.parentIds.length === 0);
    
    if (rootPeople.length > 0) {
      const generationDepths = rootPeople.map(p => findGenerationDepth(p.id));
      maxGenerations = Math.max(...generationDepths) + 1; // +1 because we start with 0
    } else {
      maxGenerations = 1; // At least one generation
    }

    // Calculate average age and find max age
    let totalAge = 0;
    let totalWithValidAge = 0;
    let maxAgeValue = 0;
    let maxAgePerson = familyData[0];

    familyData.forEach(person => {
      const birthYear = person.birthDate ? new Date(person.birthDate).getFullYear() : null;
      if (birthYear) {
        const deathYear = person.deathDate 
          ? new Date(person.deathDate).getFullYear() 
          : person.deceased ? null : new Date().getFullYear();
        
        if (deathYear) {
          const age = deathYear - birthYear;
          totalAge += age;
          totalWithValidAge++;
          
          if (age > maxAgeValue) {
            maxAgeValue = age;
            maxAgePerson = person;
          }
        }
      }
    });

    const averageAge = totalWithValidAge > 0 ? Math.round(totalAge / totalWithValidAge) : 0;

    // Extract unique countries from birth places
    const countries = Array.from(new Set(
      familyData
        .map(p => {
          const birthPlace = p.birthPlace || '';
          const parts = String(birthPlace).split(',');
          // Try to extract country from birth place (assuming format "City, Country")
          return parts.length > 1 ? parts[parts.length - 1].trim() : '';
        })
        .filter(country => country !== '')
    ));

    return {
      totalPeople,
      generations: maxGenerations,
      averageAge,
      maxAge: { age: maxAgeValue, person: maxAgePerson },
      countries
    };
  };

  const stats = calculateStats();

  return (
    <div className="family-stats">
      <h3 className={compact ? 'mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500' : 'mb-4 text-lg font-medium text-gray-900 dark:text-white'}>Statistiques familiales</h3>
      <div className={compact ? 'rounded-2xl border border-zinc-200/80 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5' : 'bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm min-h-[200px]'}>
        {stats.totalPeople === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Aucune donnée familiale disponible</p>
        ) : (
          <ul className="space-y-3">
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Nombre total de personnes:</span>
              <span className="font-medium dark:text-gray-300">{stats.totalPeople}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Générations:</span>
              <span className="font-medium dark:text-gray-300">{stats.generations}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Âge moyen:</span>
              <span className="font-medium dark:text-gray-300">{stats.averageAge} ans</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Longévité maximale:</span>
              <span className="font-medium dark:text-gray-300">
                {stats.maxAge.age > 0 ? (
                  <>
                    {stats.maxAge.age} ans ({stats.maxAge.person.firstName} {stats.maxAge.person.lastName})
                  </>
                ) : (
                  "N/A"
                )}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Pays d'origine:</span>
              <span className="font-medium dark:text-gray-300">
                {stats.countries.length} {stats.countries.length === 1 ? 'pays' : 'pays'}
                {stats.countries.length > 0 && (
                  <span className="block mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {stats.countries.join(', ')}
                  </span>
                )}
              </span>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default FamilyStats;