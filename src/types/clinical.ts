export interface Patient {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  blood_type: string | null;
  genotype: string;
  diagnosis_date: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vital {
  id: string;
  patient_id: string;
  heart_rate: number | null;
  spo2: number | null;
  temperature: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  hbs_level: number | null;
  reticulocyte_count: number | null;
  wbc_count: number | null;
  hemoglobin: number | null;
  pain_score: number | null;
  hydration_status: string | null;
  recorded_by: string | null;
  recorded_at: string;
}

export interface ContributingFactor {
  vital: string;
  direction: 'up' | 'down' | 'normal';
  impact_percent: number;
  detail: string;
}

export interface Assessment {
  id: string;
  patient_id: string;
  vital_id: string | null;
  risk_score: number;
  confidence: number | null;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  contributing_factors: ContributingFactor[];
  recommended_protocol: string | null;
  clinical_reasoning: string | null;
  action_taken: string | null;
  assessed_by: string | null;
  created_at: string;
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
