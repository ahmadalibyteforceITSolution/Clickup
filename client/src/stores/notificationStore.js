import { defineStore } from 'pinia';
import axios from 'axios';

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    emailLogs: [],
    loadingEmails: false,
    selectedEmailLog: null,
    smtpSettings: {}
  }),

  actions: {
    async fetchNotifications(userId) {
      if (!userId) return;
      try {
        const res = await axios.get(`/api/analytics/notifications/${userId}`);
        this.notifications = res.data.notifications;
        this.unreadCount = res.data.unreadCount;
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    },

    async markAllRead(userId) {
      if (!userId) return;
      try {
        await axios.post(`/api/analytics/notifications/${userId}/read-all`);
        this.unreadCount = 0;
        this.notifications.forEach(n => { n.is_read = 1; });
      } catch (err) {
        console.error('Failed to mark notifications read:', err);
      }
    },

    async fetchEmailLogs(triggerType = null) {
      this.loadingEmails = true;
      try {
        const params = triggerType ? { trigger_type: triggerType } : {};
        const res = await axios.get('/api/emails/logs', { params });
        this.emailLogs = res.data;
      } catch (err) {
        console.error('Failed to fetch email logs:', err);
      } finally {
        this.loadingEmails = false;
      }
    },

    async fetchEmailLogDetails(id) {
      try {
        const res = await axios.get(`/api/emails/logs/${id}`);
        this.selectedEmailLog = res.data;
        return res.data;
      } catch (err) {
        console.error('Failed to fetch email log details:', err);
      }
    },

    async sendTestEmail(payload) {
      try {
        const res = await axios.post('/api/emails/test', payload);
        await this.fetchEmailLogs();
        return res.data;
      } catch (err) {
        throw new Error(err.response?.data?.error || err.message);
      }
    },

    async fetchSmtpSettings() {
      try {
        const res = await axios.get('/api/emails/settings');
        this.smtpSettings = res.data;
      } catch (err) {
        console.error('Failed to fetch SMTP settings:', err);
      }
    },

    async saveSmtpSettings(settings) {
      try {
        const res = await axios.post('/api/emails/settings', settings);
        this.smtpSettings = { ...this.smtpSettings, ...settings };
        return res.data;
      } catch (err) {
        throw new Error(err.response?.data?.error || err.message);
      }
    }
  }
});
