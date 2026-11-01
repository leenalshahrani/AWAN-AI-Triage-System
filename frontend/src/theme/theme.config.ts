export const lightTheme = {
  colors: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      tertiary: '#F3F4F6',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
    },
    border: {
      primary: '#E5E7EB',
      secondary: '#D1D5DB',
    },
    risk: {
      high: '#EF4444',
      highBg: '#FEE2E2',
      low: '#10B981',
      lowBg: '#D1FAE5',
    },
    primary: {
      main: '#3B82F6',
      hover: '#2563EB',
      light: '#DBEAFE',
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
};

export const darkTheme = {
  colors: {
    background: {
      primary: '#111827',
      secondary: '#1F2937',
      tertiary: '#374151',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      tertiary: '#9CA3AF',
    },
    border: {
      primary: '#374151',
      secondary: '#4B5563',
    },
    risk: {
      high: '#EF4444',
      highBg: '#7F1D1D',
      low: '#10B981',
      lowBg: '#064E3B',
    },
    primary: {
      main: '#60A5FA',
      hover: '#3B82F6',
      light: '#1E3A8A',
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#60A5FA',
    },
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  },
};

export type Theme = typeof lightTheme;
