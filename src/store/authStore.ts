import { create } from 'zustand';
import { User } from '@/types';

// Cookie helpers for cross-subdomain auth (landing page <-> app)
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  // Use domain for production (e.g., .homico.ge for cross-subdomain)
  const domain = typeof window !== 'undefined' && window.location.hostname.includes('homico.ge')
    ? '; domain=.homico.ge'
    : '';
  document.cookie = `${name}=${value}; expires=${expires}; path=/${domain}; SameSite=Lax`;
};

const deleteCookie = (name: string) => {
  const domain = typeof window !== 'undefined' && window.location.hostname.includes('homico.ge')
    ? '; domain=.homico.ge'
    : '';
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${domain}`;
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    // Also set cookies for cross-subdomain access (landing page)
    setCookie('auth_token', token);
    setCookie('user_role', user.role);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Also clear cookies
    deleteCookie('auth_token');
    deleteCookie('user_role');
    set({ user: null, token: null, isAuthenticated: false });
  },

  initAuth: () => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');

    if (user && token) {
      set({
        user: JSON.parse(user),
        token,
        isAuthenticated: true,
      });
    }
  },
}));
