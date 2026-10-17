DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
INSERT INTO public.setores (nome, ordem)
SELECT v.nome, v.ordem FROM (VALUES ('Financeiro',1),('Operacional',2),('Faturamento',3),('Frota',4),('Recursos Humanos',5),('Monitoramento',6),('Gerenciamento de Risco',7)) AS v(nome, ordem)
WHERE NOT EXISTS (SELECT 1 FROM public.setores);