import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: null,
    users: [],
    loading: false,
    error: null,
    
    // Auth Modal State
    authModalOpen: false,
    authMode: 'login', // 'login' | 'register' | 'verify'
    unverifiedEmail: '',
    previewVerificationCode: ''
  }),

  getters: {
    isAuthenticated: (state) => !!state.currentUser,
    isSuperAdmin: (state) => state.currentUser?.role === 'super_admin',
    isManager: (state) => state.currentUser?.role === 'manager' || state.currentUser?.role === 'super_admin',
    isEmployee: (state) => state.currentUser?.role === 'employee',
    roleLabel: (state) => {
      const role = state.currentUser?.role;
      if (role === 'super_admin') return 'Super Admin';
      if (role === 'manager') return 'Manager';
      if (role === 'employee') return 'Employee';
      return 'Guest';
    }
  },

  actions: {
    async fetchUsers() {
      try {
        const res = await axios.get('/api/users');
        this.users = Array.isArray(res.data) ? res.data : [];
        if (!this.currentUser && this.users.length > 0) {
          const admin = this.users.find(u => u.role === 'super_admin');
          this.currentUser = admin || this.users[0];
        }
      } catch (err) {
        this.users = [];
        this.error = typeof err.response?.data?.error === 'string' ? err.response.data.error : err.message;
      }
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
        const msg = typeof err.response?.data?.error === 'string' ? err.response.data.error : (err.message || 'Registration failed');
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
        this.unverifiedEmail = '';
        this.previewVerificationCode = '';
        await this.fetchUsers();
        return res.data;
      } catch (err) {
        const msg = typeof err.response?.data?.error === 'string' ? err.response.data.error : (err.message || 'Verification failed');
        this.error = msg;
        throw new Error(msg);
      } finally {
        this.loading = false;
      }
    },

    async resendVerificationCode(email) {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.post('/api/auth/resend-code', { email });
        this.previewVerificationCode = res.data.verificationCode || '';
        return res.data;
      } catch (err) {
        const msg = typeof err.response?.data?.error === 'string' ? err.response.data.error : (err.message || 'Failed to resend code');
        this.error = msg;
        throw new Error(msg);
      } finally {
        this.loading = false;
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
          this.unverifiedEmail = err.response.data.email || email;
          this.previewVerificationCode = err.response.data.verificationCode || '';
          this.authMode = 'verify';
          throw new Error('Please verify your email address to proceed.');
        }
        const msg = typeof err.response?.data?.error === 'string' ? err.response.data.error : (err.message || 'Invalid email or password');
        this.error = msg;
        throw new Error(msg);
      } finally {
        this.loading = false;
      }
    },

    async updateProfile(userId, profileData) {
      try {
        const res = await axios.put(`/api/users/${userId}`, profileData);
        if (this.currentUser && (this.currentUser.id === userId || this.currentUser._id === userId)) {
          this.currentUser = { ...this.currentUser, ...res.data };
        }
        await this.fetchUsers();
        return res.data;
      } catch (err) {
        const msg = typeof err.response?.data?.error === 'string' ? err.response.data.error : (err.message || 'Failed to update profile');
        throw new Error(msg);
      }
    },

    async deleteUser(userId) {
      try {
        await axios.delete(`/api/users/${userId}`);
        if (this.currentUser && (this.currentUser.id === userId || this.currentUser._id === userId)) {
          this.logout();
        } else {
          await this.fetchUsers();
        }
      } catch (err) {
        const msg = typeof err.response?.data?.error === 'string' ? err.response.data.error : (err.message || 'Failed to delete user');
        throw new Error(msg);
      }
    },

    logout() {
      this.currentUser = null;
      this.authModalOpen = true;
      this.authMode = 'login';
    }
  }
});
