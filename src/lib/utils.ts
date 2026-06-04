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

export const SISTEMA_INFO: Record<string, { descricao: string; finalidade: string; modulos: string[] }> = {
  "GW-WEBTRANS": {
    descricao: "Sistema principal de gestão de transporte rodoviário de cargas da GKO/Senior, responsável por toda a operação administrativa e financeira da transportadora.",
    finalidade: "Centralizar emissão de documentos fiscais (CT-e, MDF-e), contratos de frete, faturamento, contas a pagar/receber e gestão comercial.",
    modulos: ["Comercial", "Contrato de Frete", "Faturamento", "Financeiro", "Gerenciamento de Risco", "Operacional"],
  },
  "GW-FROTA": {
    descricao: "Módulo de gestão de frota integrado ao GW, voltado para o controle completo dos veículos e custos de manutenção.",
    finalidade: "Controlar abastecimento, almoxarifado, pneus, ordens de serviço, multas, checklist e compras relacionadas à frota.",
    modulos: ["Frota"],
  },
  "GW-MOBILE": {
    descricao: "Aplicativo mobile utilizado pelos motoristas para registro de eventos de viagem em tempo real.",
    finalidade: "Permitir que motoristas registrem coletas, entregas, ocorrências (ADV), CT-e, manifestos e romaneios direto do celular.",
    modulos: ["Mobile"],
  },
  "GW-LOGIS": {
    descricao: "Módulo logístico do GW para tratamento de notas fiscais e integração com clientes.",
    finalidade: "Receber, validar e processar notas fiscais eletrônicas para emissão de documentos de transporte.",
    modulos: ["Nota Fiscal"],
  },
  "A52": {
    descricao: "Sistema de monitoramento e rastreamento veicular utilizado pelo time de monitoramento.",
    finalidade: "Acompanhar em tempo real a localização das cargas, status de viagens e segurança operacional.",
    modulos: ["Monitoramento"],
  },
  "NGO": {
    descricao: "Sistema de gerenciamento de risco e gestão de seguros.",
    finalidade: "Avaliar perfil de motoristas, consultar histórico, gerenciar apólices e mitigar riscos operacionais.",
    modulos: ["Gerenciamento de Risco"],
  },
  "SOLIDES": {
    descricao: "Plataforma de gestão de pessoas e RH analítico utilizada para processos seletivos e gestão comportamental.",
    finalidade: "Realizar recrutamento, avaliações de perfil, gestão de benefícios, treinamentos e jornada de trabalho.",
    modulos: ["Solides RH"],
  },
  "BEE VALE": {
    descricao: "Plataforma de benefícios corporativos (vale-alimentação, refeição e demais benefícios).",
    finalidade: "Gerenciar cartões de benefícios, recargas e relatórios de utilização pelos colaboradores.",
    modulos: ["Bee Vale RH"],
  },
  "PROLOG": {
    descricao: "Sistema de gestão operacional voltado para controle de pneus e checklist de veículos.",
    finalidade: "Realizar aferição de pneus, controle de vida útil, registro de checklist diário e indicadores operacionais.",
    modulos: ["Aferição de Pneus", "Cheklist"],
  },
  "GAME TRUCK": {
    descricao: "Plataforma de gamificação para motoristas baseada em indicadores de performance.",
    finalidade: "Ranquear motoristas por desempenho, segurança e produtividade, incentivando boas práticas.",
    modulos: ["Ranking Motoristas"],
  },
  "TRUCK DIGITAL": {
    descricao: "Plataforma digital para gestão de contratos de frete eletrônicos.",
    finalidade: "Formalizar, assinar digitalmente e acompanhar contratos de frete com agregados e terceiros.",
    modulos: ["Contrato de Frete"],
  },
};
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
