DROP POLICY IF EXISTS proc_update_editor ON public.procedimentos;
CREATE POLICY proc_update_admin ON public.procedimentos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));