import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session from local storage (Fast!)
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Extract role from metadata immediately
        const userRole = session.user.user_metadata?.role;
        setUser({ ...session.user, role: userRole });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();

    // 2. Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const userRole = session.user.user_metadata?.role;
        setUser({ ...session.user, role: userRole });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Logout Error:", error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);