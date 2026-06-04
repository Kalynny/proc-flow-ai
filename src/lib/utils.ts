import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function codigoNum(codigo: string): number {
  const matches = String(codigo ?? "").match(/\d+/g);
  if (!matches || matches.length === 0) return Number.MAX_SAFE_INTEGER;
  return parseInt(matches[matches.length - 1], 10);
}

export const DEPARTAMENTOS = [
  "Financeiro", "Operacional", "Faturamento", "Frota", "Recursos Humanos", "Monitoramento", "Gerenciamento de Risco",
] as const;
export type Departamento = (typeof DEPARTAMENTOS)[number];

// Sistemas/Setores/Subpastas/normSistemaRef moved to src/lib/sistemas.tsx (carregados do banco).
export type { Setor, Sistema, SistemaSetorRef } from "@/lib/sistemas";
export { normSistemaRef } from "@/lib/sistemas";

export function youtubeEmbed(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
  } catch {}
  return null;
}
