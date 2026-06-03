
CREATE TABLE public.user_sistemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sistema text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sistema)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sistemas TO authenticated;
GRANT ALL ON public.user_sistemas TO service_role;

ALTER TABLE public.user_sistemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY us_select_auth ON public.user_sistemas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY us_admin_all ON public.user_sistemas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
