import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Truck, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já pode entrar.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav("/");
      }
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
    finally { setLoading(false); }
  }

  async function google() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google", options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) { toast.error(error.message); setLoading(false); }
  }

  async function forgotPassword() {
    if (!email) { toast.error("Digite seu email primeiro"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Email de redefinição enviado! Verifique sua caixa de entrada.");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative grid-bg bg-card/30 p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/20 grid place-items-center"><Truck className="size-5 text-primary" /></div>
          <div className="font-bold text-lg">Portal de Conhecimento</div>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight mb-4">Treinamentos<br/><span className="text-primary">automatizados por IA</span></h1>
          <p className="text-muted-foreground max-w-md">Vídeos, PDFs e QR Codes gerados automaticamente. Treinamento padronizado para toda a operação da transportadora.</p>
        </div>
        <div className="relative text-xs text-muted-foreground">© Portal de Conhecimento</div>
      </div>

      <div className="grid place-items-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5 glass rounded-xl p-7">
          <div>
            <h2 className="text-2xl font-bold">{mode === "signin" ? "Entrar" : "Criar conta"}</h2>
            <p className="text-sm text-muted-foreground mt-1">Acesse o Portal de Conhecimento da Imediata Transportes</p>
          </div>

          <button type="button" onClick={google} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-border bg-background hover:bg-muted/60 text-sm font-medium transition">
            <svg className="size-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.4c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.33 9.14 5.4 12 5.4Z"/></svg>
            Continuar com Google
          </button>

          <div className="relative text-center text-xs text-muted-foreground">
            <span className="bg-card px-2 relative z-10">ou com email</span>
            <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
          </div>

          {mode === "signup" && (
            <Field icon={<Mail className="size-4" />} placeholder="Nome completo" value={name} onChange={(v) => setName(v)} />
          )}
          <Field icon={<Mail className="size-4" />} type="email" placeholder="email@empresa.com" value={email} onChange={setEmail} />
          <Field icon={<Lock className="size-4" />} type="password" placeholder="Senha" value={password} onChange={setPassword} />

          <button disabled={loading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-medium hover:bg-primary/90 transition flex items-center justify-center gap-2">
            {loading && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Entrar" : "Criar conta"}
          </button>

          <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-sm text-muted-foreground hover:text-foreground">
            {mode === "signin" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
          </button>

          {mode === "signin" && (
            <button type="button" onClick={forgotPassword} disabled={loading}
              className="w-full text-xs text-muted-foreground hover:text-primary">
              Esqueci minha senha
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function Field({ icon, type = "text", placeholder, value, onChange }:
  { icon: React.ReactNode; type?: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
      <input type={type} required placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background/60 border border-border rounded-md py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
    </div>
  );
}
