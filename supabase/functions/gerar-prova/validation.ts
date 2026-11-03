export type GeneratedQuestion = { enunciado: string; alternativas: string[]; correta: number; referencia: string };
export function validateGeneratedQuestions(value: unknown, source?: string): GeneratedQuestion[] {
  if (!Array.isArray(value) || value.length !== 5) throw new Error("A prova deve conter exatamente 5 perguntas.");
  const normalize = (text: string) => text.replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
  const questions = value.map((q: unknown) => {
    if (!q || typeof q !== "object" || !("enunciado" in q) || !("alternativas" in q) || !("correta" in q) || !("referencia" in q)) throw new Error("Questão inválida.");
    if (typeof q.enunciado !== "string" || !q.enunciado.trim() || !Array.isArray(q.alternativas) || q.alternativas.length !== 4 || !q.alternativas.every((a: unknown) => typeof a === "string" && a.trim())) throw new Error("Cada pergunta deve ter 4 alternativas preenchidas.");
    const alternativas: string[] = q.alternativas.map((a: string) => a.trim());
    if (new Set(alternativas.map(normalize)).size !== 4) throw new Error("As alternativas devem ser distintas.");
    if (typeof q.correta !== "number" || !Number.isInteger(q.correta) || q.correta < 0 || q.correta > 3) throw new Error("Selecione uma única resposta correta.");
    if (typeof q.referencia !== "string" || !q.referencia.trim() || (source !== undefined && !normalize(source).includes(normalize(q.referencia)))) throw new Error("A pergunta não possui referência válida no treinamento.");
    return { enunciado: q.enunciado.trim(), alternativas, correta: q.correta, referencia: q.referencia.trim() };
  });
  if (new Set(questions.map(q => normalize(q.enunciado))).size !== 5) throw new Error("As perguntas devem ser distintas.");
  return questions;
}