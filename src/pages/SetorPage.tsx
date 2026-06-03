import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Video, Folder } from "lucide-react";
import { codigoNum, SUBPASTAS, type Setor } from "@/lib/utils";

export default function SetorPage() {
  const { setor, subpasta } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const setorName = setor ? decodeURIComponent(setor) : "";
  const subpastaName = subpasta ? decodeURIComponent(subpasta) : "";
  const subpastas = SUBPASTAS[setorName as Setor] ?? [];

  useEffect(() => { (async () => {
    if (!setor) return;
    const { data } = await supabase.from("procedimentos").select("*").eq("setor", setorName as any);
    const sorted = (data ?? []).slice().sort((a: any, b: any) =>
      codigoNum(a.codigo) - codigoNum(b.codigo) ||
      String(a.codigo).localeCompare(String(b.codigo), "pt-BR")
    );
    setItems(sorted);
  })(); }, [setor, setorName]);

  // Filter items: when inside a subpasta show only its items; at the setor root, hide items that belong to a known subpasta
  const visibleItems = subpastaName
    ? items.filter((p) => (p.subpasta ?? "") === subpastaName)
    : items.filter((p) => !p.subpasta || !subpastas.includes(p.subpasta));

  const subCounts: Record<string, number> = {};
  subpastas.forEach((s) => { subCounts[s] = items.filter((p) => p.subpasta === s).length; });

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
      <Link to={subpastaName ? `/setor/${encodeURIComponent(setorName)}` : "/"} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <div className="text-xs text-muted-foreground mb-1">
        Setor: {setorName}{subpastaName && <> <span className="opacity-60">/</span> {subpastaName}</>}
      </div>
      <h1 className="text-3xl font-bold">{subpastaName || setorName}</h1>
      <p className="text-muted-foreground mt-1 mb-8">{visibleItems.length} treinamento(s){subpastaName ? " nesta subpasta" : " neste setor"}.</p>

      {!subpastaName && subpastas.length > 0 && (
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-3">Subpastas</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {subpastas.map((s) => (
              <Link key={s} to={`/setor/${encodeURIComponent(setorName)}/${encodeURIComponent(s)}`}
                className="glass rounded-lg p-4 hover:border-primary/50 transition group flex items-center gap-3">
                <div className="size-9 rounded-md bg-primary/15 grid place-items-center text-primary"><Folder className="size-4" /></div>
                <div>
                  <div className="font-semibold group-hover:text-primary">{s}</div>
                  <div className="text-xs text-muted-foreground">{subCounts[s] ?? 0} treinamento(s)</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleItems.map((p) => (
          <Link key={p.id} to={`/procedimento/${p.id}`} className="glass rounded-lg p-4 hover:border-primary/50 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/15 text-primary">{p.codigo}</span>
              <span className="text-[10px] text-muted-foreground">v{p.versao}</span>
            </div>
            <div className="font-medium">{p.titulo}</div>
            {p.video_url && <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Video className="size-3" /> vídeo disponível</div>}
          </Link>
        ))}
        {visibleItems.length === 0 && <div className="col-span-full text-muted-foreground text-center py-20">Nenhum treinamento {subpastaName ? "nesta subpasta" : "neste setor"}.</div>}
      </div>
    </div>
  );
}
