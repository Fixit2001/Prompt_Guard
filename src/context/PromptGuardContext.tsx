import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { storageUtils } from '../utils/storage';
import type { DetectedEmail, DismissedEmail } from '../utils/storage';
import { PromptGuardContext } from '../hooks/usePromptGuard';

export interface PromptGuardContextType {
  allIssues: DetectedEmail[];
  activeIssues: DetectedEmail[];
  dismissedEmails: DismissedEmail[];
  
  isLoading: boolean;

  dismissEmail: (email: string) => Promise<void>;
  refreshData: () => Promise<void>;
  
  totalDetected: number;
  currentlyDismissed: number;
}

interface PromptGuardProviderProps {
  children: ReactNode;
}

export const PromptGuardProvider: React.FC<PromptGuardProviderProps> = ({ children }) => {
  const [allIssues, setAllIssues] = useState<DetectedEmail[]>([]);
  const [activeIssues, setActiveIssues] = useState<DetectedEmail[]>([]);
  const [dismissedEmails, setDismissedEmails] = useState<DismissedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [allIssuesData, activeIssuesData, dismissedData] = await Promise.all([
        storageUtils.getAllIssues(),
        storageUtils.getActiveIssues(),
        storageUtils.getDismissedEmails()
      ]);
      
      setAllIssues(allIssuesData);
      setActiveIssues(activeIssuesData);
      setDismissedEmails(dismissedData);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissEmail = async (email: string) => {
    try {
      await storageUtils.dismissEmail(email);
      await refreshData();
    } catch (error) {
      console.error('Error dismissing email:', error);
    }
  };

  const totalDetected = allIssues.length;
  const currentlyDismissed = dismissedEmails.filter(dismissed => {
    const now = Date.now();
    const dismissDuration = 24 * 60 * 60 * 1000;
    return (now - dismissed.dismissedAt) < dismissDuration;
  }).length;

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.issues || changes.dismissed) {
        refreshData();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const contextValue: PromptGuardContextType = {
    allIssues,
    activeIssues,
    dismissedEmails,
    isLoading,
    dismissEmail,
    refreshData,
    totalDetected,
    currentlyDismissed
  };

  return (
    <PromptGuardContext.Provider value={contextValue}>
      {children}
    </PromptGuardContext.Provider>
  );
};

