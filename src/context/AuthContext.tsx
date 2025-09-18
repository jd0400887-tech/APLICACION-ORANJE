import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Employee, Candidate, getEmployees } from '../data/database'; // Import Candidate
import { supabase } from '../supabaseClient';

export interface Profile {
  id: string; // Supabase user ID
  username: string;
  role: string; // e.g., 'Admin', 'Employee', 'Candidate', 'GeneralUser'
  // Add other relevant fields from your profiles table
}

interface AuthContextType {
  currentUser: Employee | Candidate | Profile | null;
  updateCurrentUser: (user: Employee | Candidate | Profile) => void;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  signUp: (email: string, password: string) => Promise<{ data: any, error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Employee | Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        // First, try to fetch from the profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (profileError) {
          console.error('AuthContext: Error fetching profile:', profileError);
          setLoading(false);
          return;
        }

        if (profileData) {
          // Now, based on the role in the profile, fetch from employees or candidates
          if (profileData.role === 'Trabajador') { // Assuming 'Trabajador' is a role for employees
            const employees = await getEmployees();
            const employeeUser = employees.find(emp => emp.email.toLowerCase() === supabaseUser.email?.toLowerCase());
            if (employeeUser) {
              setCurrentUser(employeeUser);
            } else {
              console.warn('AuthContext: Profile found, but no matching employee.');
              setCurrentUser(profileData as Profile); // Set as general profile if no specific employee
            }
          } else if (profileData.role === 'Candidato') { // Assuming 'Candidato' is a role for candidates
            const { data: candidatesData, error: candidatesError } = await supabase
              .from('candidates')
              .select('*')
              .eq('email', supabaseUser.email?.toLowerCase());

            if (candidatesError) {
              console.error('AuthContext: Error fetching candidate:', candidatesError);
              setCurrentUser(profileData as Profile); // Set as general profile if error
            } else if (candidatesData && candidatesData.length > 0) {
              setCurrentUser(candidatesData[0] as Candidate);
            } else {
              console.warn('AuthContext: Profile found, but no matching candidate.');
              setCurrentUser(profileData as Profile); // Set as general profile if no specific candidate
            }
          } else {
            // Handle other roles or general users
            setCurrentUser(profileData as Profile);
          }
        } else {
          console.warn('AuthContext: Supabase user found, but no matching profile.');
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
    // This function is primarily for setting currentUser after Supabase auth.
    // The actual fetching of user data from profiles/employees/candidates
    // should primarily happen in fetchUser, which is triggered by authStateChange.
    // For login, we just need to ensure the user is authenticated with Supabase,
    // and then fetchUser will handle setting the currentUser.
    // So, this function might become simpler, or even just trigger fetchUser.

    // After a successful Supabase authentication, fetch the user profile using the Supabase user ID.
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      console.warn('AuthContext: No Supabase user found during login attempt.');
      return false;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id) // Use supabaseUser.id to query the profiles table
      .single();

    if (profileError) {
      console.error('AuthContext: Error fetching profile during login:', profileError);
      return false;
    }

    if (profileData) {
      if (profileData.role === 'Trabajador') {
        const employees = await getEmployees();
        const employeeUser = employees.find(emp => emp.email.toLowerCase() === supabaseUser.email?.toLowerCase());
        if (employeeUser) {
          setCurrentUser(employeeUser);
          return true;
        }
      } else if (profileData.role === 'Candidato') {
        const { data: candidatesData, error: candidatesError } = await supabase
          .from('candidates')
          .select('*')
          .eq('email', supabaseUser.email?.toLowerCase());
        if (candidatesError) {
          console.error('AuthContext: Error fetching candidate during login:', candidatesError);
          return false;
        }
        if (candidatesData && candidatesData.length > 0) {
          setCurrentUser(candidatesData[0] as Candidate);
          return true;
        }
      } else {
        // General user or other role
        setCurrentUser(profileData as Profile);
        return true;
      }
    }
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  const updateCurrentUser = (user: Employee | Candidate) => {
    setCurrentUser(user);
  };

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider value={{ currentUser, updateCurrentUser, login, logout, signUp }}>
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