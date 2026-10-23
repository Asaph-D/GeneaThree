// src/components/FamilyCollector.tsx
import React, { useState } from 'react';
import DynamicPersonForm from './DynamicPersonForm';
import { PartialPerson, Person } from '../types/family';

interface FamilyCollectorProps {
  onComplete: (familyData: Person[]) => void;
}

const FamilyCollector: React.FC<FamilyCollectorProps> = ({ onComplete }) => {
  const [familyData, setFamilyData] = useState<Person[]>([]);
  const [currentPerson, setCurrentPerson] = useState<PartialPerson | null>(null);
  const [currentRelation, setCurrentRelation] = useState<string | null>(null);
  const [step, setStep] = useState<'self' | 'siblings' | 'parents' | 'children' | 'complete'>('self');

  const handlePersonSubmit = (personData: PartialPerson) => {
    const newPerson = { ...personData, id: Date.now().toString() } as Person;

    if (step === 'self') {
      setFamilyData([newPerson]);
      setCurrentPerson(newPerson);
      setStep('siblings');
    } else if (step === 'siblings') {
      const updatedFamily = familyData.map(p => p.id === currentPerson?.id ? { ...p, siblingIds: [...(p.siblingIds || []), newPerson.id] } : p);
      setFamilyData([...updatedFamily, newPerson]);
      setStep('parents');
    } else if (step === 'parents') {
      const updatedFamily = familyData.map(p => {
        if (currentRelation === 'mother' || currentRelation === 'father') {
          return { ...p, parentIds: [...(p.parentIds || []), newPerson.id] };
        }
        return p;
      });
      setFamilyData([...updatedFamily, newPerson]);
      setStep('children');
    } else if (step === 'children') {
      const updatedFamily = familyData.map(p => p.id === currentPerson?.id ? { ...p, childrenIds: [...(p.childrenIds || []), newPerson.id] } : p);
      setFamilyData([...updatedFamily, newPerson]);
      setStep('complete');
    }
    setCurrentPerson(null);
  };

  const askAboutSiblings = () => {
    const hasSiblings = window.confirm(`${currentPerson?.firstName}, avez-vous des frères et sœurs ?`);
    if (hasSiblings) {
      const numberOfSiblings = parseInt(prompt('Combien de frères et sœurs avez-vous ?'));
      for (let i = 0; i < numberOfSiblings; i++) {
        setCurrentRelation(`frère/soeur ${i + 1}`);
        break;
      }
    } else {
      setStep('parents');
    }
  };

  const askAboutParents = () => {
    const hasParentsInfo = window.confirm(`${currentPerson?.firstName}, voulez-vous ajouter des informations sur vos parents ?`);
    if (hasParentsInfo) {
      setCurrentRelation('père');
    } else {
      setStep('children');
    }
  };

  const askAboutChildren = () => {
    const hasChildren = window.confirm(`${currentPerson?.firstName}, avez-vous des enfants ?`);
    if (hasChildren) {
      const numberOfChildren = parseInt(prompt('Combien d\'enfants avez-vous ?'));
      for (let i = 0; i < numberOfChildren; i++) {
        setCurrentRelation(`enfant ${i + 1}`);
        break;
      }
    } else {
      setStep('complete');
      onComplete(familyData);
    }
  };

  useEffect(() => {
    if (step === 'siblings') {
      askAboutSiblings();
    } else if (step === 'parents') {
      askAboutParents();
    } else if (step === 'children') {
      askAboutChildren();
    }
  }, [step]);

  return (
    <div>
      {currentPerson ? (
        <DynamicPersonForm
          onSubmit={handlePersonSubmit}
          onCancel={() => setCurrentPerson(null)}
          onNextPerson={setCurrentRelation}
          initialPerson={currentPerson}
          relation={currentRelation}
        />
      ) : (
        <div>
          {step === 'self' && (
            <button onClick={() => setCurrentPerson({})} className="px-4 py-2 text-white bg-blue-500 rounded">
              Commencer à construire mon arbre généalogique
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FamilyCollector;
