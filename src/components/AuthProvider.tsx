import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "editor" | "viewer" | null;
type Ctx = {
  user: User | null; session: Session | null; role: Role;
  sistemas: string[]; loading: boolean;
  signOut: () => Promise<void>;
};
const AuthCtx = createContext<Ctx>({ user: null, session: null, role: null, sistemas: [], loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [sistemas, setSistemas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s); setUser(s?.user ?? null);
      if (s?.user) setTimeout(() => loadAccess(s.user.id), 0);
      else { setRole(null); setSistemas([]); }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session); setUser(data.session?.user ?? null);
      if (data.session?.user) loadAccess(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadAccess(uid: string) {
    const [{ data: rs }, { data: ss }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("user_sistemas").select("sistema").eq("user_id", uid),
    ]);
    if (!rs || rs.length === 0) setRole("viewer");
    else {
      const roles = rs.map((r) => r.role);
      if (roles.includes("admin")) setRole("admin");
      else if (roles.includes("editor")) setRole("editor");
      else setRole("viewer");
    }
    setSistemas((ss ?? []).map((s: any) => s.sistema));
  }

  return (
    <AuthCtx.Provider value={{ user, session, role, sistemas, loading, signOut: async () => { await supabase.auth.signOut(); } }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="grid place-items-center h-screen text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  return <>{children}</>;
}
