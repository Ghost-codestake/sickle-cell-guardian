
-- Fix overly permissive UPDATE policies by scoping to authenticated clinicians
DROP POLICY "Authenticated users can update patients" ON public.patients;
CREATE POLICY "Clinicians can update patients" ON public.patients FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'clinician') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY "Authenticated users can update assessments" ON public.assessments;
CREATE POLICY "Clinicians can update assessments" ON public.assessments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'clinician') OR public.has_role(auth.uid(), 'admin'));
