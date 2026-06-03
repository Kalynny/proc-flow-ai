import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SETORES, codigoNum } from "@/lib/utils";
import { Search, Video, FileText, Layers, Activity, Sparkles } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

type Proc = { id: string; codigo: string; titulo: string; setor: string; video_url: string | null; google_drive_url: string | null; updated_at: string; versao: string };

export default function Dashboard() {
  const { role } = useAuth();
  const [items, setItems] = useState<Proc[]>([]); const [q, setQ] = useState("");

  useEffect(() => { (async () => {
    const { data } = await supabase.from("procedimentos").select("id,codigo,titulo,setor,video_url,google_drive_url,updated_at,versao");
    const sorted = (data ?? []).slice().sort((a, b) =>
      a.setor.localeCompare(b.setor, "pt-BR") ||
      codigoNum(a.codigo) - codigoNum(b.codigo) ||
      a.codigo.localeCompare(b.codigo, "pt-BR")
    );
    setItems(sorted as Proc[]);
  })(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = s ? items.filter((p) => `${p.codigo} ${p.titulo} ${p.setor}`.toLowerCase().includes(s)) : items;
    const counts: Record<string, number> = {};
    return base.filter((p) => {
      counts[p.setor] = (counts[p.setor] ?? 0) + 1;
      return counts[p.setor] <= 3;
    });
  }, [items, q]);

  const bySetor = useMemo(() => {
    const m: Record<string, number> = {};
    items.forEach((i) => { m[i.setor] = (m[i.setor] ?? 0) + 1; });
    return m;
  }, [items]);

  const totalVideos = items.filter((i) => (i.video_url && i.video_url.trim() !== "") || (i.google_drive_url && i.google_drive_url.trim() !== "")).length;

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-primary mb-1">Visão geral</div>
          <h1 className="text-3xl font-bold">Painel do Conhecimento</h1>
          <p className="text-muted-foreground mt-1">Base de Conhecimento, Treinamentos Escritos e Áudios Visuais.</p>
        </div>
        {(role === "admin" || role === "editor") && (
          <Link to="/novo" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md font-medium hover:bg-primary/90 transition">
            <Sparkles className="size-4" /> Gerar com IA
          </Link>
        )}
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<Layers />} label="Procedimentos" value={items.length} />
        <Stat icon={<Video />} label="Com vídeo" value={totalVideos} />
        <Stat icon={<FileText />} label="Setores ativos" value={Object.keys(bySetor).length} />
        <Stat icon={<Activity />} label="Última atualização" value={items.length ? new Date(items.reduce((a, b) => (a.updated_at > b.updated_at ? a : b)).updated_at).toLocaleDateString("pt-BR") : "—"} />
      </div>

      <div className="glass rounded-xl p-5 lg:p-6">
        <div className="flex items-center gap-3 mb-5">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código, título ou setor… ex: CT-e, baixa de entrega"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/70" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Sparkles className="size-8 mx-auto mb-3 opacity-50" />
            Nenhum procedimento ainda. {role !== "viewer" && <Link to="/novo" className="text-primary underline">Crie o primeiro com IA</Link>}.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <Link key={p.id} to={`/procedimento/${p.id}`} className="group rounded-lg border border-border/60 bg-background/40 p-4 hover:border-primary/50 hover:bg-background/70 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/15 text-primary">{p.codigo}</span>
                  <span className="text-[10px] text-muted-foreground">v{p.versao}</span>
                </div>
                <div className="font-medium leading-snug group-hover:text-primary transition">{p.titulo}</div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-muted/60">{p.setor}</span>
                  {p.video_url && <span className="flex items-center gap-1"><Video className="size-3" /> vídeo</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SETORES.map((s) => (
          <Link key={s} to={`/setor/${encodeURIComponent(s)}`} className="glass rounded-lg p-4 hover:border-primary/50 transition group">
            <div className="text-xs text-muted-foreground">Setor</div>
            <div className="font-semibold mt-1 group-hover:text-primary">{s}</div>
            <div className="text-xs text-muted-foreground mt-2">{bySetor[s] ?? 0} procedimento(s)</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="size-8 grid place-items-center rounded-md bg-primary/10 text-primary">{icon}</div>
      </div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}
