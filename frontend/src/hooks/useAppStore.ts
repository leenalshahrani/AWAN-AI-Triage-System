import { create } from 'zustand';
import { authService } from '@services/auth.service';
import type { ThemeMode, Language, User } from '@/types/index';

function getUserFromToken(token: string | null): User | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.sub || !payload.role) return null;
    return {
      id: 0,
      username: payload.sub,
      role: payload.role as User['role'],
      fullName: payload.full_name || '',
      email: payload.email || '',
    };
  } catch {
    return null;
  }
}

interface AppState {
  theme: ThemeMode;
  language: Language;
  user: User | null;
  token: string | null;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  setUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const _storedToken = localStorage.getItem('auth_token');

export const useAppStore = create<AppState>((set) => ({
  theme: (localStorage.getItem('theme') as ThemeMode) || 'light',
  language: (localStorage.getItem('language') as Language) || 'en',
  user: getUserFromToken(_storedToken),
  token: _storedToken,

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },

  setLanguage: (language) => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    set({ language });
  },

  setUser: (user) => set({ user }),

  login: async (username, password) => {
    const token = await authService.login(username, password);
    const me = await authService.getCurrentUser();
    const user: User = {
      id: 0,
      username: me.username,
      role: me.role as User['role'],
      fullName: me.full_name,
      email: me.email,
    };
    set({ token, user });
  },

  logout: () => {
    authService.logout();
    set({ token: null, user: null });
  },
}));
