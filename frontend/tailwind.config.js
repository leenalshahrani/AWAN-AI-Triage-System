/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sidebar:    '#0F172A',
        mint:       '#00D0B0',
        critical:   '#EF4444',
        safe:       '#10B981',
        warning:    '#F59E0B',
        background: '#F1F5F9',
        cardBg:     '#ffffff',
        violet:     '#7C3AED',
        blue:       '#3B82F6',
      },
      borderRadius: {
        awan: '12px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:   '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md': '0 4px 12px rgba(0,0,0,0.08)',
        sidebar: '4px 0 24px rgba(0,0,0,0.15)',
      },
      backgroundImage: {
        'sidebar-gradient': 'linear-gradient(180deg, #00D0B0 0%, #00967D 40%, #0F172A 100%)',
      },
    },
  },
  plugins: [],
};
