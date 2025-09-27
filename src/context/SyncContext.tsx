
import React, { createContext, useState, useContext, useMemo } from 'react';

interface SyncContextType {
  isSyncing: boolean;
  setIsSyncing: (isSyncing: boolean) => void;
  lastSyncTime: Date | null;
  setLastSyncTime: (date: Date | null) => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const value = useMemo(() => ({ 
    isSyncing, 
    setIsSyncing, 
    lastSyncTime, 
    setLastSyncTime 
  }), [isSyncing, lastSyncTime]);

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
