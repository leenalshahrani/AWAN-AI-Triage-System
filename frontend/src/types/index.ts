export interface PatientUser {
  id: number;
  national_id?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: 'M' | 'F' | 'O';
  contact_info?: string;
}

export interface ClinicalEntry {
  entry_id: number;
  patient_id: number;
  entry_datetime: string;
  pain_type: string;
  pain_location: string;
  numbness: boolean;
  other_symptoms?: string;
  duration?: string;
  severity?: string;
  height_cm?:        number;
  weight_kg?:        number;
  hypertension?:     boolean;
  heart_disease_hx?: boolean;
  ever_married?:     string;
  work_type?:        string;
  residence_type?:   string;
  smoking_status?:   string;
  chest_pain_type?:  number;
  exercise_angina?:  boolean;
  validated: boolean;
}

export interface RiskClassification {
  classification_id: number;
  entry_id: number;
  classification: 'Angina Pectoris' | 'Stroke' | 'Low Risk' | 'Non-Classified';
  risk_color: 'Red' | 'Green';
  confidence_score: number;
  processed_datetime: string;
}

export interface SystemLog {
  log_id: number;
  entry_id: number;
  action: string;
  response_time_ms: number;
  log_datetime: string;
}

export interface ClinicalInputForm {
  nationalId: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: 'M' | 'F' | 'O';
  contactInfo?: string;
  selectedSymptoms: string[];
  duration: string;
  severity: string;
  heightCm?:       number;
  weightKg?:       number;
  hypertension?:   0 | 1;
  heartDiseaseHx?: 0 | 1;
  everMarried?:    'Yes' | 'No';
  workType?:       string;
  residenceType?:  'Urban' | 'Rural';
  smokingStatus?:  string;
  chestPainType?:  1 | 2 | 3 | 4;
  exerciseAngina?: 0 | 1;
}

/** Matches the backend /v1/classification/ response */
export interface RiskAssessmentResult {
  patient: PatientUser;
  clinical_entry: ClinicalEntry;
  risk_classification: RiskClassification;
  response_time_ms: number;
  used_fallback?: boolean;
}

export type ThemeMode = 'light' | 'dark';
export type Language = 'en' | 'ar';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'physician' | 'staff';
  fullName: string;
  email: string;
}

export interface UserRecord {
  id: number;
  username?: string;
  email?: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export interface SymptomRecord {
  id: number;
  symptom: string;
  category: string;
  severity: string;
  description?: string;
  status: boolean;
}

export interface AuditLogRecord {
  id: number;
  action: string;
  user: string;
  status: string;
  timestamp: string;
}

export interface OverrideRequest {
  target_color: 'Red' | 'Green';
  justification: string;
  doctor_username: string;
}

export interface OverrideResponse {
  entry_id: number;
  previous_color: string;
  new_color: string;
  classification: string;
}

export interface DashboardStats {
  total_cases: number;
  high_risk_count: number;
  low_risk_count: number;
  avg_response_time_ms: number;
  classification_breakdown: Record<string, number>;
  daily_cases: Array<{ day: string; critical: number; safe: number }>;
}

export interface CaseRecord {
  entry_id: number;
  patient_id: number;
  patient_name: string;
  national_id?: string;
  entry_datetime: string;
  pain_type: string;
  pain_location: string;
  numbness: boolean;
  other_symptoms?: string;
  duration?: string;
  severity?: string;
  classification?: string;
  risk_color?: 'Red' | 'Green';
  confidence_score?: number;
  validated: boolean;
  patient_notified: boolean;
}

export interface CaseDetail {
  patient: {
    id: number;
    national_id?: string;
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    gender?: string;
    contact_info?: string;
  };
  clinical_entry: {
    entry_id: number;
    entry_datetime: string;
    pain_type: string;
    pain_location: string;
    numbness: boolean;
    other_symptoms?: string;
    duration?: string;
    severity?: string;
    height_cm?: number;
    weight_kg?: number;
    hypertension?: boolean;
    heart_disease_hx?: boolean;
    ever_married?: string;
    work_type?: string;
    residence_type?: string;
    smoking_status?: string;
    chest_pain_type?: number;
    exercise_angina?: boolean;
    validated: boolean;
  };
  risk_classification: {
    classification: string;
    risk_color: string;
    confidence_score: number;
    processed_datetime: string;
  } | null;
}
