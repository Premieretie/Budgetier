import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      requiresConsent: false,

      initializeAuth: async () => {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const response = await api.get('/auth/me');
            const user = response.data.data.user;
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              requiresConsent: !user.consentGiven,
            });
          } catch (error) {
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          set({ isLoading: false });
        }
      },

      login: async (email, password) => {
        try {
          set({ error: null });
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data.data;

          localStorage.setItem('token', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          set({
            user,
            token,
            isAuthenticated: true,
            requiresConsent: !user.consentGiven,
            error: null,
          });

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed. Please try again.';
          set({ error: message });
          return { success: false, error: message };
        }
      },

      register: async (userData) => {
        try {
          set({ error: null });
          const response = await api.post('/auth/register', userData);
          const { user, token } = response.data.data;

          localStorage.setItem('token', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          set({
            user,
            token,
            isAuthenticated: true,
            requiresConsent: !user.consentGiven,
            error: null,
          });

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed. Please try again.';
          set({ error: message });
          return { success: false, error: message };
        }
      },

      acceptConsent: async () => {
        try {
          const response = await api.patch('/auth/consent', { consentGiven: true, dataRetentionAgreement: true });
          set({
            user: { ...get().user, consentGiven: true },
            requiresConsent: false,
          });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to accept privacy policy.';
          return { success: false, error: message };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      updateUser: (updates) => {
        set((state) => ({
          user: { ...state.user, ...updates },
        }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
