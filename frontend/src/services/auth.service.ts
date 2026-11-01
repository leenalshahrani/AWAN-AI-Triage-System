import { APP_CONFIG } from '@config/app.config';

const BASE = APP_CONFIG.API_BASE_URL;

async function request<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${url}`, options);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return response.json();
}

export const authService = {
  // ── Staff / Admin / Physician ────────────────────────────────────────────

  async login(username: string, password: string): Promise<string> {
    const data = await request<{ access_token: string; token_type: string }>(
      '/v1/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password }).toString(),
      }
    );
    localStorage.setItem('auth_token', data.access_token);
    return data.access_token;
  },

  async getCurrentUser(): Promise<{ username: string; role: string; full_name: string; email: string }> {
    const token = localStorage.getItem('auth_token');
    return request('/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  logout(): void {
    localStorage.removeItem('auth_token');
  },

  // ── Patient ───────────────────────────────────────────────────────────────

  async patientLogin(nationalId: string, password: string): Promise<string> {
    const data = await request<{ access_token: string; token_type: string }>(
      '/v1/auth/patient-login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ national_id: nationalId, password }),
      }
    );
    localStorage.setItem('patient_token', data.access_token);
    return data.access_token;
  },

  async changePatientPassword(oldPassword: string, newPassword: string): Promise<void> {
    const token = localStorage.getItem('patient_token');
    await request('/v1/auth/patient/change-password', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  },

  patientLogout(): void {
    localStorage.removeItem('patient_token');
  },

  getPatientFromToken(): { nationalId: string; fullName: string; userId: number } | null {
    const token = localStorage.getItem('patient_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'patient' || !payload.national_id) return null;
      return {
        nationalId: payload.national_id,
        fullName: payload.full_name || '',
        userId: payload.user_id || 0,
      };
    } catch {
      return null;
    }
  },
};
