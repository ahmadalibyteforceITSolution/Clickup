import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
  state: () => ({
    activeRequests: 0,
    toasts: [],
    themeColor: localStorage.getItem('clickup_theme_color') || '#7C3AED',
    isDarkMode: localStorage.getItem('clickup_theme_mode') === 'dark' || document.documentElement.classList.contains('dark'),
    confirmModal: {
      isOpen: false,
      title: 'Confirm Action',
      message: 'Are you sure you want to proceed?',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      isDanger: true,
      resolve: null
    }
  }),

  getters: {
    isLoading: (state) => state.activeRequests > 0
  },

  actions: {
    startLoading() {
      this.activeRequests++;
    },

    stopLoading() {
      if (this.activeRequests > 0) {
        this.activeRequests--;
      }
    },

    // Apply workspace accent theme color across the entire application
    setThemeColor(hex) {
      if (!hex) return;
      this.themeColor = hex;
      localStorage.setItem('clickup_theme_color', hex);

      // Generate complementary secondary & light tint
      const primary = hex;
      const light = hex + '26'; // 15% opacity hex
      const border = hex + '4D'; // 30% opacity hex
      
      const root = document.documentElement;
      root.style.setProperty('--theme-primary', primary);
      root.style.setProperty('--theme-secondary', primary);
      root.style.setProperty('--theme-light', light);
      root.style.setProperty('--theme-border', border);
      root.style.setProperty('--theme-gradient', `linear-gradient(135deg, ${primary}, ${primary}dd)`);
    },

    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('clickup_theme_mode', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('clickup_theme_mode', 'light');
      }
      // Re-apply theme color so it shines in both modes
      this.setThemeColor(this.themeColor);
    },

    initTheme() {
      const savedMode = localStorage.getItem('clickup_theme_mode');
      if (savedMode === 'dark' || (!savedMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        this.isDarkMode = true;
      } else {
        document.documentElement.classList.remove('dark');
        this.isDarkMode = false;
      }
      this.setThemeColor(this.themeColor);
    },

    showToast({ type = 'info', title = '', message = '', duration = 4000 }) {
      const id = Date.now() + Math.random().toString(36).substring(2, 7);
      const toast = { id, type, title, message, duration };
      this.toasts.push(toast);

      if (duration > 0) {
        setTimeout(() => {
          this.removeToast(id);
        }, duration);
      }
      return id;
    },

    success(message, title = 'Success') {
      return this.showToast({ type: 'success', title, message });
    },

    error(message, title = 'Error') {
      const msg = typeof message === 'string' ? message : (message?.message || 'An unexpected error occurred');
      return this.showToast({ type: 'error', title, message: msg, duration: 6000 });
    },

    info(message, title = 'Information') {
      return this.showToast({ type: 'info', title, message });
    },

    warning(message, title = 'Warning') {
      return this.showToast({ type: 'warning', title, message });
    },

    removeToast(id) {
      this.toasts = this.toasts.filter(t => t.id !== id);
    },

    // Custom In-App Confirmation Modal (Replaces browser confirm())
    confirm({
      title = 'Confirm Action',
      message = 'Are you sure you want to proceed?',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      isDanger = true
    } = {}) {
      return new Promise((resolve) => {
        this.confirmModal = {
          isOpen: true,
          title,
          message,
          confirmText,
          cancelText,
          isDanger,
          resolve
        };
      });
    },

    handleConfirmModalResult(result) {
      if (this.confirmModal.resolve) {
        this.confirmModal.resolve(result);
      }
      this.confirmModal.isOpen = false;
    }
  }
});
