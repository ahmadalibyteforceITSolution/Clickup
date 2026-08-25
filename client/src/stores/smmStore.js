import { defineStore } from 'pinia';
import axios from 'axios';
import { useUiStore } from './uiStore';
import { useAuthStore } from './authStore';

export const useSmmStore = defineStore('smm', {
  state: () => ({
    campaigns: [],
    loading: false,
    selectedPlatform: 'all',
    selectedStatus: 'all',
    searchQuery: '',
    
    // Modal states
    createModalOpen: false,
    editModalOpen: false,
    uploadCsvModalOpen: false,
    selectedCampaign: null
  }),

  getters: {
    filteredCampaigns: (state) => {
      let list = [...state.campaigns];
      if (state.selectedPlatform && state.selectedPlatform !== 'all') {
        list = list.filter(c => c.platform === state.selectedPlatform);
      }
      if (state.selectedStatus && state.selectedStatus !== 'all') {
        list = list.filter(c => c.status === state.selectedStatus);
      }
      if (state.searchQuery && state.searchQuery.trim()) {
        const q = state.searchQuery.toLowerCase();
        list = list.filter(c => 
          (c.campaignName || '').toLowerCase().includes(q) ||
          (c.url || '').toLowerCase().includes(q) ||
          (c.targetAudience || '').toLowerCase().includes(q) ||
          (c.notes || '').toLowerCase().includes(q)
        );
      }
      return list;
    },

    totalBudget: (state) => {
      return state.campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    },

    totalClicks: (state) => {
      return state.campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
    },

    totalImpressions: (state) => {
      return state.campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
    }
  },

  actions: {
    async fetchCampaigns() {
      this.loading = true;
      const uiStore = useUiStore();
      try {
        const params = {};
        if (this.selectedPlatform !== 'all') params.platform = this.selectedPlatform;
        if (this.selectedStatus !== 'all') params.status = this.selectedStatus;
        if (this.searchQuery) params.search = this.searchQuery;

        const res = await axios.get('/api/campaigns', { params });
        this.campaigns = Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        uiStore.error('Failed to fetch campaigns: ' + err.message);
      } finally {
        this.loading = false;
      }
    },

    async createCampaign(campaignData) {
      const uiStore = useUiStore();
      const authStore = useAuthStore();
      try {
        const payload = {
          ...campaignData,
          created_by: authStore.currentUser?._id || authStore.currentUser?.id
        };
        const res = await axios.post('/api/campaigns', payload);
        this.campaigns.unshift(res.data);
        uiStore.success(`Campaign "${res.data.campaignName}" added to sheet`);
        this.createModalOpen = false;
        return res.data;
      } catch (err) {
        uiStore.error('Failed to create campaign: ' + (err.response?.data?.error || err.message));
        throw err;
      }
    },

    async updateCampaign(id, updates) {
      const uiStore = useUiStore();
      try {
        const res = await axios.put(`/api/campaigns/${id}`, updates);
        const idx = this.campaigns.findIndex(c => (c._id || c.id) === id);
        if (idx !== -1) {
          this.campaigns[idx] = res.data;
        }
        uiStore.success(`Campaign "${res.data.campaignName}" updated`);
        this.editModalOpen = false;
        this.selectedCampaign = null;
        return res.data;
      } catch (err) {
        uiStore.error('Failed to update campaign: ' + (err.response?.data?.error || err.message));
        throw err;
      }
    },

    async deleteCampaign(id) {
      const uiStore = useUiStore();
      try {
        await axios.delete(`/api/campaigns/${id}`);
        this.campaigns = this.campaigns.filter(c => (c._id || c.id) !== id);
        uiStore.success('Campaign link deleted from sheet');
      } catch (err) {
        uiStore.error('Failed to delete campaign: ' + (err.response?.data?.error || err.message));
        throw err;
      }
    },

    async importCsvFile(file) {
      const uiStore = useUiStore();
      const authStore = useAuthStore();
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', authStore.currentUser?._id || authStore.currentUser?.id || '');

        const res = await axios.post('/api/campaigns/import-csv', formData);
        uiStore.success(res.data.message || `Imported ${res.data.importedCount} campaign rows!`);
        this.uploadCsvModalOpen = false;
        await this.fetchCampaigns();
        return res.data;
      } catch (err) {
        uiStore.error('CSV Import Failed: ' + (err.response?.data?.error || err.message));
        throw err;
      }
    },

    exportCsvFile() {
      const uiStore = useUiStore();
      try {
        window.open('/api/campaigns/export-csv', '_blank');
        uiStore.success('Exporting SMM sheet to CSV...');
      } catch (err) {
        uiStore.error('Export failed: ' + err.message);
      }
    },

    downloadSampleTemplate() {
      const uiStore = useUiStore();
      try {
        window.open('/api/campaigns/sample-template', '_blank');
        uiStore.info('Downloading sample CSV template...');
      } catch (err) {
        uiStore.error('Download failed: ' + err.message);
      }
    }
  }
});
