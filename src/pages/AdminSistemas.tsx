import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useSistemasData, type SetorRow, type Sistema } from "@/lib/sistemas";
import { toast } from "sonner";
import { Settings, Plus, Trash2, Save, X, Loader2, FolderTree, Layers, Folder } from "lucide-react";

const inp = "w-full bg-background/60 border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

export default function AdminSistemas() {
  const { role, loading: authLoading } = useAuth();
  const { sistemas, setores, setorByName, reload, loading } = useSistemasData();
  const [tab, setTab] = useState<"sistemas" | "setores" | "subpastas">("sistemas");

  if (authLoading || loading) return <div className="p-10 text-muted-foreground">Carregando…</div>;
  if (role !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <div className="size-9 rounded-md bg-primary/15 grid place-items-center text-primary"><Settings className="size-5" /></div>
        <h1 className="text-3xl font-bold">Sistemas, Setores e Subpastas</h1>
      </div>
      <p className="text-muted-foreground mb-6">Gerencie a estrutura usada em todo o portal. Apenas administradores.</p>

      <div className="flex gap-1 border-b border-border mb-6">
        <TabBtn active={tab === "sistemas"} onClick={() => setTab("sistemas")} icon={<Layers className="size-3.5" />}>Sistemas ({sistemas.length})</TabBtn>
        <TabBtn active={tab === "setores"} onClick={() => setTab("setores")} icon={<FolderTree className="size-3.5" />}>Setores ({setores.length})</TabBtn>
        <TabBtn active={tab === "subpastas"} onClick={() => setTab("subpastas")} icon={<Folder className="size-3.5" />}>Subpastas</TabBtn>
      </div>

      {tab === "sistemas" && <SistemasTab sistemas={sistemas} setores={setores} reload={reload} />}
      {tab === "setores" && <SetoresTab setores={setores} reload={reload} />}
      {tab === "subpastas" && <SubpastasTab setores={setores} setorByName={setorByName} reload={reload} />}
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: any) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 -mb-px transition ${active ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
      {icon}{children}
    </button>
  );
}

