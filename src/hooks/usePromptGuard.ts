import { createContext, useContext } from 'react';
import type { PromptGuardContextType } from '../context/PromptGuardContext';

export const PromptGuardContext = createContext<PromptGuardContextType | undefined>(undefined);

export const usePromptGuard = () => {
  const context = useContext(PromptGuardContext);
  if (context === undefined) {
    throw new Error('usePromptGuard must be used within a PromptGuardProvider');
  }
  return context;
};