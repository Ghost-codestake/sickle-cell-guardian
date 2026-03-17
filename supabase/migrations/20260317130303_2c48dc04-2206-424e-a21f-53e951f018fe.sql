
-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'clinician');

-- Create enum for risk levels
CREATE TYPE public.risk_level AS ENUM ('low', 'moderate', 'high', 'critical');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  title TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mrn TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  blood_type TEXT,
  genotype TEXT DEFAULT 'HbSS',
  diagnosis_date DATE,
  emergency_contact TEXT,
  emergency_phone TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update patients" ON public.patients FOR UPDATE TO authenticated USING (true);

-- Create vitals table
CREATE TABLE public.vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  heart_rate INTEGER,
  spo2 NUMERIC(5,2),
  temperature NUMERIC(4,1),
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  hbs_level NUMERIC(5,2),
  reticulocyte_count NUMERIC(5,2),
  wbc_count NUMERIC(6,2),
  hemoglobin NUMERIC(4,1),
  pain_score INTEGER CHECK (pain_score >= 0 AND pain_score <= 10),
  hydration_status TEXT CHECK (hydration_status IN ('adequate', 'mild_dehydration', 'moderate_dehydration', 'severe_dehydration')),
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vitals" ON public.vitals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert vitals" ON public.vitals FOR INSERT TO authenticated WITH CHECK (auth.uid() = recorded_by);

-- Create assessments table
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  vital_id UUID REFERENCES public.vitals(id),
  risk_score NUMERIC(5,2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  confidence NUMERIC(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  risk_level risk_level NOT NULL,
  contributing_factors JSONB DEFAULT '[]',
  recommended_protocol TEXT,
  clinical_reasoning TEXT,
  action_taken TEXT,
  assessed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view assessments" ON public.assessments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert assessments" ON public.assessments FOR INSERT TO authenticated WITH CHECK (auth.uid() = assessed_by);
CREATE POLICY "Authenticated users can update assessments" ON public.assessments FOR UPDATE TO authenticated USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'clinician');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
