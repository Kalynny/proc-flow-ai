import type { Json } from "@/integrations/supabase/types";

export const canReviewResults = (role: string | null) => role === "admin" || role === "editor";
export type ManagerResult = { id: string; user_id: string; procedimento_id: string; created_at: string; acertos: number; total: number; colaborador: string; treinamento: string };
export function readResults(data: Json): ManagerResult[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const { id, user_id, procedimento_id, created_at, acertos, total, colaborador, treinamento } = item;
    if (typeof id !== "string" || typeof user_id !== "string" || typeof procedimento_id !== "string" || typeof created_at !== "string" || typeof acertos !== "number" || typeof total !== "number" || typeof colaborador !== "string" || typeof treinamento !== "string") return [];
    return [{ id, user_id, procedimento_id, created_at, acertos, total, colaborador, treinamento }];
  });
}
export function filterResults(results: ManagerResult[], userId: string, trainingId: string) {
  return results.filter((r) => (!userId || r.user_id === userId) && (!trainingId || r.procedimento_id === trainingId));
}
export function resultScore(hits: number, total: number) {
  return total > 0 ? Math.round(hits / total * 100) : null;
}
export function readAnswerDetails(data: Json) {
  if (!data || typeof data !== "object" || Array.isArray(data) || !Array.isArray(data.questoes) || !Array.isArray(data.gabarito) || !Array.isArray(data.respostas)) return null;
  const answers = data.respostas;
  const key = data.gabarito;
  return data.questoes.flatMap((q, i) => {
    if (!q || typeof q !== "object" || Array.isArray(q) || typeof q.enunciado !== "string" || !Array.isArray(q.alternativas)) return [];
    const selected = answers[i]; const correct = key[i];
    return [{ question: q.enunciado, selected: typeof selected === "number" ? String(q.alternativas[selected] ?? "Resposta indisponível") : "Resposta indisponível", correct: typeof correct === "number" ? String(q.alternativas[correct] ?? "Resposta indisponível") : "Resposta indisponível", isCorrect: typeof selected === "number" && typeof correct === "number" ? selected === correct : null }];
  });
}