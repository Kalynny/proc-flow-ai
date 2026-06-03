import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, QrCode as QrIcon, History, AlertTriangle, Wrench, Video, Pencil, Save, X, Trash2, ExternalLink, Copy } from "lucide-react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { youtubeEmbed } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

export default function ProcedimentoPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { role } = useAuth();
  const canEdit = role === "admin";
  const canClone = role === "admin" || role === "editor";
  const [p, setP] = useState<any>(null);
  const [versoes, setVersoes] = useState<any[]>([]);
  const [qr, setQr] = useState<string>("");
  const [editingVideo, setEditingVideo] = useState(false);
  const [videoDraft, setVideoDraft] = useState("");
  const [savingVideo, setSavingVideo] = useState(false);
  const [editingDrive, setEditingDrive] = useState(false);
  const [driveDraft, setDriveDraft] = useState("");
  const [savingDrive, setSavingDrive] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cloning, setCloning] = useState(false);
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  async function excluir() {
    if (!id) return;
    if (!confirm("Excluir este procedimento permanentemente? Esta ação não pode ser desfeita.")) return;
    setDeleting(true);
    try {
      await supabase.from("procedimento_versoes").delete().eq("procedimento_id", id);
      const { error } = await supabase.from("procedimentos").delete().eq("id", id);
      if (error) throw error;
      toast.success("Procedimento excluído");
      nav("/");
    } catch (e: any) { toast.error(e.message ?? "Falha ao excluir"); setDeleting(false); }
  }

  async function clonar() {
    if (!p) return;
    setCloning(true);
    try {
      const baseCodigo = String(p.codigo ?? "").replace(/-COPIA(-\d+)?$/i, "");
      let novoCodigo = `${baseCodigo}-COPIA`;
      // garantir unicidade
      const { data: existentes } = await supabase
        .from("procedimentos").select("codigo").ilike("codigo", `${baseCodigo}-COPIA%`);
      const usados = new Set((existentes ?? []).map((e: any) => e.codigo));
      if (usados.has(novoCodigo)) {
        let n = 2;
        while (usados.has(`${baseCodigo}-COPIA-${n}`)) n++;
        novoCodigo = `${baseCodigo}-COPIA-${n}`;
      }
      const { data: user } = await supabase.auth.getUser();
      const payload = {
        codigo: novoCodigo,
        titulo: `${p.titulo} (cópia)`,
        setor: p.setor,
        subpasta: p.subpasta ?? null,
        objetivo: p.objetivo ?? null,
        responsavel: p.responsavel ?? null,
        sistemas: p.sistemas ?? null,
        passo_a_passo: p.passo_a_passo ?? [],
        alertas: p.alertas ?? [],
        problemas_comuns: p.problemas_comuns ?? [],
        video_url: p.video_url ?? null,
        google_drive_url: p.google_drive_url ?? null,
        pdf_url: p.pdf_url ?? null,
        qr_code_url: p.qr_code_url ?? null,
        versao: "1.0",
        created_by: user?.user?.id ?? null,
      };
      const { data: novo, error } = await supabase
        .from("procedimentos").insert(payload).select("id").single();
      if (error) throw error;
      toast.success("Procedimento clonado");
      nav(`/procedimento/${novo.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao clonar");
    } finally { setCloning(false); }
  }

  async function salvarVideo() {
    if (!id) return;
    setSavingVideo(true);
    try {
      const url = videoDraft.trim() || null;
      const { error } = await supabase.from("procedimentos").update({ video_url: url }).eq("id", id);
      if (error) throw error;
      setP({ ...p, video_url: url });
      setEditingVideo(false);
      toast.success("Vídeo atualizado");
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao atualizar vídeo");
    } finally { setSavingVideo(false); }
  }

  async function salvarDrive() {
    if (!id) return;
    setSavingDrive(true);
    try {
      const url = driveDraft.trim() || null;
      const { error } = await supabase.from("procedimentos").update({ google_drive_url: url }).eq("id", id);
      if (error) throw error;
      setP({ ...p, google_drive_url: url });
      setEditingDrive(false);
      toast.success("URL do Google Drive atualizada");
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao atualizar URL");
    } finally { setSavingDrive(false); }
  }

  useEffect(() => { (async () => {
    if (!id) return;
    const { data } = await supabase.from("procedimentos").select("*").eq("id", id).maybeSingle();
    setP(data);
    QRCode.toDataURL(window.location.href, { width: 320, margin: 1, color: { dark: "#0b1220", light: "#ffffff" } }).then(setQr);
    const { data: v } = await supabase.from("procedimento_versoes").select("*").eq("procedimento_id", id).order("created_at", { ascending: false });
    setVersoes(v ?? []);
  })(); }, [id]);

  if (!p) return <div className="p-10 text-muted-foreground">Carregando…</div>;

  const embed = youtubeEmbed(p.video_url);

  function downloadPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth(); let y = 50;
    doc.setFillColor(11, 18, 32); doc.rect(0, 0, W, 80, "F");
    doc.setTextColor(255); doc.setFontSize(10); doc.text("PORTAL OPERACIONAL INTELIGENTE", 40, 35);
    doc.setFontSize(16); doc.text(`${p.codigo} — ${p.titulo}`, 40, 60);
    doc.setTextColor(0); y = 110;
    const line = (label: string, val: string) => { doc.setFont("helvetica", "bold"); doc.text(label, 40, y); doc.setFont("helvetica", "normal"); doc.text(val, 140, y, { maxWidth: W - 180 }); y += 20; };
    line("Setor:", p.setor);
    line("Responsável:", p.responsavel ?? "—");
    line("Versão:", p.versao);
    line("Data:", new Date(p.updated_at).toLocaleDateString("pt-BR"));
    y += 10; doc.setFont("helvetica", "bold"); doc.text("Objetivo", 40, y); y += 16;
    doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(p.objetivo ?? "—", W - 80), 40, y); y += 60;
    doc.setFont("helvetica", "bold"); doc.text("Passo a passo", 40, y); y += 16;
    doc.setFont("helvetica", "normal");
    (Array.isArray(p.passo_a_passo) ? p.passo_a_passo : []).forEach((step: string, i: number) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${step}`, W - 80);
      if (y + lines.length * 14 > 780) { doc.addPage(); y = 50; }
      doc.text(lines, 40, y); y += lines.length * 14 + 4;
    });
    if (qr) doc.addImage(qr, "PNG", W - 110, 30, 70, 70);
    doc.save(`${p.codigo}.pdf`);
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="size-4" /> Voltar</Link>

      <div className="glass rounded-xl p-6 lg:p-8 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono px-2 py-1 rounded bg-primary/15 text-primary">{p.codigo}</span>
              <span className="text-xs px-2 py-1 rounded bg-muted/60">{p.setor}</span>
              <span className="text-xs text-muted-foreground">v{p.versao}</span>
            </div>
            <h1 className="text-3xl font-bold">{p.titulo}</h1>
            {p.objetivo && <p className="text-muted-foreground mt-2 max-w-3xl">{p.objetivo}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={downloadPDF} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
              <Download className="size-4" /> Baixar PDF
            </button>
            {canEdit && (
              <>
                <Link to={`/procedimento/${id}/editar`}
                  className="flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm font-medium hover:bg-muted/40">
                  <Pencil className="size-4" /> Editar
                </Link>
                <button onClick={excluir} disabled={deleting}
                  className="flex items-center gap-2 border border-destructive/40 text-destructive px-4 py-2 rounded-md text-sm font-medium hover:bg-destructive/10 disabled:opacity-60">
                  <Trash2 className="size-4" /> {deleting ? "Excluindo…" : "Excluir"}
                </button>
              </>
            )}
            {canClone && (
              <button onClick={clonar} disabled={cloning}
                className="flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm font-medium hover:bg-muted/40 disabled:opacity-60">
                <Copy className="size-4" /> {cloning ? "Clonando…" : "Clonar"}
              </button>
            )}
          </div>
        </div>

        <dl className="grid sm:grid-cols-3 gap-4 mt-6 text-sm">
          <Info label="Responsável" value={p.responsavel} />
          <Info label="Sistemas" value={p.sistemas} />
          <Info label="Atualizado" value={new Date(p.updated_at).toLocaleString("pt-BR")} />
        </dl>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div className="glass rounded-xl overflow-hidden">
            {embed ? (
              <div className="aspect-video bg-black"><iframe src={embed} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
            ) : (
              <div className="p-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Video className="size-4" /> Nenhum vídeo de demonstração vinculado.
                </div>
                {canEdit && !editingVideo && (
                  <button onClick={() => { setVideoDraft(p.video_url ?? ""); setEditingVideo(true); }}
                    className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90">
                    <Pencil className="size-3.5" /> Adicionar vídeo
                  </button>
                )}
              </div>
            )}
            {canEdit && embed && !editingVideo && (
              <div className="px-5 py-3 border-t border-border flex justify-end">
                <button onClick={() => { setVideoDraft(p.video_url ?? ""); setEditingVideo(true); }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Pencil className="size-3.5" /> Alterar vídeo
                </button>
              </div>
            )}
            {canEdit && editingVideo && (
              <div className="p-5 border-t border-border space-y-3">
                <label className="text-xs font-medium text-muted-foreground">URL do vídeo (YouTube)</label>
                <input value={videoDraft} onChange={(e) => setVideoDraft(e.target.value)}
                  placeholder="https://youtu.be/… (deixe vazio para remover)"
                  className="w-full bg-background/60 border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingVideo(false)} disabled={savingVideo}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border hover:bg-muted/40">
                    <X className="size-3.5" /> Cancelar
                  </button>
                  <button onClick={salvarVideo} disabled={savingVideo}
                    className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-60">
                    <Save className="size-3.5" /> Salvar
                  </button>
                </div>
              </div>
            )}
          </div>

          <Card title="Passo a passo">
            <ol className="space-y-3">
              {(p.passo_a_passo ?? []).map((s: string, i: number) => (
                <li key={i} className="flex gap-3">
                  <span className="size-6 rounded bg-primary/15 text-primary text-xs font-bold grid place-items-center shrink-0">{i + 1}</span>
                  <span className="text-sm leading-relaxed">{s}</span>
                </li>
              ))}
              {(p.passo_a_passo ?? []).length === 0 && <li className="text-sm text-muted-foreground">Sem passos cadastrados.</li>}
            </ol>
          </Card>

          {(p.alertas ?? []).length > 0 && (
            <Card title="Alertas" icon={<AlertTriangle className="size-4 text-amber-400" />}>
              <ul className="space-y-2">
                {p.alertas.map((a: string, i: number) => <li key={i} className="text-sm flex gap-2"><span className="text-amber-400">•</span>{a}</li>)}
              </ul>
            </Card>
          )}

          {(p.problemas_comuns ?? []).length > 0 && (
            <Card title="Problemas comuns" icon={<Wrench className="size-4 text-primary" />}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b border-border">
                    <tr><th className="text-left py-2 pr-4">Problema</th><th className="text-left py-2">Solução</th></tr>
                  </thead>
                  <tbody>
                    {p.problemas_comuns.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-border/40 last:border-0">
                        <td className="py-2 pr-4 align-top">{row.problema}</td>
                        <td className="py-2 align-top text-muted-foreground">{row.solucao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>

        <aside className="space-y-6">
          <Card title="Google Drive" icon={<ExternalLink className="size-4 text-primary" />}>
            {!editingDrive && (
              <>
                {p.google_drive_url ? (
                  <a href={p.google_drive_url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all flex items-start gap-1.5">
                    <ExternalLink className="size-3.5 shrink-0 mt-0.5" />
                    <span>{p.google_drive_url}</span>
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum link do Google Drive vinculado.</p>
                )}
                {canEdit && (
                  <button onClick={() => { setDriveDraft(p.google_drive_url ?? ""); setEditingDrive(true); }}
                    className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                    <Pencil className="size-3.5" /> {p.google_drive_url ? "Alterar" : "Adicionar"} link
                  </button>
                )}
              </>
            )}
            {canEdit && editingDrive && (
              <div className="space-y-3">
                <input value={driveDraft} onChange={(e) => setDriveDraft(e.target.value)}
                  placeholder="https://drive.google.com/… (vazio remove)"
                  className="w-full bg-background/60 border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingDrive(false)} disabled={savingDrive}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted/40">
                    <X className="size-3.5" /> Cancelar
                  </button>
                  <button onClick={salvarDrive} disabled={savingDrive}
                    className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-60">
                    <Save className="size-3.5" /> Salvar
                  </button>
                </div>
              </div>
            )}
          </Card>


          <Card title="QR Code" icon={<QrIcon className="size-4 text-primary" />}>
            {qr && <img src={qr} alt="QR" className="w-full rounded-md bg-white p-2" />}
            <p className="text-xs text-muted-foreground mt-3 break-all">{pageUrl}</p>
          </Card>

          <Card title="Histórico de versões" icon={<History className="size-4 text-primary" />}>
            {versoes.length === 0 ? <p className="text-sm text-muted-foreground">Sem versões anteriores.</p> :
              <ul className="space-y-2 text-sm">
                {versoes.map((v) => (
                  <li key={v.id} className="flex justify-between border-b border-border/40 pb-2 last:border-0">
                    <span>v{v.versao}</span>
                    <span className="text-muted-foreground text-xs">{new Date(v.created_at).toLocaleDateString("pt-BR")}</span>
                  </li>
                ))}
              </ul>}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (<div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-medium mt-0.5">{value || "—"}</dd></div>);
}

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4"><h2 className="font-semibold">{title}</h2>{icon}</div>
      {children}
    </div>
  );
}
