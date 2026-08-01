-- Remove anon access entirely
REVOKE ALL ON public.patients FROM anon;
REVOKE ALL ON public.vitals FROM anon;
REVOKE ALL ON public.assessments FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.user_roles FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.patients, public.vitals, public.assessments, public.profiles, public.user_roles TO service_role;

-- Lock down has_role execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- Restrict SELECT to clinical staff
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;
CREATE POLICY "Clinical staff can view patients"
ON public.patients FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'clinician') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can view vitals" ON public.vitals;
CREATE POLICY "Clinical staff can view vitals"
ON public.vitals FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'clinician') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can view assessments" ON public.assessments;
CREATE POLICY "Clinical staff can view assessments"
ON public.assessments FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'clinician') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile or staff can view"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'clinician') OR public.has_role(auth.uid(), 'admin'));

-- Explicit, admin-only delete control
CREATE POLICY "Admins can delete patients"
ON public.patients FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vitals"
ON public.vitals FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete assessments"
ON public.assessments FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));