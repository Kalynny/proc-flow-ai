import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";

export default function ResetPassword() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else { toast.error("Link inválido ou expirado"); nav("/login"); }
    });
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha redefinida! Faça login novamente.");
      await supabase.auth.signOut();
      nav("/login");
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
    finally { setLoading(false); }
  }

  if (!ready) return <div className="grid place-items-center h-screen text-muted-foreground">Carregando…</div>;

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 glass rounded-xl p-7">
        <div>
          <h2 className="text-2xl font-bold">Redefinir senha</h2>
          <p className="text-sm text-muted-foreground mt-1">Defina sua nova senha</p>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Lock className="size-4" /></span>
          <input type="password" required minLength={6} placeholder="Nova senha" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-background/60 border border-border rounded-md py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <button disabled={loading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-medium hover:bg-primary/90 transition flex items-center justify-center gap-2">
          {loading && <Loader2 className="size-4 animate-spin" />}
          Salvar nova senha
        </button>
      </form>
    </div>
  );
}
