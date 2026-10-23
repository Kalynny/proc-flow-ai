import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/Button";
import { readQuestions, type Question } from "@/lib/training-flow";
import { toast } from "sonner";

type Exam = { id: string; procedimento_id: string; titulo: string; updated_at: string; questoes: Question[] };
type Result = { id: string; acertos: number; total: number };

export default function AvaliacaoPage() {
  const { id, avaliacaoId } = useParams();
  const [exam, setExam] = useState<Exam | null>(null);
  const [trainingTitle, setTrainingTitle] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let active = true;
    setExam(null); setAnswers({}); setResult(null); setErrorMessage(""); setLoading(true);
    (async () => {
      try {
        if (!id || !avaliacaoId) return;
        const [training, assessment] = await Promise.all([
          supabase.from("procedimentos").select("titulo").eq("id", id).maybeSingle(),
          supabase.from("treinamento_avaliacoes").select("*").eq("procedimento_id", id).eq("id", avaliacaoId).maybeSingle(),
        ]);
        if (training.error || assessment.error) throw training.error ?? assessment.error;
        if (!active || !training.data || !assessment.data) return;
        setTrainingTitle(training.data.titulo);
        const questions = readQuestions(assessment.data.questoes);
        if (questions.length) setExam({ ...assessment.data, questoes: questions });
      } catch { if (active) setErrorMessage("Não foi possível carregar a avaliação. Tente novamente."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [id, avaliacaoId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!exam || !id) return;
    if (exam.questoes.some((_, i) => answers[i] === undefined)) { toast.error("Responda todas as questões"); return; }
    setSending(true);
    try {
      const { data, error } = await supabase.rpc("enviar_avaliacao_treinamento", {
        _procedimento_id: id, _avaliacao_id: exam.id, _updated_at: exam.updated_at,
        _respostas: exam.questoes.map((_, i) => answers[i]),
      });
      if (error) throw error;
      if (data && typeof data === "object" && !Array.isArray(data) && typeof data.id === "string" && typeof data.acertos === "number" && typeof data.total === "number") {
        setResult({ id: data.id, acertos: data.acertos, total: data.total });
      } else throw new Error("Não foi possível confirmar o resultado");
    } catch (error: any) { toast.error(error.message ?? "Não foi possível enviar a prova"); }
    finally { setSending(false); }
  }

  return <div className="p-6 lg:p-10 max-w-[1200px] mx-auto space-y-6">
    <Link to={`/procedimento/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Voltar ao treinamento</Link>
    {loading ? <p className="text-muted-foreground">Carregando avaliação…</p> : !exam ? <p role="status" className="text-muted-foreground">{errorMessage || "A avaliação não está disponível para este treinamento."}</p> : <>
      <header className="space-y-2"><h1 className="text-3xl font-bold">{exam.titulo}</h1><p className="text-muted-foreground">{trainingTitle}</p></header>
      {result ? <section className="glass rounded-lg p-6 space-y-3" aria-label="Resultado da avaliação">
        <CheckCircle className="size-8 text-primary" /><h2 className="text-xl font-semibold">Prova concluída</h2>
        <p>Você acertou {result.acertos} de {result.total} questões ({Math.round(result.acertos / result.total * 100)}%).</p>
      </section> : <form onSubmit={submit} className="space-y-6">
        {exam.questoes.map((q, i) => <fieldset key={i} className="glass rounded-lg p-5 space-y-3">
          <legend className="sr-only">Questão {i + 1}</legend><h2 className="font-semibold">{i + 1}. {q.enunciado}</h2>
          {q.alternativas.map((a, j) => <label key={j} className="flex items-start gap-3 py-2 text-sm cursor-pointer">
            <input type="radio" required name={`question-${i}`} value={j} checked={answers[i] === j} onChange={() => setAnswers((current) => ({ ...current, [i]: j }))} className="accent-primary mt-0.5 shrink-0" />
            <span>{a}</span>
          </label>)}
        </fieldset>)}
        <Button type="submit" disabled={sending}><Send className="size-4" />{sending ? "Enviando…" : "Enviar prova"}</Button>
      </form>}
    </>}
  </div>;
}