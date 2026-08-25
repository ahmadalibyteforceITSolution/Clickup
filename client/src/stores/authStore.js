import { defineStore } from 'pinia';
import axios from 'axios';

function extractErrorMessage(err) {
  if (!err) return 'An unexpected error occurred';
  if (typeof err === 'string') return err;
  if (err.response?.data) {
    if (typeof err.response.data === 'string') return err.response.data;
    if (typeof err.response.data.error === 'string') return err.response.data.error;
    if (typeof err.response.data.message === 'string') return err.response.data.message;
  }
  return err.message || 'An unexpected error occurred';
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: null,
    users: [],
    loading: false,
    error: null,
    authModalOpen: false,
    authMode: 'login', // 'login' | 'register' | 'verify'
    unverifiedEmail: '',
    previewVerificationCode: ''
  }),

  getters: {
    isSuperAdmin: (state) => state.currentUser?.role === 'super_admin',
    isManager: (state) => state.currentUser?.role === 'manager' || state.currentUser?.role === 'super_admin',
    isEmployee: (state) => state.currentUser?.role === 'employee',
    roleLabel: (state) => {
      if (!state.currentUser) return '';
      switch (state.currentUser.role) {
        case 'super_admin': return 'Super Admin';
        case 'manager': return 'Manager';
        case 'employee': return 'Employee';
        default: return state.currentUser.role;
      }
    }
  },

  actions: {
    async fetchUsers() {
      this.loading = true;
      try {
        const res = await axios.get('/api/users');
        this.users = Array.isArray(res.data) ? res.data : [];

        if (!this.currentUser && this.users.length > 0) {
          this.currentUser = this.users[0];
        }
      } catch (err) {
        this.users = [];
        this.error = extractErrorMessage(err);
      } finally {
        this.loading = false;
      }
    },

    switchUser(user) {
      this.currentUser = user;
    },

    async register(userData) {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.post('/api/auth/register', userData);
        this.unverifiedEmail = userData.email;
        this.previewVerificationCode = res.data.verificationCode || '';
        this.authMode = 'verify';
        return res.data;
      } catch (err) {
        const msg = extractErrorMessage(err);
        this.error = msg;
        throw new Error(msg);
      } finally {
        this.loading = false;
      }
    },

    async verifyEmail(email, code) {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.post('/api/auth/verify-email', { email, code });
        this.currentUser = res.data.user;
        this.authModalOpen = false;
        this.previewVerificationCode = '';
        await this.fetchUsers();
        return res.data;
      } catch (err) {
        const msg = extractErrorMessage(err);
        this.error = msg;
        throw new Error(msg);
      } finally {
        this.loading = false;
      }
    },

    async resendVerificationCode(email) {
      try {
        const res = await axios.post('/api/auth/resend-code', { email });
        this.previewVerificationCode = res.data.verificationCode || '';
        return res.data;
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },

    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.post('/api/auth/login', { email, password });
        this.currentUser = res.data.user;
        this.authModalOpen = false;
        await this.fetchUsers();
        return res.data;
      } catch (err) {
        if (err.response?.data?.requiresVerification) {
          this.unverifiedEmail = email;
          this.previewVerificationCode = err.response.data.verificationCode || '';
          this.authMode = 'verify';
        }
        const msg = extractErrorMessage(err);
        this.error = msg;
        throw new Error(msg);
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.currentUser = null;
      this.authModalOpen = true;
      this.authMode = 'login';
    }
  }
});
