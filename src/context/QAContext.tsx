import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
  QAInspection,
  getQAInspections as dbGetQAInspections,
  addQAInspection as dbAddQAInspection,
  updateQAInspection as dbUpdateQAInspection,
  deleteQAInspection as dbDeleteQAInspection,
} from '../data/database';
import { useNotification } from './NotificationContext';

interface QAContextType {
  inspections: QAInspection[];
  addInspection: (data: Omit<QAInspection, 'id'>) => void;
  updateInspection: (data: QAInspection) => void;
  deleteInspection: (id: number) => void;
}

const QAContext = createContext<QAContextType | undefined>(undefined);

export const useQA = () => {
  const context = useContext(QAContext);
  if (!context) {
    throw new Error('useQA must be used within a QAProvider');
  }
  return context;
};

interface QAProviderProps {
  children: ReactNode;
}

export const QAProvider: React.FC<QAProviderProps> = ({ children }) => {
  const [inspections, setInspections] = useState<QAInspection[]>(() => dbGetQAInspections());
  const { showNotification } = useNotification();

  const addInspection = useCallback((data: Omit<QAInspection, 'id'>) => {
    dbAddQAInspection(data);
    setInspections(dbGetQAInspections());
    showNotification('Inspección añadida con éxito', 'success');
  }, [showNotification]);

  const updateInspection = useCallback((data: QAInspection) => {
    dbUpdateQAInspection(data);
    setInspections(dbGetQAInspections());
    showNotification('Inspección actualizada con éxito', 'success');
  }, [showNotification]);

  const deleteInspection = useCallback((id: number) => {
    dbDeleteQAInspection(id);
    setInspections(dbGetQAInspections());
    showNotification('Inspección eliminada con éxito', 'success');
  }, [showNotification]);

  const value = {
    inspections,
    addInspection,
    updateInspection,
    deleteInspection,
  };

  return <QAContext.Provider value={value}>{children}</QAContext.Provider>;
};