/* ---------------------------- SISTEMAS ---------------------------- */
function SistemasTab({ sistemas, setores, reload }: { sistemas: Sistema[]; setores: SetorRow[]; reload: () => Promise<void> }) {
  const [editing, setEditing] = useState<Sistema | "new" | null>(null);
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setEditing("new")} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm hover:bg-primary/90"><Plus className="size-4" /> Novo sistema</button>
      </div>
      <div className="grid gap-3">
        {sistemas.map((s) => (
          <div key={s.id} className="glass rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{s.nome}</div>
                {s.descricao && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.descricao}</p>}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {s.setores.map((r) => <span key={r.setor} className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary">{r.label}</span>)}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(s)} className="px-3 py-1.5 rounded-md text-xs border border-border hover:bg-muted/40">Editar</button>
                <button onClick={async () => {
                  if (!confirm(`Excluir sistema "${s.nome}"?`)) return;
                  const { error } = await supabase.from("sistemas" as any).delete().eq("id", s.id);
                  if (error) toast.error(error.message); else { toast.success("Excluído"); reload(); }
                }} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted/40"><Trash2 className="size-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {sistemas.length === 0 && <div className="text-center text-muted-foreground py-12">Nenhum sistema cadastrado.</div>}
      </div>
      {editing && <SistemaForm sistema={editing === "new" ? null : editing} setores={setores} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

function SistemaForm({ sistema, setores, onClose, onSaved }: { sistema: Sistema | null; setores: SetorRow[]; onClose: () => void; onSaved: () => void }) {
  const [nome, setNome] = useState(sistema?.nome ?? "");
  const [descricao, setDescricao] = useState(sistema?.descricao ?? "");
  const [finalidade, setFinalidade] = useState(sistema?.finalidade ?? "");
  const [ordem, setOrdem] = useState(sistema?.ordem ?? 0);
  const [selSetores, setSelSetores] = useState<Set<string>>(new Set(sistema?.setores.map((r) => r.setor) ?? []));
  const [saving, setSaving] = useState(false);

  async function salvar() {
    if (!nome.trim()) { toast.error("Nome obrigatório"); return; }
    setSaving(true);
    try {
      let sistemaId = sistema?.id;
      if (sistema) {
        const { error } = await supabase.from("sistemas" as any).update({ nome, descricao, finalidade, ordem }).eq("id", sistema.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("sistemas" as any).insert({ nome, descricao, finalidade, ordem }).select().single();
        if (error) throw error;
        sistemaId = (data as any).id;
      }
      // Sync sistema_setores
      const setorIds = setores.filter((s) => selSetores.has(s.nome)).map((s) => s.id);
      await supabase.from("sistema_setores" as any).delete().eq("sistema_id", sistemaId!);
      if (setorIds.length > 0) {
        const rows = setorIds.map((sid, i) => ({ sistema_id: sistemaId, setor_id: sid, ordem: (i + 1) * 10 }));
        const { error } = await supabase.from("sistema_setores" as any).insert(rows);
        if (error) throw error;
      }
      toast.success("Salvo");
      onSaved();
    } catch (e: any) { toast.error(e.message ?? "Falha"); }
    finally { setSaving(false); }
  }

  return (
    <Modal onClose={onClose} title={sistema ? `Editar ${sistema.nome}` : "Novo sistema"}>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-[1fr_120px] gap-3">
          <Field label="Nome"><input value={nome} onChange={(e) => setNome(e.target.value)} className={inp} /></Field>
          <Field label="Ordem"><input type="number" value={ordem} onChange={(e) => setOrdem(parseInt(e.target.value) || 0)} className={inp} /></Field>
        </div>
        <Field label="Descrição"><textarea value={descricao ?? ""} onChange={(e) => setDescricao(e.target.value)} rows={2} className={inp + " resize-none"} /></Field>
        <Field label="Finalidade"><textarea value={finalidade ?? ""} onChange={(e) => setFinalidade(e.target.value)} rows={2} className={inp + " resize-none"} /></Field>
        <Field label="Setores vinculados">
          <div className="grid sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto p-3 bg-background/40 rounded-md border border-border">
            {setores.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 rounded px-2 py-1">
                <input type="checkbox" checked={selSetores.has(s.nome)} onChange={(e) => {
                  const next = new Set(selSetores);
                  if (e.target.checked) next.add(s.nome); else next.delete(s.nome);
                  setSelSetores(next);
                }} />
                {s.nome}
              </label>
            ))}
          </div>
        </Field>
        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-border text-sm hover:bg-muted/40">Cancelar</button>
          <button onClick={salvar} disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------- SETORES ---------------------------- */
function SetoresTab({ setores, reload }: { setores: SetorRow[]; reload: () => Promise<void> }) {
  const [novo, setNovo] = useState("");
  const [novoOrdem, setNovoOrdem] = useState(0);
  const [editing, setEditing] = useState<SetorRow | null>(null);

  async function criar() {
    const nome = novo.trim();
    if (!nome) { toast.error("Informe o nome do setor"); return; }
    const ordem = novoOrdem || (setores.length + 1) * 10;
    const { error } = await supabase.from("setores" as any).insert({ nome, ordem });
    if (error) { toast.error(error.message); return; }
    setNovo(""); setNovoOrdem(0); toast.success("Setor criado"); await reload();
  }

  return (
    <div className="space-y-3">
      <div className="glass rounded-lg p-4 flex flex-wrap gap-2 items-end">
        <Field label="Novo setor" className="flex-1 min-w-[200px]"><input value={novo} onChange={(e) => setNovo(e.target.value)} className={inp} /></Field>
        <Field label="Ordem"><input type="number" value={novoOrdem} onChange={(e) => setNovoOrdem(parseInt(e.target.value) || 0)} className={inp + " w-24"} /></Field>
        <button onClick={criar} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm hover:bg-primary/90"><Plus className="size-4" /> Adicionar</button>
      </div>
      <div className="glass rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr><th className="text-left px-4 py-2">Nome</th><th className="text-left px-4 py-2 w-32">Ordem</th><th className="w-28"></th></tr>
          </thead>
          <tbody>
            {setores.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-2">{s.nome}</td>
                <td className="px-4 py-2 text-muted-foreground">{s.ordem}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => setEditing(s)} className="px-2 py-1 text-xs border border-border rounded hover:bg-muted/40 mr-1">Editar</button>
                  <button onClick={async () => {
                    if (!confirm(`Excluir setor "${s.nome}"? Treinamentos vinculados podem ficar órfãos.`)) return;
                    const { error } = await supabase.from("setores" as any).delete().eq("id", s.id);
                    if (error) toast.error(error.message); else { toast.success("Excluído"); reload(); }
                  }} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <SetorEditModal setor={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

function SetorEditModal({ setor, onClose, onSaved }: { setor: SetorRow; onClose: () => void; onSaved: () => void }) {
  const [nome, setNome] = useState(setor.nome);
  const [ordem, setOrdem] = useState(setor.ordem);
  const [saving, setSaving] = useState(false);
  async function salvar() {
    setSaving(true);
    const { error } = await supabase.from("setores" as any).update({ nome, ordem }).eq("id", setor.id);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("Salvo"); onSaved(); }
  }
  return (
    <Modal onClose={onClose} title={`Editar ${setor.nome}`}>
      <div className="space-y-3">
        <Field label="Nome"><input value={nome} onChange={(e) => setNome(e.target.value)} className={inp} /></Field>
        <Field label="Ordem"><input type="number" value={ordem} onChange={(e) => setOrdem(parseInt(e.target.value) || 0)} className={inp} /></Field>
        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-border text-sm">Cancelar</button>
          <button onClick={salvar} disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------- SUBPASTAS ---------------------------- */
type SubRow = { id: string; nome: string; ordem: number; setor_id: string };

function SubpastasTab({ setores, setorByName, reload }: { setores: SetorRow[]; setorByName: Record<string, SetorRow>; reload: () => Promise<void> }) {
  const [selSetor, setSelSetor] = useState<string>(setores[0]?.nome ?? "");
  const [nova, setNova] = useState("");
  const [novaOrdem, setNovaOrdem] = useState(0);
  const [rows, setRows] = useState<SubRow[]>([]);
  const [editing, setEditing] = useState<SubRow | null>(null);
  const setor = setorByName[selSetor];

  async function carregar() {
    if (!setor) { setRows([]); return; }
    const { data } = await supabase.from("subpastas" as any).select("*").eq("setor_id", setor.id).order("ordem").order("nome");
    setRows(((data ?? []) as unknown) as SubRow[]);
  }
  useEffect(() => { carregar(); /* eslint-disable-next-line */ }, [selSetor, setor?.id]);

  async function criar() {
    if (!nova.trim() || !setor) return;
    const { error } = await supabase.from("subpastas" as any).insert({ setor_id: setor.id, nome: nova.trim(), ordem: novaOrdem || (rows.length + 1) * 10 });
    if (error) { toast.error(error.message); return; }
    setNova(""); setNovaOrdem(0); toast.success("Criada");
    await carregar(); reload();
  }
  async function excluir(r: SubRow) {
    if (!confirm(`Excluir subpasta "${r.nome}"?`)) return;
    const { error } = await supabase.from("subpastas" as any).delete().eq("id", r.id);
    if (error) toast.error(error.message);
    else { toast.success("Excluída"); await carregar(); reload(); }
  }

  return (
    <div className="space-y-3">
      <div className="glass rounded-lg p-4 flex flex-wrap gap-2 items-end">
        <Field label="Setor" className="min-w-[220px]">
          <select value={selSetor} onChange={(e) => setSelSetor(e.target.value)} className={inp}>
            {setores.map((s) => <option key={s.id} value={s.nome}>{s.nome}</option>)}
          </select>
        </Field>
        <Field label="Nova subpasta" className="flex-1 min-w-[200px]"><input value={nova} onChange={(e) => setNova(e.target.value)} className={inp} /></Field>
        <Field label="Ordem"><input type="number" value={novaOrdem} onChange={(e) => setNovaOrdem(parseInt(e.target.value) || 0)} className={inp + " w-24"} /></Field>
        <button onClick={criar} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm hover:bg-primary/90"><Plus className="size-4" /> Adicionar</button>
      </div>
      <div className="glass rounded-lg overflow-hidden">
        <div className="px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground/70 bg-muted/30 border-b border-border">
          Subpastas de {selSetor || "—"}
        </div>
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Nenhuma subpasta.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/20 text-xs uppercase text-muted-foreground">
              <tr><th className="text-left px-4 py-2">Nome</th><th className="text-left px-4 py-2 w-32">Ordem</th><th className="w-28"></th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2">{r.nome}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.ordem}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => setEditing(r)} className="px-2 py-1 text-xs border border-border rounded hover:bg-muted/40 mr-1">Editar</button>
                    <button onClick={() => excluir(r)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {editing && (
        <SubpastaEditModal sub={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await carregar(); reload(); }} />
      )}
    </div>
  );
}

function SubpastaEditModal({ sub, onClose, onSaved }: { sub: SubRow; onClose: () => void; onSaved: () => void }) {
  const [nome, setNome] = useState(sub.nome);
  const [ordem, setOrdem] = useState(sub.ordem);
  const [saving, setSaving] = useState(false);
  async function salvar() {
    if (!nome.trim()) { toast.error("Nome obrigatório"); return; }
    setSaving(true);
    const { error } = await supabase.from("subpastas" as any).update({ nome: nome.trim(), ordem }).eq("id", sub.id);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("Salvo"); onSaved(); }
  }
  return (
    <Modal onClose={onClose} title={`Editar ${sub.nome}`}>
      <div className="space-y-3">
        <Field label="Nome"><input value={nome} onChange={(e) => setNome(e.target.value)} className={inp} /></Field>
        <Field label="Ordem"><input type="number" value={ordem} onChange={(e) => setOrdem(parseInt(e.target.value) || 0)} className={inp} /></Field>
        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-border text-sm">Cancelar</button>
          <button onClick={salvar} disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------- helpers ---------------------------- */
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>{children}</div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
          <div className="font-semibold">{title}</div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted/40"><X className="size-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
