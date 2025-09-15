import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Employee, getEmployees } from '../data/database';
import { supabase } from '../supabaseClient';

interface AuthContextType {
  currentUser: Employee | null;
  login: (email: string) => Promise<boolean>; // Return a promise
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
          // Optionally, handle this case, e.g., log out the user or redirect to an error page
        }
      }
      setLoading(false);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUser(); // Re-fetch user on auth state change
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string): Promise<boolean> => {
    console.log('AuthContext: login function called with email:', email);
    // This login function might be redundant if Supabase handles the actual login.
    // However, if it's used for a custom login flow, it should still find the employee.
    const employees = await getEmployees();
    const user = employees.find(emp => emp.email.toLowerCase() === email.toLowerCase());

    if (user) {
      setCurrentUser(user);
      console.log('AuthContext: setCurrentUser called with:', user);
      return true;
    }
    console.log('AuthContext: User not found in employees list.');
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    console.log('AuthContext: User logged out.');
  };

  if (loading) {
    return <div>Loading authentication...</div>; // Or a proper loading spinner
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
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
