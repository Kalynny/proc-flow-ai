
-- 1. setores
CREATE TABLE public.setores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  departamento text,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.setores TO authenticated;
GRANT SELECT ON public.setores TO anon;
GRANT ALL ON public.setores TO service_role;
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
CREATE POLICY setores_select_auth ON public.setores FOR SELECT TO authenticated USING (true);
CREATE POLICY setores_admin_all ON public.setores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_setores_updated BEFORE UPDATE ON public.setores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. sistemas
CREATE TABLE public.sistemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  finalidade text,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sistemas TO authenticated;
GRANT SELECT ON public.sistemas TO anon;
GRANT ALL ON public.sistemas TO service_role;
ALTER TABLE public.sistemas ENABLE ROW LEVEL SECURITY;
CREATE POLICY sistemas_select_auth ON public.sistemas FOR SELECT TO authenticated USING (true);
CREATE POLICY sistemas_admin_all ON public.sistemas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_sistemas_updated BEFORE UPDATE ON public.sistemas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. sistema_setores (link)
CREATE TABLE public.sistema_setores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sistema_id uuid NOT NULL REFERENCES public.sistemas(id) ON DELETE CASCADE,
  setor_id uuid NOT NULL REFERENCES public.setores(id) ON DELETE CASCADE,
  label text,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sistema_id, setor_id)
);
GRANT SELECT ON public.sistema_setores TO authenticated;
GRANT SELECT ON public.sistema_setores TO anon;
GRANT ALL ON public.sistema_setores TO service_role;
ALTER TABLE public.sistema_setores ENABLE ROW LEVEL SECURITY;
CREATE POLICY ss_select_auth ON public.sistema_setores FOR SELECT TO authenticated USING (true);
CREATE POLICY ss_admin_all ON public.sistema_setores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. subpastas
CREATE TABLE public.subpastas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setor_id uuid NOT NULL REFERENCES public.setores(id) ON DELETE CASCADE,
  nome text NOT NULL,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (setor_id, nome)
);
GRANT SELECT ON public.subpastas TO authenticated;
GRANT SELECT ON public.subpastas TO anon;
GRANT ALL ON public.subpastas TO service_role;
ALTER TABLE public.subpastas ENABLE ROW LEVEL SECURITY;
CREATE POLICY sub_select_auth ON public.subpastas FOR SELECT TO authenticated USING (true);
CREATE POLICY sub_admin_all ON public.subpastas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. procedimentos.setor: enum -> text para suportar setores criados via CRUD
ALTER TABLE public.procedimentos ALTER COLUMN setor TYPE text USING setor::text;

-- 6. SEED setores
INSERT INTO public.setores (nome, ordem) VALUES
  ('Aferição de Pneus', 10),
  ('Bee Vale RH', 20),
  ('Cheklist', 30),
  ('Comercial', 40),
  ('Contrato de Frete', 50),
  ('Faturamento', 60),
  ('Financeiro', 70),
  ('Frota', 80),
  ('Gerenciamento de Risco', 90),
  ('Mobile', 100),
  ('Monitoramento', 110),
  ('Nota Fiscal', 120),
  ('Operacional', 130),
  ('Ranking Motoristas', 140),
  ('Solides RH', 150)
ON CONFLICT (nome) DO NOTHING;

-- 7. SEED sistemas
INSERT INTO public.sistemas (nome, descricao, finalidade, ordem) VALUES
  ('GW-WEBTRANS', 'Sistema principal de gestão de transporte rodoviário de cargas da GKO/Senior, responsável por toda a operação administrativa e financeira da transportadora.', 'Centralizar emissão de documentos fiscais (CT-e, MDF-e), contratos de frete, faturamento, contas a pagar/receber e gestão comercial.', 10),
  ('GW-FROTA', 'Módulo de gestão de frota integrado ao GW, voltado para o controle completo dos veículos e custos de manutenção.', 'Controlar abastecimento, almoxarifado, pneus, ordens de serviço, multas, checklist e compras relacionadas à frota.', 20),
  ('GW-MOBILE', 'Aplicativo mobile utilizado pelos motoristas para registro de eventos de viagem em tempo real.', 'Permitir que motoristas registrem coletas, entregas, ocorrências (ADV), CT-e, manifestos e romaneios direto do celular.', 30),
  ('GW-LOGIS', 'Módulo logístico do GW para tratamento de notas fiscais e integração com clientes.', 'Receber, validar e processar notas fiscais eletrônicas para emissão de documentos de transporte.', 40),
  ('A52', 'Sistema de monitoramento e rastreamento veicular utilizado pelo time de monitoramento.', 'Acompanhar em tempo real a localização das cargas, status de viagens e segurança operacional.', 50),
  ('NGO', 'Sistema de gerenciamento de risco e gestão de seguros.', 'Avaliar perfil de motoristas, consultar histórico, gerenciar apólices e mitigar riscos operacionais.', 60),
  ('SOLIDES', 'Plataforma de gestão de pessoas e RH analítico utilizada para processos seletivos e gestão comportamental.', 'Realizar recrutamento, avaliações de perfil, gestão de benefícios, treinamentos e jornada de trabalho.', 70),
  ('BEE VALE', 'Plataforma de benefícios corporativos (vale-alimentação, refeição e demais benefícios).', 'Gerenciar cartões de benefícios, recargas e relatórios de utilização pelos colaboradores.', 80),
  ('PROLOG', 'Sistema de gestão operacional voltado para controle de pneus e checklist de veículos.', 'Realizar aferição de pneus, controle de vida útil, registro de checklist diário e indicadores operacionais.', 90),
  ('GAME TRUCK', 'Plataforma de gamificação para motoristas baseada em indicadores de performance.', 'Ranquear motoristas por desempenho, segurança e produtividade, incentivando boas práticas.', 100),
  ('TRUCK DIGITAL', 'Plataforma digital para gestão de contratos de frete eletrônicos.', 'Formalizar, assinar digitalmente e acompanhar contratos de frete com agregados e terceiros.', 110)
