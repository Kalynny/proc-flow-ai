import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { DEPARTAMENTOS, SISTEMA_NOMES } from "@/lib/utils";
import { toast } from "sonner";
import { Shield, Loader2, Check } from "lucide-react";

type Row = {
  id: string;
  email: string | null;
  full_name: string | null;
  departamento: string | null;
  role: "admin" | "editor" | "viewer";
  sistemas: string[];
};

export default function Permissoes() {
  const { role } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => { if (role === "admin") load(); else setLoading(false); }, [role]);

  async function load() {
    setLoading(true);
    const [{ data: profs }, { data: roles }, { data: sists }] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, departamento").order("email"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("user_sistemas").select("user_id, sistema"),
    ]);
    const roleMap = new Map<string, Row["role"]>();
    (roles ?? []).forEach((r: any) => {
      const cur = roleMap.get(r.user_id);
      const rank = (x: string) => x === "admin" ? 1 : x === "editor" ? 2 : 3;
      if (!cur || rank(r.role) < rank(cur)) roleMap.set(r.user_id, r.role);
    });
    const sistMap = new Map<string, string[]>();
    (sists ?? []).forEach((s: any) => {
      const arr = sistMap.get(s.user_id) ?? [];
      arr.push(s.sistema);
      sistMap.set(s.user_id, arr);
    });
    setRows((profs ?? []).map((p: any) => ({
      id: p.id, email: p.email, full_name: p.full_name,
      departamento: p.departamento, role: roleMap.get(p.id) ?? "viewer",
      sistemas: sistMap.get(p.id) ?? [],
    })));
    setLoading(false);
  }

  async function updateDepartamento(id: string, dep: string) {
    setSavingId(id);
    const { error } = await supabase.from("profiles").update({ departamento: dep || null }).eq("id", id);
    setSavingId(null);
    if (error) { toast.error(error.message); return; }
    setRows((r) => r.map((x) => x.id === id ? { ...x, departamento: dep || null } : x));
    toast.success("Departamento atualizado");
  }

  async function updateRole(id: string, newRole: Row["role"]) {
    setSavingId(id);
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", id);
    if (delErr) { setSavingId(null); toast.error(delErr.message); return; }
    const { error: insErr } = await supabase.from("user_roles").insert({ user_id: id, role: newRole });
    setSavingId(null);
    if (insErr) { toast.error(insErr.message); return; }
    setRows((r) => r.map((x) => x.id === id ? { ...x, role: newRole } : x));
    toast.success("Permissão atualizada");
  }

  async function toggleSistema(id: string, sistema: string, checked: boolean) {
    setSavingId(id);
    if (checked) {
      const { error } = await supabase.from("user_sistemas").insert({ user_id: id, sistema });
      setSavingId(null);
      if (error) { toast.error(error.message); return; }
      setRows((r) => r.map((x) => x.id === id ? { ...x, sistemas: [...x.sistemas, sistema] } : x));
    } else {
      const { error } = await supabase.from("user_sistemas").delete().eq("user_id", id).eq("sistema", sistema);
      setSavingId(null);
      if (error) { toast.error(error.message); return; }
      setRows((r) => r.map((x) => x.id === id ? { ...x, sistemas: x.sistemas.filter((s) => s !== sistema) } : x));
    }
  }

  if (role !== "admin") {
    return (
      <div className="p-8">
        <div className="glass rounded-xl p-8 text-center max-w-md mx-auto">
          <Shield className="size-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold mb-1">Acesso restrito</h2>
          <p className="text-sm text-muted-foreground">Apenas administradores podem gerenciar permissões.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 rounded-lg bg-primary/15 grid place-items-center">
          <Shield className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Painel de Permissões</h1>
          <p className="text-sm text-muted-foreground">Gerencie departamento, nível de acesso e sistemas liberados por usuário.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
      ) : (
        <div className="glass rounded-xl overflow-visible">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Usuário</th>
                <th className="text-left px-4 py-3">Departamento</th>
                <th className="text-left px-4 py-3">Nível</th>
                <th className="text-left px-4 py-3">Sistemas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t border-border/40 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.departamento ?? ""}
                      disabled={savingId === u.id}
                      onChange={(e) => updateDepartamento(u.id, e.target.value)}
                      className="bg-background/60 border border-border rounded-md py-1.5 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">—</option>
                      {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={savingId === u.id}
                      onChange={(e) => updateRole(u.id, e.target.value as Row["role"])}
                      className="bg-background/60 border border-border rounded-md py-1.5 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      type="button"
                      onClick={() => setOpenId(openId === u.id ? null : u.id)}
                      className="bg-background/60 border border-border rounded-md py-1.5 px-3 text-sm hover:bg-muted/60 min-w-[200px] text-left"
                    >
                      {u.sistemas.length === 0
                        ? <span className="text-muted-foreground">Nenhum sistema</span>
                        : <span>{u.sistemas.length} sistema{u.sistemas.length > 1 ? "s" : ""} selecionado{u.sistemas.length > 1 ? "s" : ""}</span>}
                    </button>
                    {openId === u.id && (
                      <div className="absolute z-20 mt-2 w-72 max-h-72 overflow-auto glass rounded-lg border border-border shadow-xl p-2">
                        {SISTEMA_NOMES.map((s) => {
                          const checked = u.sistemas.includes(s);
                          return (
                            <label key={s} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={savingId === u.id}
                                onChange={(e) => toggleSistema(u.id, s, e.target.checked)}
                                className="sr-only"
                              />
                              <span className={`size-4 rounded border grid place-items-center ${checked ? "bg-primary border-primary" : "border-border"}`}>
                                {checked && <Check className="size-3 text-primary-foreground" />}
                              </span>
                              {s}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
