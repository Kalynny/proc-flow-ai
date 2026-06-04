import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSistemasData, type Setor } from "@/lib/sistemas";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Plus, Trash2 } from "lucide-react";

export default function EditarProcedimento() {
  const { id } = useParams();
  const nav = useNavigate();
  const { role, user } = useAuth();
  const { setorNomes, subpastas: subpastasMap } = useSistemasData();
  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role && role !== "admin") { toast.error("Apenas administradores podem editar."); nav(`/procedimento/${id}`); return; }
    (async () => {
      if (!id) return;
      const { data, error } = await supabase.from("procedimentos").select("*").eq("id", id).maybeSingle();
      if (error) { toast.error(error.message); return; }
      setP({
        ...data,
        passo_a_passo: Array.isArray(data?.passo_a_passo) ? data.passo_a_passo : [],
        alertas: Array.isArray(data?.alertas) ? data.alertas : [],
        problemas_comuns: Array.isArray(data?.problemas_comuns) ? data.problemas_comuns : [],
      });
      setLoading(false);
    })();
  }, [id, role, nav]);

  async function salvar() {
    if (!p) return;
    setSaving(true);
    try {
      const payload = {
        codigo: p.codigo,
        titulo: p.titulo,
        setor: p.setor,
        objetivo: p.objetivo,
        responsavel: p.responsavel,
        sistemas: p.sistemas,
        passo_a_passo: p.passo_a_passo ?? [],
        alertas: p.alertas ?? [],
        problemas_comuns: p.problemas_comuns ?? [],
        video_url: p.video_url,
        google_drive_url: p.google_drive_url || null,
        versao: p.versao ?? "1.0",
        subpasta: p.subpasta || null,
      };
      const { error } = await supabase.from("procedimentos").update(payload).eq("id", id!);
      if (error) throw error;
      await supabase.from("procedimento_versoes").insert({
        procedimento_id: id!, versao: payload.versao, snapshot: payload, responsavel: payload.responsavel, created_by: user?.id,
      });
      toast.success("Treinamento atualizado!");
      nav(`/procedimento/${id}`);
    } catch (e: any) { toast.error(e.message ?? "Falha ao salvar"); }
    finally { setSaving(false); }
  }

  if (loading || !p) return <div className="p-10 text-muted-foreground">Carregando…</div>;

  const update = (k: string, v: any) => setP({ ...p, [k]: v });

  return (
    <div className="p-6 lg:p-10 max-w-[1100px] mx-auto">
      <Link to={`/procedimento/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <h1 className="text-3xl font-bold mb-1">Editar treinamento</h1>
      <p className="text-muted-foreground mb-6">Altere os campos abaixo. Uma nova entrada de versão será registrada.</p>

      <div className="glass rounded-xl p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Código"><input value={p.codigo ?? ""} onChange={(e) => update("codigo", e.target.value)} className={inp} /></Field>
          <Field label="Versão"><input value={p.versao ?? ""} onChange={(e) => update("versao", e.target.value)} className={inp} /></Field>
        </div>
        <Field label="Título"><input value={p.titulo ?? ""} onChange={(e) => update("titulo", e.target.value)} className={inp} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Setor">
            <select value={p.setor} onChange={(e) => update("setor", e.target.value as Setor)} className={inp}>
              {setorNomes.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Responsável"><input value={p.responsavel ?? ""} onChange={(e) => update("responsavel", e.target.value)} className={inp} /></Field>
        </div>
        {subpastasMap[p.setor as Setor]?.length ? (
          <Field label="Sub-pasta">
            <select value={p.subpasta ?? ""} onChange={(e) => update("subpasta", e.target.value || null)} className={inp}>
              <option value="">— Sem sub-pasta —</option>
              {subpastasMap[p.setor as Setor]!.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        ) : null}
        <Field label="Sistemas"><input value={p.sistemas ?? ""} onChange={(e) => update("sistemas", e.target.value)} className={inp} /></Field>
        <Field label="URL do vídeo (YouTube)"><input value={p.video_url ?? ""} onChange={(e) => update("video_url", e.target.value)} placeholder="https://youtu.be/…" className={inp} /></Field>
        <Field label="URL do Google Drive"><input value={p.google_drive_url ?? ""} onChange={(e) => update("google_drive_url", e.target.value)} placeholder="https://drive.google.com/…" className={inp} /></Field>
        <Field label="Objetivo">
          <textarea value={p.objetivo ?? ""} onChange={(e) => update("objetivo", e.target.value)} rows={3} className={inp + " resize-none"} />
        </Field>

        <ListEditor label="Passo a passo" items={p.passo_a_passo} onChange={(v) => update("passo_a_passo", v)} placeholder="Descreva o passo…" />
        <ListEditor label="Alertas" items={p.alertas} onChange={(v) => update("alertas", v)} placeholder="Atenção a…" />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground">Problemas comuns</label>
            <button onClick={() => update("problemas_comuns", [...p.problemas_comuns, { problema: "", solucao: "" }])}
              className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="size-3" /> Adicionar</button>
          </div>
          <div className="space-y-2">
            {p.problemas_comuns.map((row: any, i: number) => (
              <div key={i} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
                <input value={row.problema ?? ""} onChange={(e) => {
                  const next = [...p.problemas_comuns]; next[i] = { ...row, problema: e.target.value }; update("problemas_comuns", next);
                }} placeholder="Problema" className={inp} />
                <input value={row.solucao ?? ""} onChange={(e) => {
                  const next = [...p.problemas_comuns]; next[i] = { ...row, solucao: e.target.value }; update("problemas_comuns", next);
                }} placeholder="Solução" className={inp} />
                <button onClick={() => update("problemas_comuns", p.problemas_comuns.filter((_: any, k: number) => k !== i))}
                  className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
              </div>
            ))}
            {p.problemas_comuns.length === 0 && <p className="text-xs text-muted-foreground">Nenhum problema cadastrado.</p>}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <Link to={`/procedimento/${id}`} className="px-4 py-2 rounded-md border border-border text-sm hover:bg-muted/40">Cancelar</Link>
          <button onClick={salvar} disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full bg-background/60 border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>{children}</div>);
}

function ListEditor({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <button onClick={() => onChange([...(items ?? []), ""])} className="text-xs text-primary hover:underline flex items-center gap-1">
          <Plus className="size-3" /> Adicionar
        </button>
      </div>
      <div className="space-y-2">
        {(items ?? []).map((s, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-xs text-muted-foreground mt-2.5 w-5 text-right">{i + 1}.</span>
            <input value={s} onChange={(e) => { const next = [...items]; next[i] = e.target.value; onChange(next); }}
              placeholder={placeholder} className={inp} />
            <button onClick={() => onChange(items.filter((_, k) => k !== i))}
              className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
          </div>
        ))}
        {(!items || items.length === 0) && <p className="text-xs text-muted-foreground">Vazio.</p>}
      </div>
    </div>
  );
}
