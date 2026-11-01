export const APP_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  API_TIMEOUT: 5000,
  MAX_RESPONSE_TIME_MS: 5000,
  MIN_SENSITIVITY: 90,
  SUPPORTED_LANGUAGES: ['en', 'ar'] as const,
  DEFAULT_LANGUAGE: 'en' as const,
  SUPPORTED_THEMES: ['light', 'dark'] as const,
  DEFAULT_THEME: 'light' as const,
} as const;

export const ROUTES = {
  HOME: '/',
  PATIENT: '/patient',
  PATIENT_REVIEW: '/patient/review',
  PHYSICIAN: '/physician',
  PHYSICIAN_REVIEW: '/physician/review/:caseId',
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_AI: '/admin/ai',
  LOGIN: '/login',
} as const;

export const RISK_LEVELS = {
  HIGH: 'high',
  LOW: 'low',
} as const;

export const RISK_CLASSIFICATIONS = {
  ANGINA: 'Angina Pectoris',
  STROKE: 'Stroke',
  LOW_RISK: 'Low Risk',
  NON_CLASSIFIED: 'Non-Classified',
} as const;
