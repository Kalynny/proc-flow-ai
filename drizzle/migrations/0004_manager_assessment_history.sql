CREATE TABLE public.treinamento_resultado_detalhes (
 resultado_id uuid PRIMARY KEY REFERENCES public.treinamento_resultados(id) ON DELETE CASCADE,
 colaborador text NOT NULL,
 treinamento text NOT NULL,
 avaliacao text NOT NULL,
 questoes jsonb NOT NULL,
 gabarito jsonb NOT NULL
);
GRANT SELECT ON public.treinamento_resultado_detalhes TO authenticated;
GRANT ALL ON public.treinamento_resultado_detalhes TO service_role;
ALTER TABLE public.treinamento_resultado_detalhes ENABLE ROW LEVEL SECURITY;
CREATE POLICY detalhe_gestor_read ON public.treinamento_resultado_detalhes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
COMMENT ON TABLE public.treinamento_resultado_detalhes IS 'Immutable question and answer-key snapshots for manager review. Only completed assessment snapshots are exposed; live answer keys remain admin-only.';
CREATE FUNCTION public.registrar_detalhes_resultado() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 INSERT INTO public.treinamento_resultado_detalhes(resultado_id, colaborador, treinamento, avaliacao, questoes, gabarito)
 SELECT NEW.id, COALESCE(NULLIF(trim(pr.full_name), ''), pr.email, 'Colaborador'), p.titulo, a.titulo, a.questoes, g.respostas
 FROM public.treinamento_avaliacoes a JOIN public.procedimentos p ON p.id=a.procedimento_id JOIN public.treinamento_gabaritos g ON g.avaliacao_id=a.id LEFT JOIN public.profiles pr ON pr.id=NEW.user_id
 WHERE a.id=NEW.avaliacao_id AND a.procedimento_id=NEW.procedimento_id;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.registrar_detalhes_resultado() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER registrar_detalhes_resultado AFTER INSERT ON public.treinamento_resultados FOR EACH ROW EXECUTE FUNCTION public.registrar_detalhes_resultado();
CREATE FUNCTION public.listar_resultados_gestor() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')) THEN RAISE EXCEPTION 'Acesso restrito a gestores e administradores' USING ERRCODE='42501'; END IF;
 RETURN COALESCE((SELECT jsonb_agg(row_to_json(x) ORDER BY x.created_at DESC, x.id) FROM (
 SELECT r.id, r.user_id, r.procedimento_id, r.created_at, r.acertos, r.total,
 COALESCE(d.colaborador, NULLIF(trim(pr.full_name), ''), pr.email, 'Colaborador') AS colaborador,
 COALESCE(d.treinamento, p.titulo, 'Treinamento indisponível') AS treinamento
 FROM public.treinamento_resultados r LEFT JOIN public.treinamento_resultado_detalhes d ON d.resultado_id=r.id LEFT JOIN public.profiles pr ON pr.id=r.user_id LEFT JOIN public.procedimentos p ON p.id=r.procedimento_id
 ) x), '[]'::jsonb);
END; $$;
REVOKE ALL ON FUNCTION public.listar_resultados_gestor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.listar_resultados_gestor() TO authenticated;
CREATE FUNCTION public.consultar_resultado_gestor(_resultado_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE detail jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')) THEN RAISE EXCEPTION 'Acesso restrito a gestores e administradores' USING ERRCODE='42501'; END IF;
 SELECT jsonb_build_object('id', r.id, 'respostas', r.respostas, 'questoes', d.questoes, 'gabarito', d.gabarito, 'avaliacao', d.avaliacao)
 INTO detail FROM public.treinamento_resultados r LEFT JOIN public.treinamento_resultado_detalhes d ON d.resultado_id=r.id WHERE r.id=_resultado_id;
 IF detail IS NULL THEN RAISE EXCEPTION 'Resultado não encontrado'; END IF;
 RETURN detail;
END; $$;
REVOKE ALL ON FUNCTION public.consultar_resultado_gestor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consultar_resultado_gestor(uuid) TO authenticated;