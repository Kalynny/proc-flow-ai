CREATE TABLE public.user_setores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  setor text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, setor)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_setores TO authenticated;
GRANT ALL ON public.user_setores TO service_role;
ALTER TABLE public.user_setores ENABLE ROW LEVEL SECURITY;
CREATE POLICY ust_admin_all ON public.user_setores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY ust_select_own ON public.user_setores FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS proc_select_auth ON public.procedimentos;
CREATE POLICY proc_select_auth ON public.procedimentos FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_setores us WHERE us.user_id = auth.uid() AND us.setor = procedimentos.setor)
  );