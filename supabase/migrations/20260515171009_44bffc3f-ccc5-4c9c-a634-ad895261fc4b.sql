
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');
CREATE TYPE public.setor_enum AS ENUM ('Operacional','Expedição','Faturamento','Monitoramento','Frota','RH','Financeiro','Comercial');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'editor' THEN 2 ELSE 3 END LIMIT 1
$$;

CREATE POLICY "roles_select_auth" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Procedimentos
CREATE TABLE public.procedimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  setor public.setor_enum NOT NULL,
  objetivo TEXT,
  responsavel TEXT,
  sistemas TEXT,
  passo_a_passo JSONB NOT NULL DEFAULT '[]'::jsonb,
  alertas JSONB NOT NULL DEFAULT '[]'::jsonb,
  problemas_comuns JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_url TEXT,
  pdf_url TEXT,
  qr_code_url TEXT,
  versao TEXT NOT NULL DEFAULT '1.0',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.procedimentos ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_proc_setor ON public.procedimentos(setor);
CREATE INDEX idx_proc_codigo ON public.procedimentos(codigo);

CREATE POLICY "proc_select_auth" ON public.procedimentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "proc_insert_editor" ON public.procedimentos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "proc_update_editor" ON public.procedimentos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "proc_delete_admin" ON public.procedimentos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- Versões
CREATE TABLE public.procedimento_versoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedimento_id UUID NOT NULL REFERENCES public.procedimentos(id) ON DELETE CASCADE,
  versao TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  responsavel TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.procedimento_versoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ver_select_auth" ON public.procedimento_versoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "ver_insert_editor" ON public.procedimento_versoes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_proc_updated BEFORE UPDATE ON public.procedimentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + first user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_count INT;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.email);
  SELECT count(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
