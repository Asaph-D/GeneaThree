import React, { createContext, useContext, useEffect, useReducer } from 'react';
import {
  CreationAction,
  CreationDraft,
  DRAFT_STORAGE_KEY,
  creationReducer,
  loadDraft,
} from './model';

interface CreationContextValue {
  draft: CreationDraft;
  dispatch: React.Dispatch<CreationAction>;
}

const CreationContext = createContext<CreationContextValue | null>(null);

export const CreationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draft, dispatch] = useReducer(creationReducer, undefined, loadDraft);

  useEffect(() => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  return <CreationContext.Provider value={{ draft, dispatch }}>{children}</CreationContext.Provider>;
};

export function useCreation(): CreationContextValue {
  const value = useContext(CreationContext);
  if (!value) {
    throw new Error('useCreation doit être utilisé dans CreationProvider');
  }
  return value;
}
