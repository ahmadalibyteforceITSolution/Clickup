import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: null,
    users: [],
    loading: false,
    error: null
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
        this.users = res.data;

        // Default to first Manager or Super Admin if not selected yet
        if (!this.currentUser && this.users.length > 0) {
          this.currentUser = this.users[0];
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    switchUser(user) {
      this.currentUser = user;
    },

    async createUser(userData) {
      try {
        const res = await axios.post('/api/users', userData);
        this.users.push(res.data);
        return res.data;
      } catch (err) {
        throw new Error(err.response?.data?.error || err.message);
      }
    }
  }
});
