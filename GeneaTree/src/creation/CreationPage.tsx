import React, { useEffect } from 'react';
import { CreationProvider, useCreation } from './CreationContext';
import StudioShell from './components/StudioShell';
import BranchesStep from './steps/BranchesStep';
import HouseholdsStep from './steps/HouseholdsStep';
import OriginStep from './steps/OriginStep';
import ReviewStep from './steps/ReviewStep';

const CreationStudio: React.FC = () => {
  const { draft } = useCreation();

  useEffect(() => {
    document.title = 'Atelier — GeneaTreePro';
  }, []);

  return (
    <StudioShell>
      {draft.step === 'origin' && <OriginStep />}
      {draft.step === 'households' && <HouseholdsStep />}
      {draft.step === 'branches' && <BranchesStep />}
      {draft.step === 'review' && <ReviewStep />}
    </StudioShell>
  );
};

const CreationPage: React.FC = () => (
  <CreationProvider>
    <CreationStudio />
  </CreationProvider>
);

export default CreationPage;
