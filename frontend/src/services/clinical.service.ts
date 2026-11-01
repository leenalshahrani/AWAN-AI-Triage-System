import { apiService } from './api.service';
import type {
  ClinicalInputForm,
  RiskAssessmentResult,
  PatientUser,
  ClinicalEntry,
  DashboardStats,
  UserRecord,
  SymptomRecord,
  AuditLogRecord,
  CaseRecord,
  CaseDetail,
  OverrideRequest,
  OverrideResponse,
} from '@/types/index';

export class ClinicalService {
  async lookupPatientByNationalId(nationalId: string): Promise<PatientUser | null> {
    try {
      return await apiService.get<PatientUser>(`/v1/patients/by-national-id/${nationalId}`);
    } catch {
      return null;
    }
  }

  async submitClinicalData(data: ClinicalInputForm): Promise<RiskAssessmentResult> {
    const symptoms = data.selectedSymptoms;
    const primary = symptoms[0] || 'General';
    const hasNumbness = symptoms.some(s => s.toLowerCase().includes('numb'));
    const others = symptoms.slice(1).join(', ');

    const payload = {
      patient: {
        national_id: data.nationalId,
        first_name: data.firstName || '',
        last_name: data.lastName || '',
        date_of_birth: data.dateOfBirth || null,
        gender: data.gender || null,
        contact_info: data.contactInfo || null,
      },
      clinical_data: {
        pain_type:        primary,
        pain_location:    primary,
        numbness:         hasNumbness,
        other_symptoms:   others,
        duration:         data.duration,
        severity:         data.severity,
        height_cm:        data.heightCm        ?? null,
        weight_kg:        data.weightKg        ?? null,
        hypertension:     data.hypertension    ?? null,
        heart_disease_hx: data.heartDiseaseHx  ?? null,
        ever_married:     data.everMarried     ?? null,
        work_type:        data.workType        ?? null,
        residence_type:   data.residenceType   ?? null,
        smoking_status:   data.smokingStatus   ?? null,
        chest_pain_type:  data.chestPainType   ?? null,
        exercise_angina:  data.exerciseAngina  ?? null,
      },
    };
    return apiService.post<RiskAssessmentResult>('/v1/classification/', payload);
  }

  async getClinicalEntry(entryId: number): Promise<ClinicalEntry> {
    return apiService.get<ClinicalEntry>(`/v1/classification/case/${entryId}`);
  }

  async getAllCases(filters?: { startDate?: string; endDate?: string; riskLevel?: string }): Promise<CaseRecord[]> {
    const params: Record<string, unknown> = {};
    if (filters?.startDate) params.start_date = filters.startDate;
    if (filters?.endDate) params.end_date = filters.endDate;
    if (filters?.riskLevel) params.risk_color = filters.riskLevel;
    return apiService.get<CaseRecord[]>('/v1/cases/', params);
  }

  async getPatientCases(nationalId: string): Promise<CaseRecord[]> {
    return apiService.get<CaseRecord[]>('/v1/cases/', { national_id: nationalId, notified_only: true });
  }

  async getCaseDetail(entryId: number): Promise<CaseDetail> {
    return apiService.get<CaseDetail>(`/v1/cases/${entryId}`);
  }

  async validateCase(entryId: number): Promise<void> {
    return apiService.patch(`/v1/cases/${entryId}/validate`);
  }

  async overrideCase(entryId: number, data: OverrideRequest): Promise<OverrideResponse> {
    return apiService.patch<OverrideResponse>(`/v1/cases/${entryId}/override`, data);
  }

  async notifyPatient(entryId: number, doctorUsername: string): Promise<void> {
    return apiService.post(`/v1/cases/${entryId}/notify`, { doctor_username: doctorUsername });
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return apiService.get<DashboardStats>('/v1/analytics/dashboard');
  }

  async getPerformanceMetrics(): Promise<{ total_requests: number; avg_response_time_ms: number; max_response_time_ms: number; within_threshold: number }> {
    return apiService.get('/v1/analytics/performance');
  }

  // Users
  async getUsers(): Promise<UserRecord[]> {
    return apiService.get<UserRecord[]>('/v1/users/');
  }

  async createUser(data: { username: string; email: string; full_name: string; role: string; password: string }): Promise<UserRecord> {
    return apiService.post<UserRecord>('/v1/users/', data);
  }

  async updateUser(id: number, data: Partial<{ email: string; full_name: string; role: string; is_active: boolean; password: string }>): Promise<UserRecord> {
    return apiService.put<UserRecord>(`/v1/users/${id}`, data);
  }

  async deleteUser(id: number): Promise<void> {
    return apiService.delete(`/v1/users/${id}`);
  }

  // Symptoms
  async getSymptoms(): Promise<SymptomRecord[]> {
    return apiService.get<SymptomRecord[]>('/v1/symptoms/');
  }

  async createSymptom(data: Omit<SymptomRecord, 'id'>): Promise<SymptomRecord> {
    return apiService.post<SymptomRecord>('/v1/symptoms/', data);
  }

  async updateSymptom(id: number, data: Partial<SymptomRecord>): Promise<SymptomRecord> {
    return apiService.put<SymptomRecord>(`/v1/symptoms/${id}`, data);
  }

  async deleteSymptom(id: number): Promise<void> {
    return apiService.delete(`/v1/symptoms/${id}`);
  }

  // Patients
  async getPatients(): Promise<PatientUser[]> {
    return apiService.get<PatientUser[]>('/v1/patients/');
  }

  async createPatient(data: Partial<PatientUser>): Promise<PatientUser> {
    return apiService.post<PatientUser>('/v1/patients/', data);
  }

  async updatePatient(id: number, data: Partial<PatientUser & { password: string }>): Promise<PatientUser> {
    return apiService.put<PatientUser>(`/v1/patients/${id}`, data);
  }

  async deletePatient(id: number): Promise<void> {
    return apiService.delete(`/v1/patients/${id}`);
  }

  // Audit Logs
  async getAuditLogs(): Promise<AuditLogRecord[]> {
    return apiService.get<AuditLogRecord[]>('/v1/audit/');
  }
}

export const clinicalService = new ClinicalService();
