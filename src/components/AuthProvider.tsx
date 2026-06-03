import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "editor" | "viewer" | null;
type Ctx = { user: User | null; session: Session | null; role: Role; loading: boolean; signOut: () => Promise<void> };
const AuthCtx = createContext<Ctx>({ user: null, session: null, role: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s); setUser(s?.user ?? null);
      if (s?.user) setTimeout(() => loadRole(s.user.id), 0); else setRole(null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session); setUser(data.session?.user ?? null);
      if (data.session?.user) loadRole(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadRole(uid: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    if (!data || data.length === 0) { setRole("viewer"); return; }
    const roles = data.map((r) => r.role);
    if (roles.includes("admin")) setRole("admin");
    else if (roles.includes("editor")) setRole("editor");
    else setRole("viewer");
  }

  return (
    <AuthCtx.Provider value={{ user, session, role, loading, signOut: async () => { await supabase.auth.signOut(); } }}>
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
