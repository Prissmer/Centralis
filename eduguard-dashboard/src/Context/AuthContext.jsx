import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFallbackRole = async (userObj) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userObj.id)
          .single();
          
        if (data && data.role) {
          // Sync metadata so next time it's instant
          await supabase.auth.updateUser({ data: { role: data.role } });
          return data.role;
        }
      } catch (err) {
        console.error("Failed to fetch fallback role:", err);
      }
      return null;
    };

    // 1. Get initial session from local storage (Fast!)
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        let userRole = session.user.user_metadata?.role;
        
        if (!userRole) {
          userRole = await fetchFallbackRole(session.user);
        }
        
        console.log("User role:", userRole);
        setUser({ ...session.user, role: userRole });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();

    // 2. Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        let userRole = session.user.user_metadata?.role;
        
        if (!userRole) {
          userRole = await fetchFallbackRole(session.user);
        }
        
        console.log("User role:", userRole);
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