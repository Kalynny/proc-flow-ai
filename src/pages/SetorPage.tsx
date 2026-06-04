import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Video, Folder, Lock, Info, Target, Layers } from "lucide-react";
import { codigoNum } from "@/lib/utils";
import { useSistemasData, normSistemaRef, type Setor } from "@/lib/sistemas";
import { useAuth } from "@/components/AuthProvider";

export default function SetorPage() {
  const { setor, subpasta } = useParams();
  const { role, sistemas: allowed } = useAuth();
  const { sistemas: sistemasAll, sistemaNomes, sistemaInfo, subpastas: subpastasMap } = useSistemasData();
  const [items, setItems] = useState<any[]>([]);
  const setorName = setor ? decodeURIComponent(setor) : "";
  const subpastaName = subpasta ? decodeURIComponent(subpasta) : "";
  const subpastas = subpastasMap[setorName] ?? [];

  const isAdmin = role === "admin";
  const isSistemaRoute = sistemaNomes.includes(setorName);
  const sistemasDoSetor = sistemasAll.filter((s) => s.setores.some((r) => normSistemaRef(r).setor === setorName)).map((s) => s.nome);
  const liberado = isAdmin
    || (isSistemaRoute && allowed.includes(setorName))
    || (!isSistemaRoute && sistemasDoSetor.some((n) => allowed.includes(n)));

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

  if (!liberado) {
    return (
      <div className="p-8">
        <div className="glass rounded-xl p-8 text-center max-w-md mx-auto">
          <Lock className="size-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold mb-1">Acesso restrito</h2>
          <p className="text-sm text-muted-foreground">Você não tem permissão para acessar este sistema. Solicite acesso ao administrador.</p>
        </div>
      </div>
    );
  }

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

      {!subpastaName && isSistemaRoute && sistemaInfo[setorName] && (
        <div className="mb-8 glass rounded-xl p-5 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-8 rounded-md bg-primary/15 grid place-items-center text-primary"><Info className="size-4" /></div>
            <div className="font-semibold">Sobre o sistema {setorName}</div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{sistemaInfo[setorName].descricao}</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground/80 mb-1.5">
                <Target className="size-3" /> Finalidade
              </div>
              <p className="text-sm">{sistemaInfo[setorName].finalidade}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground/80 mb-1.5">
                <Layers className="size-3" /> Setores atendidos
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sistemaInfo[setorName].modulos.map((m) => (
                  <span key={m} className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


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
