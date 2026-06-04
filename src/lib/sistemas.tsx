import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Setor = string;

export type SistemaSetorRef = { setor: string; label: string };
export type Sistema = {
  id: string;
  nome: string;
  descricao: string | null;
  finalidade: string | null;
  ordem: number;
  setores: SistemaSetorRef[];
};

export type SetorRow = { id: string; nome: string; departamento: string | null; ordem: number };
export type SubpastaRow = { id: string; setor_id: string; nome: string; ordem: number };

type Ctx = {
  loading: boolean;
  setores: SetorRow[];
  sistemas: Sistema[];
  subpastas: Record<string, string[]>; // by setor name
  setorByName: Record<string, SetorRow>;
  sistemaInfo: Record<string, { descricao: string; finalidade: string; modulos: string[] }>;
  sistemaNomes: string[];
  setorNomes: string[];
  reload: () => Promise<void>;
};

const SistemasCtx = createContext<Ctx>({
  loading: true, setores: [], sistemas: [], subpastas: {}, setorByName: {},
  sistemaInfo: {}, sistemaNomes: [], setorNomes: [], reload: async () => {},
});

export function SistemasProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [setores, setSetores] = useState<SetorRow[]>([]);
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [subpastasMap, setSubpastasMap] = useState<Record<string, string[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: sets, error: setsError }, { data: sis, error: sisError }, { data: ss, error: ssError }, { data: subs, error: subsError }] = await Promise.all([
      supabase.from("setores" as any).select("*").order("ordem").order("nome"),
      supabase.from("sistemas" as any).select("*").order("nome"),
      supabase.from("sistema_setores" as any).select("*").order("ordem"),
      supabase.from("subpastas" as any).select("*").order("ordem").order("nome"),
    ]);
    if (setsError || sisError || ssError || subsError) {
      console.error("Falha ao carregar sistemas", setsError || sisError || ssError || subsError);
      setSetores([]);
      setSistemas([]);
      setSubpastasMap({});
      setLoading(false);
      return;
    }
    const setoresArr = ((sets ?? []) as unknown) as SetorRow[];
    const sistemasArr = ((sis ?? []) as unknown) as any[];
    const linksArr = ((ss ?? []) as unknown) as any[];
    const subsArr = ((subs ?? []) as unknown) as SubpastaRow[];

    const setorById: Record<string, SetorRow> = {};
    setoresArr.forEach((s) => { setorById[s.id] = s; });

    const built: Sistema[] = sistemasArr.map((s) => ({
      id: s.id,
      nome: s.nome,
      descricao: s.descricao,
      finalidade: s.finalidade,
      ordem: s.ordem,
      setores: linksArr
        .filter((l) => l.sistema_id === s.id)
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((l) => {
          const sr = setorById[l.setor_id];
          const setor = sr?.nome ?? "";
          return { setor, label: l.label || setor };
        })
        .filter((r) => r.setor),
    })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));

    const subMap: Record<string, string[]> = {};
    subsArr.forEach((sp) => {
      const sr = setorById[sp.setor_id];
      if (!sr) return;
      (subMap[sr.nome] ||= []).push(sp.nome);
    });

    setSetores(setoresArr.slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })));
    setSistemas(built);
    setSubpastasMap(subMap);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setorByName: Record<string, SetorRow> = {};
  setores.forEach((s) => { setorByName[s.nome] = s; });

  const sistemaInfo: Record<string, { descricao: string; finalidade: string; modulos: string[] }> = {};
  sistemas.forEach((s) => {
    sistemaInfo[s.nome] = {
      descricao: s.descricao ?? "",
      finalidade: s.finalidade ?? "",
      modulos: s.setores.map((r) => r.label),
    };
  });

  return (
    <SistemasCtx.Provider value={{
      loading, setores, sistemas, subpastas: subpastasMap, setorByName,
      sistemaInfo,
      sistemaNomes: sistemas.map((s) => s.nome),
      setorNomes: setores.map((s) => s.nome),
      reload: load,
    }}>
      {children}
    </SistemasCtx.Provider>
  );
}

export const useSistemasData = () => useContext(SistemasCtx);

export const normSistemaRef = (r: string | SistemaSetorRef): SistemaSetorRef =>
  typeof r === "string" ? { setor: r, label: r } : r;
