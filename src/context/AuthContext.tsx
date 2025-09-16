import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Employee, getEmployees } from '../data/database';
import { supabase } from '../supabaseClient';

interface AuthContextType {
  currentUser: Employee | null;
  updateCurrentUser: (user: Employee) => void;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        const employees = await getEmployees();
        const user = employees.find(emp => emp.email.toLowerCase() === supabaseUser.email?.toLowerCase());
        if (user) {
          setCurrentUser(user);
        } else {
          console.warn('AuthContext: Supabase user found, but no matching employee.');
        }
      }
      setLoading(false);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUser();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string): Promise<boolean> => {
    const employees = await getEmployees();
    const user = employees.find(emp => emp.email.toLowerCase() === email.toLowerCase());

    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const updateCurrentUser = (user: Employee) => {
    setCurrentUser(user);
  };

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider value={{ currentUser, updateCurrentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};