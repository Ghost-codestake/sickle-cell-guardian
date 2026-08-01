GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.patients, public.vitals, public.assessments, public.profiles, public.user_roles TO service_role;