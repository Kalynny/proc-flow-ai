import { describe, expect, test } from "bun:test";
import { canReviewResults, filterResults, readAnswerDetails, resultScore, type ManagerResult } from "../src/lib/manager-results";

describe("manager results", () => {
  test("all editors and admins can review, viewers cannot", () => {
    expect(canReviewResults("editor")).toBe(true);
    expect(canReviewResults("admin")).toBe(true);
    expect(canReviewResults("viewer")).toBe(false);
    expect(canReviewResults(null)).toBe(false);
  });
  const rows: ManagerResult[] = [
    { id: "attempt-1", user_id: "user-a", procedimento_id: "training-a", created_at: "2026-11-02", acertos: 1, total: 2, colaborador: "A", treinamento: "A" },
    { id: "attempt-2", user_id: "user-a", procedimento_id: "training-a", created_at: "2026-11-02", acertos: 2, total: 2, colaborador: "A", treinamento: "A" },
    { id: "attempt-3", user_id: "user-b", procedimento_id: "training-b", created_at: "2026-11-02", acertos: 0, total: 2, colaborador: "B", treinamento: "B" },
  ];
  test("combined filters preserve all previous attempts", () => {
    expect(filterResults(rows, "user-a", "training-a").map(r => r.id)).toEqual(["attempt-1", "attempt-2"]);
    expect(filterResults(rows, "user-a", "training-b")).toEqual([]);
    expect(rows.length).toBe(3);
  });
  test("grades correspond to stored hits and totals", () => {
    expect(resultScore(1, 2)).toBe(50);
    expect(resultScore(2, 2)).toBe(100);
    expect(resultScore(0, 0)).toBeNull();
  });
  test("review uses the attempt snapshot rather than current exam", () => {
    expect(readAnswerDetails({ questoes: [{ enunciado: "Q", alternativas: ["A", "B"] }], respostas: [0], gabarito: [1] })).toEqual([{ question: "Q", selected: "A", correct: "B", isCorrect: false }]);
    expect(readAnswerDetails({ questoes: null, respostas: [0], gabarito: null })).toBeNull();
  });
});