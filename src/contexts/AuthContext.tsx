import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userRole: string | null;
  userRoles: string[];
  /** True until the signed-in user's roles have been read from the database. */
  rolesLoading: boolean;
}

/** Highest-privilege role wins when a user holds several. */
const ROLE_PRECEDENCE = [
  "admin",
  "principal_investigator",
  "safety_monitor",
  "psychiatrist",
  "mh_nurse",
  "chw",
  "viewer",
];

const resolvePrimaryRole = (roles: string[]): string | null => {
  if (!roles.length) return null;
  for (const r of ROLE_PRECEDENCE) {
    if (roles.includes(r)) return r;
  }
  return roles[0];
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  userRole: null,
  userRoles: [],
  rolesLoading: true,
});


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role when session changes
        if (session?.user) {
          setRolesLoading(true);
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setUserRoles([]);
          setRolesLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setRolesLoading(true);
        fetchUserRole(session.user.id);
      } else {
        setRolesLoading(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;
      const roles = (data ?? []).map((r) => r.role as string);
      setUserRoles(roles);
      setUserRole(resolvePrimaryRole(roles));
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRoles([]);
      setUserRole(null);
    } finally {
      setRolesLoading(false);
    }
  };


  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setUserRoles([]);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, userRole, userRoles, rolesLoading }}>

      {children}
    </AuthContext.Provider>
  );
};
