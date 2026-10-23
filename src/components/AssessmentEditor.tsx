import { useEffect, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/Button";
import { readQuestions, type Question } from "@/lib/training-flow";
import { toast } from "sonner";

type DraftQuestion = Question & { correta: number };
const newQuestion = (): DraftQuestion => ({ enunciado: "", alternativas: ["", "", "", ""], correta: 0 });
const inputClass = "w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

export function AssessmentEditor({ trainingId, title, onSaved, onClose }: {
  trainingId: string; title: string; onSaved: () => void; onClose: () => void;
}) {
  const [titulo, setTitulo] = useState(`Avaliação — ${title}`);
  const [questoes, setQuestoes] = useState<DraftQuestion[]>([newQuestion()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase.from("treinamento_avaliacoes").select("*").eq("procedimento_id", trainingId).maybeSingle();
        if (error) throw error;
        if (data) {
          const { data: key, error: keyError } = await supabase.from("treinamento_gabaritos").select("respostas").eq("avaliacao_id", data.id).single();
          if (keyError) throw keyError;
          if (!active) return;
          const answers = Array.isArray(key.respostas) ? key.respostas : [];
          setTitulo(data.titulo);
          setQuestoes(readQuestions(data.questoes).map((q, i) => ({ ...q, correta: Number(answers[i] ?? 0) })));
        }
      } catch { if (active) { setLoadError(true); toast.error("Não foi possível carregar a prova"); } }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [trainingId]);

  function update(index: number, patch: Partial<DraftQuestion>) {
    setQuestoes((current) => current.map((q, i) => i === index ? { ...q, ...patch } : q));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!questoes.length) { toast.error("Cadastre ao menos uma questão"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("salvar_avaliacao_treinamento", {
        _procedimento_id: trainingId, _titulo: titulo.trim(),
        _questoes: questoes.map((q) => ({ enunciado: q.enunciado.trim(), alternativas: q.alternativas.map((a) => a.trim()) })),
        _gabarito: questoes.map((q) => q.correta),
      });
      if (error) throw error;
      toast.success("Prova salva para este treinamento");
      onSaved();
    } catch (error: any) { toast.error(error.message ?? "Não foi possível salvar a prova"); }
    finally { setSaving(false); }
  }

  return <form onSubmit={save} className="space-y-5 border-t border-border p-5">
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-semibold">Prova do treinamento</h2>
      <Button variant="ghost" onClick={onClose} disabled={saving} aria-label="Fechar cadastro da prova" title="Fechar"><X className="size-4" /></Button>
    </div>
    {loading ? <p className="text-sm text-muted-foreground">Carregando prova…</p> : loadError ? <p role="alert" className="text-sm text-destructive">Não foi possível carregar a prova. Feche e tente novamente.</p> : <>
      <label className="block space-y-2 text-sm"><span>Título da prova</span><input required value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inputClass} /></label>
      {questoes.map((q, i) => <fieldset key={i} className="space-y-3 border-b border-border pb-5">
        <legend className="font-medium text-sm mb-3">Questão {i + 1}</legend>
        <label className="block space-y-2 text-sm"><span>Enunciado</span><textarea required value={q.enunciado} onChange={(e) => update(i, { enunciado: e.target.value })} className={inputClass} /></label>
        <div className="space-y-2">
          {q.alternativas.map((a, j) => <div key={j} className="flex items-center gap-3">
            <input type="radio" name={`correct-${i}`} aria-label={`Alternativa correta ${j + 1} da questão ${i + 1}`} checked={q.correta === j} onChange={() => update(i, { correta: j })} className="accent-primary shrink-0" />
            <input required aria-label={`Alternativa ${j + 1} da questão ${i + 1}`} value={a} onChange={(e) => update(i, { alternativas: q.alternativas.map((old, index) => index === j ? e.target.value : old) })} className={inputClass} />
          </div>)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Resposta correta: alternativa {q.correta + 1}</span>
          <Button variant="ghost" title="Excluir questão" aria-label={`Excluir questão ${i + 1}`} onClick={() => setQuestoes((current) => current.filter((_, index) => index !== i))}><Trash2 className="size-4" /></Button>
        </div>
      </fieldset>)}
      <div className="flex flex-wrap justify-between gap-3">
        <Button variant="outline" onClick={() => setQuestoes((current) => [...current, newQuestion()])}><Plus className="size-4" />Adicionar questão</Button>
        <Button type="submit" disabled={saving}><Save className="size-4" />{saving ? "Salvando…" : "Salvar prova"}</Button>
      </div>
    </>}
  </form>;
}