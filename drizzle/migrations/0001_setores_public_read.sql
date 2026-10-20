GRANT SELECT ON public.setores TO anon;
CREATE POLICY setores_select_anon ON public.setores FOR SELECT TO anon USING (true);