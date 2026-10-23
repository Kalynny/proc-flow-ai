CREATE TABLE public.treinamento_avaliacoes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 procedimento_id uuid NOT NULL UNIQUE REFERENCES public.procedimentos(id) ON DELETE CASCADE,
 titulo text NOT NULL,
 questoes jsonb NOT NULL DEFAULT '[]'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.treinamento_avaliacoes TO authenticated;
GRANT ALL ON public.treinamento_avaliacoes TO service_role;
ALTER TABLE public.treinamento_avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY avaliacao_read ON public.treinamento_avaliacoes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.procedimentos p WHERE p.id = procedimento_id));

CREATE TABLE public.treinamento_gabaritos (
 avaliacao_id uuid PRIMARY KEY REFERENCES public.treinamento_avaliacoes(id) ON DELETE CASCADE,
 respostas jsonb NOT NULL
);
GRANT SELECT ON public.treinamento_gabaritos TO authenticated;
GRANT ALL ON public.treinamento_gabaritos TO service_role;
ALTER TABLE public.treinamento_gabaritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY gabarito_admin_read ON public.treinamento_gabaritos FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.treinamento_resultados (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 avaliacao_id uuid NOT NULL REFERENCES public.treinamento_avaliacoes(id) ON DELETE CASCADE,
 procedimento_id uuid NOT NULL REFERENCES public.procedimentos(id) ON DELETE CASCADE,
 user_id uuid NOT NULL,
 respostas jsonb NOT NULL,
 acertos integer NOT NULL,
 total integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.treinamento_resultados TO authenticated;
GRANT ALL ON public.treinamento_resultados TO service_role;
ALTER TABLE public.treinamento_resultados ENABLE ROW LEVEL SECURITY;
CREATE POLICY resultado_read ON public.treinamento_resultados FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.salvar_avaliacao_treinamento(_procedimento_id uuid, _titulo text, _questoes jsonb, _gabarito jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE aid uuid; q jsonb; i integer; option_count integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Somente o administrador pode cadastrar provas'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.procedimentos WHERE id = _procedimento_id) THEN RAISE EXCEPTION 'Treinamento não encontrado'; END IF;
 IF _titulo IS NULL OR length(trim(_titulo)) = 0 OR _questoes IS NULL OR _gabarito IS NULL OR jsonb_typeof(_questoes) <> 'array' OR jsonb_typeof(_gabarito) <> 'array' THEN RAISE EXCEPTION 'Preencha o título e as questões'; END IF;
 IF jsonb_array_length(_questoes) = 0 OR jsonb_array_length(_questoes) <> jsonb_array_length(_gabarito) THEN RAISE EXCEPTION 'Cadastre questões e suas respostas corretas'; END IF;
 FOR i IN 0..jsonb_array_length(_questoes)-1 LOOP
  q := _questoes->i;
  IF jsonb_typeof(q->'enunciado') IS DISTINCT FROM 'string' OR length(trim(q->>'enunciado')) = 0 OR jsonb_typeof(q->'alternativas') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Questão inválida'; END IF;
  option_count := jsonb_array_length(q->'alternativas');
  IF option_count < 2 OR EXISTS (SELECT 1 FROM jsonb_array_elements(q->'alternativas') a WHERE jsonb_typeof(a) <> 'string' OR length(trim(a #>> '{}')) = 0) THEN RAISE EXCEPTION 'Preencha ao menos duas alternativas por questão'; END IF;
  IF jsonb_typeof(_gabarito->i) IS DISTINCT FROM 'number' OR (_gabarito->>i) !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Resposta correta inválida'; END IF;
  IF (_gabarito->>i)::integer >= option_count THEN RAISE EXCEPTION 'Resposta correta inválida'; END IF;
 END LOOP;
 INSERT INTO public.treinamento_avaliacoes(procedimento_id, titulo, questoes) VALUES (_procedimento_id, trim(_titulo), _questoes)
 ON CONFLICT (procedimento_id) DO UPDATE SET titulo = EXCLUDED.titulo, questoes = EXCLUDED.questoes, updated_at = clock_timestamp() RETURNING id INTO aid;
 INSERT INTO public.treinamento_gabaritos(avaliacao_id, respostas) VALUES(aid, _gabarito) ON CONFLICT (avaliacao_id) DO UPDATE SET respostas = EXCLUDED.respostas;
 RETURN aid;
END;
$$;
REVOKE ALL ON FUNCTION public.salvar_avaliacao_treinamento(uuid, text, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.salvar_avaliacao_treinamento(uuid, text, jsonb, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.enviar_avaliacao_treinamento(_procedimento_id uuid, _avaliacao_id uuid, _updated_at timestamptz, _respostas jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.treinamento_avaliacoes; g jsonb; i integer; hits integer := 0; n integer; rid uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.procedimentos p WHERE p.id = _procedimento_id AND (public.has_role(auth.uid(), 'admin') OR p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.user_setores us WHERE us.user_id = auth.uid() AND us.setor = p.setor))) THEN RAISE EXCEPTION 'Treinamento indisponível para este usuário'; END IF;
 SELECT * INTO a FROM public.treinamento_avaliacoes WHERE id = _avaliacao_id AND procedimento_id = _procedimento_id FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'A avaliação não está disponível para este treinamento'; END IF;
 IF _updated_at IS NULL OR a.updated_at <> _updated_at THEN RAISE EXCEPTION 'A prova foi atualizada. Recarregue a página antes de responder'; END IF;
 SELECT respostas INTO g FROM public.treinamento_gabaritos WHERE avaliacao_id = a.id;
 IF g IS NULL THEN RAISE EXCEPTION 'A avaliação não está disponível'; END IF;
 n := jsonb_array_length(a.questoes);
 IF _respostas IS NULL OR jsonb_typeof(_respostas) <> 'array' THEN RAISE EXCEPTION 'Responda todas as questões'; END IF;
 IF jsonb_array_length(_respostas) <> n THEN RAISE EXCEPTION 'Responda todas as questões'; END IF;
 FOR i IN 0..n-1 LOOP
  IF jsonb_typeof(_respostas->i) IS DISTINCT FROM 'number' OR (_respostas->>i) !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Resposta inválida'; END IF;
  IF (_respostas->>i)::integer >= jsonb_array_length(a.questoes->i->'alternativas') THEN RAISE EXCEPTION 'Resposta inválida'; END IF;
  IF _respostas->i = g->i THEN hits := hits + 1; END IF;
 END LOOP;
 INSERT INTO public.treinamento_resultados(avaliacao_id, procedimento_id, user_id, respostas, acertos, total) VALUES(a.id, _procedimento_id, auth.uid(), _respostas, hits, n) RETURNING id INTO rid;
 RETURN jsonb_build_object('id', rid, 'acertos', hits, 'total', n);
END;
$$;
REVOKE ALL ON FUNCTION public.enviar_avaliacao_treinamento(uuid, uuid, timestamptz, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enviar_avaliacao_treinamento(uuid, uuid, timestamptz, jsonb) TO authenticated;