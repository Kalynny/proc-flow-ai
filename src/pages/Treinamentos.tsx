import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { codigoNum } from "@/lib/utils";
import { toast } from "sonner";
import { Search, Pencil, Trash2, Plus, Eye, Loader2, BookOpen } from "lucide-react";

type Proc = {
  id: string; codigo: string; titulo: string; setor: string;
  subpasta: string | null; sistemas: string | null;
  versao: string; updated_at: string;
};

export default function Treinamentos() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const canEdit = role === "admin" || role === "editor";

  const [items, setItems] = useState<Proc[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [setor, setSetor] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("procedimentos")
      .select("id,codigo,titulo,setor,subpasta,sistemas,versao,updated_at");
    if (error) toast.error(error.message);
    const sorted = (data ?? []).slice().sort((a: any, b: any) =>
      a.setor.localeCompare(b.setor, "pt-BR") ||
      codigoNum(a.codigo) - codigoNum(b.codigo) ||
      a.codigo.localeCompare(b.codigo, "pt-BR")
    );
    setItems(sorted as Proc[]);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const { error } = await supabase.from("procedimentos").delete().eq("id", id);
    setDeletingId(null);
    setConfirmId(null);
    if (error) { toast.error(error.message); return; }
    setItems((r) => r.filter((x) => x.id !== id));
    toast.success("Treinamento excluído");
  }

  const setores = useMemo(
    () => Array.from(new Set(items.map((i) => i.setor))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [items]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((p) => {
      if (setor && p.setor !== setor) return false;
      if (!s) return true;
      return `${p.codigo} ${p.titulo} ${p.setor} ${p.subpasta ?? ""} ${p.sistemas ?? ""}`.toLowerCase().includes(s);
    });
  }, [items, q, setor]);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/15 grid place-items-center">
            <BookOpen className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Treinamentos</h1>
            <p className="text-sm text-muted-foreground">Gerencie todos os treinamentos cadastrados.</p>
          </div>
        </div>
        {canEdit && (
          <Link to="/novo" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition">
            <Plus className="size-4" /> Novo treinamento
          </Link>
        )}
      </div>

      <div className="glass rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código, título, setor, sistema…"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        <select
          value={setor}
          onChange={(e) => setSetor(e.target.value)}
          className="bg-background/60 border border-border rounded-md py-1.5 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">Todos os setores</option>
          {setores.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="text-xs text-muted-foreground">{filtered.length} de {items.length}</div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Nenhum treinamento encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Código</th>
                  <th className="text-left px-4 py-3">Título</th>
                  <th className="text-left px-4 py-3">Setor</th>
                  <th className="text-left px-4 py-3">Sistema</th>
                  <th className="text-left px-4 py-3">Versão</th>
                  <th className="text-left px-4 py-3">Atualizado</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border/40 hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{p.codigo}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.titulo}</div>
                      {p.subpasta && <div className="text-xs text-muted-foreground">{p.subpasta}</div>}
                    </td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-muted/60">{p.setor}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.sistemas ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">v{p.versao}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.updated_at).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/procedimento/${p.id}`}
                          className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                          title="Visualizar"
                        >
                          <Eye className="size-4" />
                        </Link>
                        {canEdit && (
                          <Link
                            to={`/procedimento/${p.id}/editar`}
                            className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                            title="Editar"
                          >
                            <Pencil className="size-4" />
                          </Link>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setConfirmId(p.id)}
                            disabled={deletingId === p.id}
                            className="p-1.5 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive disabled:opacity-50"
                            title="Excluir"
                          >
                            {deletingId === p.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setConfirmId(null)}>
          <div className="glass rounded-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Excluir treinamento?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Esta ação não pode ser desfeita. O treinamento e seu histórico de versões serão removidos.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 rounded-md text-sm border border-border hover:bg-muted/60"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={deletingId === confirmId}
                className="px-4 py-2 rounded-md text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-2"
              >
                {deletingId === confirmId && <Loader2 className="size-4 animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
