import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Eye, ArrowLeft, RotateCw } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/Button";
import { supabase } from "@/integrations/supabase/client";
import { canReviewResults, filterResults, readResults, readAnswerDetails, resultScore, type ManagerResult } from "@/lib/manager-results";

type Detail = { row: ManagerResult; answers: ReturnType<typeof readAnswerDetails> };
const dateLabel = (value: string) => new Date(value).toLocaleString("pt-BR");
export default function ResultadosGestor() {
  const { role } = useAuth();
  const allowed = canReviewResults(role);
  const [results, setResults] = useState<ManagerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [trainingFilter, setTrainingFilter] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    setLoading(true); setError("");
    supabase.rpc("listar_resultados_gestor").then(({ data, error }) => {
      if (!active) return;
      if (error) setError("Não foi possível carregar os resultados. Tente novamente.");
      else setResults(readResults(data));
      setLoading(false);
    });
    return () => { active = false; };
  }, [allowed, refresh]);
  async function openResult(row: ManagerResult) {
    setOpening(row.id); setError("");
    const { data, error } = await supabase.rpc("consultar_resultado_gestor", { _resultado_id: row.id });
    if (error) setError("Não foi possível carregar as respostas. Tente novamente.");
    else setDetail({ row, answers: readAnswerDetails(data) });
    setOpening(null);
  }
  if (!allowed) return <div className="p-6 lg:p-10"><h1 className="text-2xl font-bold">Acesso restrito</h1><p className="mt-2 text-muted-foreground">Somente gestores e administradores podem consultar os resultados.</p></div>;
  const users = [...new Map(results.map(r => [r.user_id, r.colaborador])).entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  const trainings = [...new Map(results.map(r => [r.procedimento_id, r.treinamento])).entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  const visible = filterResults(results, userFilter, trainingFilter);
  return <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-bold">Resultados das avaliações</h1><Button variant="outline" onClick={() => { setDetail(null); setRefresh(v => v + 1); }} disabled={loading || !!opening}><RotateCw className="size-4" />Atualizar</Button></header>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {detail ? <section className="space-y-6" aria-label="Respostas da avaliação">
      <Button variant="ghost" onClick={() => setDetail(null)}><ArrowLeft className="size-4" />Voltar aos resultados</Button>
      <header className="space-y-2"><h2 className="text-xl font-semibold">{detail.row.colaborador}</h2><p>{detail.row.treinamento}</p><p className="text-sm text-muted-foreground">{dateLabel(detail.row.created_at)} · Nota: {resultScore(detail.row.acertos, detail.row.total) ?? "—"}% · {detail.row.acertos} acertos · {detail.row.total - detail.row.acertos} erros</p></header>
      {detail.answers?.length ? <ol className="divide-y divide-border">{detail.answers.map((a, i) => <li key={i} className="py-5 space-y-3">
        <h3 className="font-semibold break-words">{i + 1}. {a.question}</h3>
        <p className="text-sm break-words"><span className="text-muted-foreground">Resposta do colaborador: </span>{a.selected}</p>
        <p className="text-sm break-words"><span className="text-muted-foreground">Resposta correta: </span>{a.correct}</p>
        <p className="flex items-center gap-2 text-sm">{a.isCorrect === true ? <><CheckCircle className="size-4 text-primary" />Correta</> : a.isCorrect === false ? <><XCircle className="size-4 text-destructive" />Incorreta</> : "Correção indisponível"}</p>
      </li>)}</ol> : <p role="status" className="text-muted-foreground">As perguntas e o gabarito desta tentativa não foram registrados. A nota e o histórico continuam disponíveis.</p>}
    </section> : <>
      <div className="flex flex-wrap gap-4">
        <label className="flex-1 min-w-0 space-y-2 text-sm"><span>Colaborador</span><select aria-label="Colaborador" value={userFilter} onChange={e => setUserFilter(e.target.value)} className="w-full min-w-0 rounded-md border border-border bg-card px-3 py-2"><option value="">Todos os colaboradores</option>{users.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <label className="flex-1 min-w-0 space-y-2 text-sm"><span>Treinamento</span><select aria-label="Treinamento" value={trainingFilter} onChange={e => setTrainingFilter(e.target.value)} className="w-full min-w-0 rounded-md border border-border bg-card px-3 py-2"><option value="">Todos os treinamentos</option>{trainings.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>
      </div>
      {loading ? <p role="status" className="text-muted-foreground">Carregando resultados…</p> : error ? null : !visible.length ? <p role="status" className="text-muted-foreground">{results.length ? "Nenhum resultado para os filtros selecionados." : "Nenhuma avaliação realizada até o momento."}</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-muted-foreground border-b border-border"><tr>{["Colaborador", "Treinamento", "Data", "Nota", "Acertos", "Erros", ""].map((h, i) => <th key={i} className="text-left font-medium px-3 py-3">{h}</th>)}</tr></thead><tbody>{visible.map(r => <tr key={r.id} className="border-b border-border/60"><td className="px-3 py-4">{r.colaborador}</td><td className="px-3 py-4 max-w-xs break-words">{r.treinamento}</td><td className="px-3 py-4 whitespace-nowrap">{dateLabel(r.created_at)}</td><td className="px-3 py-4">{resultScore(r.acertos, r.total) === null ? "—" : `${resultScore(r.acertos, r.total)}%`}</td><td className="px-3 py-4">{r.acertos}</td><td className="px-3 py-4">{r.total - r.acertos}</td><td className="px-3 py-4"><Button variant="outline" title="Consultar respostas" aria-label={`Consultar respostas de ${r.colaborador}`} onClick={() => openResult(r)} disabled={!!opening}><Eye className="size-4" /></Button></td></tr>)}</tbody></table></div>}
    </>}
  </div>;
}