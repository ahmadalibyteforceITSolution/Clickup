import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
  state: () => ({
    activeRequests: 0,
    toasts: [],
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
