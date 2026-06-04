import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSistemasData, type Setor } from "@/lib/sistemas";
import { toast } from "sonner";
import { Sparkles, Loader2, Save, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function NovoProcedimento() {
  const nav = useNavigate();
  const { setorNomes, subpastas: subpastasMap } = useSistemasData();
  const [setor, setSetor] = useState<Setor>(setorNomes[0] ?? "");
  const [subpasta, setSubpasta] = useState<string>("");
  const [conteudo, setConteudo] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [googleDriveUrl, setGoogleDriveUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<any>(null);

  async function gerarComIA() {
    if (!conteudo.trim()) { toast.error("Cole o conteúdo, transcrição ou descrição."); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-procedimento", {
        body: { conteudo, setor, video_url: videoUrl || null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDraft({ ...data, setor, subpasta: subpasta || null, video_url: videoUrl || null, google_drive_url: googleDriveUrl || null });
      toast.success("Treinamento gerado! Revise e salve.");
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao gerar");
    } finally { setGenerating(false); }
  }

  async function salvar() {
    if (!draft) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        codigo: draft.codigo,
        titulo: draft.titulo,
        setor: draft.setor,
        subpasta: draft.subpasta ?? null,
        objetivo: draft.objetivo,
        responsavel: draft.responsavel,
        sistemas: draft.sistemas,
        passo_a_passo: draft.passo_a_passo ?? [],
        alertas: draft.alertas ?? [],
        problemas_comuns: draft.problemas_comuns ?? [],
        video_url: draft.video_url,
        google_drive_url: draft.google_drive_url ?? null,
        versao: draft.versao ?? "1.0",
        created_by: user?.id,
      };
      const { data, error } = await supabase.from("procedimentos").insert(payload).select().single();
      if (error) throw error;
      await supabase.from("procedimento_versoes").insert({
        procedimento_id: data.id, versao: data.versao, snapshot: payload, responsavel: payload.responsavel, created_by: user?.id,
      });
      toast.success("Treinamento salvo!");
      nav(`/procedimento/${data.id}`);
    } catch (e: any) { toast.error(e.message ?? "Falha ao salvar"); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1100px] mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="size-4" /> Voltar</Link>
      <h1 className="text-3xl font-bold mb-1">Novo treinamento com IA</h1>
      <p className="text-muted-foreground mb-8">Cole transcrição, descrição ou passo a passo bruto. A IA estrutura e padroniza automaticamente.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="glass rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Setor</label>
            <select value={setor} onChange={(e) => { setSetor(e.target.value as Setor); setSubpasta(""); }}
              className="w-full mt-1 bg-background/60 border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
              {setorNomes.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          {(subpastasMap[setor] ?? []).length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Sub-pasta (opcional)</label>
              <select value={subpasta} onChange={(e) => setSubpasta(e.target.value)}
                className="w-full mt-1 bg-background/60 border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">— Nenhuma —</option>
                {(subpastasMap[setor] ?? []).map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground">URL do vídeo (YouTube — opcional)</label>
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtu.be/…"
              className="w-full mt-1 bg-background/60 border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">URL do Google Drive (opcional)</label>
            <input value={googleDriveUrl} onChange={(e) => setGoogleDriveUrl(e.target.value)} placeholder="https://drive.google.com/…"
              className="w-full mt-1 bg-background/60 border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Conteúdo / transcrição / descrição</label>
            <textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} rows={14}
              placeholder="Ex: Vídeo ensina emissão de CT-e. Abrir sistema, inserir NF, validar XML, emitir CT-e…"
              className="w-full mt-1 bg-background/60 border border-border rounded-md py-3 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          </div>
          <button onClick={gerarComIA} disabled={generating}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-md font-medium hover:bg-primary/90 transition disabled:opacity-60">
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {generating ? "Gerando…" : "Gerar com IA"}
          </button>
        </section>

        <section className="glass rounded-xl p-6">
          <h2 className="font-semibold mb-4">Pré-visualização</h2>
          {!draft ? (
            <div className="text-sm text-muted-foreground text-center py-20 border border-dashed border-border rounded-md">
              <Sparkles className="size-6 mx-auto mb-2 opacity-50" />
              O treinamento estruturado aparecerá aqui.
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <Edit label="Código" value={draft.codigo} onChange={(v) => setDraft({ ...draft, codigo: v })} />
              <Edit label="Título" value={draft.titulo} onChange={(v) => setDraft({ ...draft, titulo: v })} />
              <Edit label="Objetivo" value={draft.objetivo} onChange={(v) => setDraft({ ...draft, objetivo: v })} multiline />
              <Edit label="Responsável" value={draft.responsavel} onChange={(v) => setDraft({ ...draft, responsavel: v })} />
              <Edit label="Sistemas" value={draft.sistemas} onChange={(v) => setDraft({ ...draft, sistemas: v })} />
              <div>
                <div className="text-xs text-muted-foreground mb-1">Passo a passo</div>
                <ol className="space-y-1.5 list-decimal list-inside text-sm bg-background/40 rounded-md p-3">
                  {(draft.passo_a_passo ?? []).map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ol>
              </div>
              {(draft.alertas ?? []).length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Alertas</div>
                  <ul className="space-y-1 text-sm bg-background/40 rounded-md p-3">
                    {draft.alertas.map((a: string, i: number) => <li key={i}>• {a}</li>)}
                  </ul>
                </div>
              )}
              {(draft.problemas_comuns ?? []).length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Problemas comuns</div>
                  <ul className="space-y-2 text-sm bg-background/40 rounded-md p-3">
                    {draft.problemas_comuns.map((r: any, i: number) => (
                      <li key={i}><strong>{r.problema}</strong> — <span className="text-muted-foreground">{r.solucao}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              <button onClick={salvar} disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-md font-medium hover:bg-primary/90 transition disabled:opacity-60">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar treinamento
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Edit({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      {multiline
        ? <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={3}
            className="w-full bg-background/60 border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
        : <input value={value ?? ""} onChange={(e) => onChange(e.target.value)}
            className="w-full bg-background/60 border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />}
    </div>
  );
}
