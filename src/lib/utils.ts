import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function codigoNum(codigo: string): number {
  const matches = String(codigo ?? "").match(/\d+/g);
  if (!matches || matches.length === 0) return Number.MAX_SAFE_INTEGER;
  return parseInt(matches[matches.length - 1], 10);
}

export const SETORES = [
  "Aferição de Pneus", "Bee Vale RH", "Cheklist", "Comercial", "Contrato de Frete", "Faturamento", "Financeiro", "Frota", "Gerenciamento de Risco",
  "Mobile", "Monitoramento", "Nota Fiscal", "Operacional", "Ranking Motoristas", "Solides RH",
] as const;

export const DEPARTAMENTOS = [
  "Financeiro", "Operacional", "Faturamento", "Frota", "Recursos Humanos", "Monitoramento", "Gerenciamento de Risco",
] as const;
export type Departamento = (typeof DEPARTAMENTOS)[number];
export type Setor = (typeof SETORES)[number];

export type SistemaRef = string | { setor: string; label: string };
export const SISTEMAS: { nome: string; setores: SistemaRef[] }[] = [
  { nome: "GW-WEBTRANS", setores: ["Comercial", "Contrato de Frete", "Faturamento", "Financeiro", "Gerenciamento de Risco", "Operacional"] },
  { nome: "GW-FROTA", setores: ["Frota"] },
  { nome: "GW-MOBILE", setores: ["Mobile"] },
  { nome: "GW-LOGIS", setores: ["Nota Fiscal"] },
  { nome: "A52", setores: ["Monitoramento"] },
  { nome: "NGO", setores: ["Gerenciamento de Risco"] },
  { nome: "SOLIDES", setores: ["Solides RH"] },
  { nome: "BEE VALE", setores: ["Bee Vale RH"] },
  { nome: "PROLOG", setores: ["Aferição de Pneus", "Cheklist"] },
  { nome: "GAME TRUCK", setores: ["Ranking Motoristas"] },
  { nome: "TRUCK DIGITAL", setores: ["Contrato de Frete"] },
];
export const SISTEMA_NOMES = SISTEMAS.map((s) => s.nome);
export const normSistemaRef = (r: SistemaRef) => typeof r === "string" ? { setor: r, label: r } : r;

export const SUBPASTAS: Partial<Record<Setor, string[]>> = {
  Comercial: ["Alinhamento Operacional", "Cotação de Frete", "Prospecção de Clientes"],
  Operacional: ["ADV", "Coleta", "Contrato de Frete", "CT-e", "Manifesto", "Romaneio"],
  "Gerenciamento de Risco": ["Analise de Dados", "Rastreamento", "Seguro"],
  Faturamento: ["Cadastro", "CT-e", "NF Serviço", "Receita Financeira"],
  Monitoramento: ["Monitoramento da Carga", "Monitoramento do Canhoto"],
  Financeiro: ["Cadastros", "Conc. Bancaria", "Contas a Pagar", "Contas a Receber", "Contrato de Frete"],
  Frota: ["Abastecimento", "Almoxarifado", "Checklist", "Compras", "Multas", "Ordens de Serviços", "Pneus"],
  Mobile: ["ADV", "Coleta", "Configurações", "CT-e", "Manifesto", "Romaneio"],
  "Solides RH": ["Benefícios", "Jornada de Trabalho", "Palestras e Treinamento", "Recrutamento"],
  "Bee Vale RH": ["Benefícios", "Jornada de Trabalho", "Palestras e Treinamento", "Recrutamento"],
  "Aferição de Pneus": ["Benefícios", "Jornada de Trabalho", "Palestras e Treinamento", "Recrutamento"],
  Cheklist: ["Benefícios", "Jornada de Trabalho", "Palestras e Treinamento", "Recrutamento"],
  "Contrato de Frete": ["Benefícios", "Jornada de Trabalho", "Palestras e Treinamento", "Recrutamento"],
  "Nota Fiscal": ["Benefícios", "Jornada de Trabalho", "Palestras e Treinamento", "Recrutamento"],
  "Ranking Motoristas": ["Benefícios", "Jornada de Trabalho", "Palestras e Treinamento", "Recrutamento"],
  
};

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
