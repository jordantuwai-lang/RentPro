'use client';
import { createContext, useContext, useState, useEffect } from 'react';

interface BranchContextType {
  selectedBranch: { id: string; name: string; code: string } | null;
  setSelectedBranch: (branch: { id: string; name: string; code: string } | null) => void;
  isAllBranches: boolean;
}

const BranchContext = createContext<BranchContextType>({
  selectedBranch: null,
  setSelectedBranch: () => {},
  isAllBranches: false,
});

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [selectedBranch, setSelectedBranchState] = useState<{ id: string; name: string; code: string } | null>(null);

  const setSelectedBranch = (branch: { id: string; name: string; code: string } | null) => {
    setSelectedBranchState(branch);
    if (branch) {
      sessionStorage.setItem('selectedBranch', JSON.stringify(branch));
    } else {
      sessionStorage.removeItem('selectedBranch');
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('selectedBranch');
    if (stored) {
      try {
        setSelectedBranchState(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  return (
    <BranchContext.Provider value={{
      selectedBranch,
      setSelectedBranch,
      isAllBranches: selectedBranch?.code === 'ALL',
    }}>
      {children}
    </BranchContext.Provider>
  );
}

export const useBranch = () => useContext(BranchContext);