ON CONFLICT (nome) DO NOTHING;

-- 8. SEED sistema_setores
WITH pairs(sis, setor, ordem) AS (VALUES
  ('GW-WEBTRANS','Comercial',10), ('GW-WEBTRANS','Contrato de Frete',20), ('GW-WEBTRANS','Faturamento',30),
  ('GW-WEBTRANS','Financeiro',40), ('GW-WEBTRANS','Gerenciamento de Risco',50), ('GW-WEBTRANS','Operacional',60),
  ('GW-FROTA','Frota',10),
  ('GW-MOBILE','Mobile',10),
  ('GW-LOGIS','Nota Fiscal',10),
  ('A52','Monitoramento',10),
  ('NGO','Gerenciamento de Risco',10),
  ('SOLIDES','Solides RH',10),
  ('BEE VALE','Bee Vale RH',10),
  ('PROLOG','Aferição de Pneus',10), ('PROLOG','Cheklist',20),
  ('GAME TRUCK','Ranking Motoristas',10),
  ('TRUCK DIGITAL','Contrato de Frete',10)
)
INSERT INTO public.sistema_setores (sistema_id, setor_id, ordem)
SELECT s.id, se.id, p.ordem
FROM pairs p
JOIN public.sistemas s ON s.nome = p.sis
JOIN public.setores se ON se.nome = p.setor
ON CONFLICT DO NOTHING;

-- 9. SEED subpastas
WITH subs(setor, nome, ordem) AS (VALUES
  ('Comercial','Alinhamento Operacional',10), ('Comercial','Cotação de Frete',20), ('Comercial','Prospecção de Clientes',30),
  ('Operacional','ADV',10), ('Operacional','Coleta',20), ('Operacional','Contrato de Frete',30), ('Operacional','CT-e',40), ('Operacional','Manifesto',50), ('Operacional','Romaneio',60),
  ('Gerenciamento de Risco','Analise de Dados',10), ('Gerenciamento de Risco','Rastreamento',20), ('Gerenciamento de Risco','Seguro',30),
  ('Faturamento','Cadastro',10), ('Faturamento','CT-e',20), ('Faturamento','NF Serviço',30), ('Faturamento','Receita Financeira',40),
  ('Monitoramento','Monitoramento da Carga',10), ('Monitoramento','Monitoramento do Canhoto',20),
  ('Financeiro','Cadastros',10), ('Financeiro','Conc. Bancaria',20), ('Financeiro','Contas a Pagar',30), ('Financeiro','Contas a Receber',40), ('Financeiro','Contrato de Frete',50),
  ('Frota','Abastecimento',10), ('Frota','Almoxarifado',20), ('Frota','Checklist',30), ('Frota','Compras',40), ('Frota','Multas',50), ('Frota','Ordens de Serviços',60), ('Frota','Pneus',70),
  ('Mobile','ADV',10), ('Mobile','Coleta',20), ('Mobile','Configurações',30), ('Mobile','CT-e',40), ('Mobile','Manifesto',50), ('Mobile','Romaneio',60),
  ('Solides RH','Benefícios',10), ('Solides RH','Jornada de Trabalho',20), ('Solides RH','Palestras e Treinamento',30), ('Solides RH','Recrutamento',40),
  ('Bee Vale RH','Benefícios',10), ('Bee Vale RH','Jornada de Trabalho',20), ('Bee Vale RH','Palestras e Treinamento',30), ('Bee Vale RH','Recrutamento',40),
  ('Aferição de Pneus','Benefícios',10), ('Aferição de Pneus','Jornada de Trabalho',20), ('Aferição de Pneus','Palestras e Treinamento',30), ('Aferição de Pneus','Recrutamento',40),
  ('Cheklist','Benefícios',10), ('Cheklist','Jornada de Trabalho',20), ('Cheklist','Palestras e Treinamento',30), ('Cheklist','Recrutamento',40),
  ('Contrato de Frete','Benefícios',10), ('Contrato de Frete','Jornada de Trabalho',20), ('Contrato de Frete','Palestras e Treinamento',30), ('Contrato de Frete','Recrutamento',40),
  ('Nota Fiscal','Benefícios',10), ('Nota Fiscal','Jornada de Trabalho',20), ('Nota Fiscal','Palestras e Treinamento',30), ('Nota Fiscal','Recrutamento',40),
  ('Ranking Motoristas','Benefícios',10), ('Ranking Motoristas','Jornada de Trabalho',20), ('Ranking Motoristas','Palestras e Treinamento',30), ('Ranking Motoristas','Recrutamento',40)
)
INSERT INTO public.subpastas (setor_id, nome, ordem)
SELECT se.id, s.nome, s.ordem
FROM subs s
JOIN public.setores se ON se.nome = s.setor
ON CONFLICT DO NOTHING;
