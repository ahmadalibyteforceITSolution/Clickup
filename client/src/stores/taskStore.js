import { defineStore } from 'pinia';
import axios from 'axios';

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    spaces: [],
    tasks: [],
    selectedSpaceId: null,
    selectedListId: null,
    selectedTask: null,
    activeView: 'list', // 'list' | 'board' | 'calendar' | 'gantt' | 'dashboard'
    
    // Filters & Search
    searchQuery: '',
    statusFilter: null,
    priorityFilter: null,
    assigneeFilter: null,
    showOverdueOnly: false,

    // UI state
    taskModalOpen: false,
    createTaskModalOpen: false,
    emailOutboxModalOpen: false,
    settingsModalOpen: false,
    sidebarCollapsed: false,
    sidebarMobileOpen: false,

    // Analytics
    analytics: null,
    loading: false,
    error: null
  }),

  getters: {
    filteredTasks: (state) => {
      const taskList = Array.isArray(state.tasks) ? state.tasks : [];
      return taskList.filter(task => {
        if (state.selectedSpaceId && task.space_id?._id !== state.selectedSpaceId && task.space_id !== state.selectedSpaceId) {
          return false;
        }
        if (state.selectedListId && task.list_id?._id !== state.selectedListId && task.list_id !== state.selectedListId) {
          return false;
        }
        if (state.statusFilter && task.status !== state.statusFilter) {
          return false;
        }
        if (state.priorityFilter && task.priority !== state.priorityFilter) {
          return false;
        }
        if (state.assigneeFilter) {
          const hasAssignee = task.assignees?.some(a => (a._id || a.id || a) === state.assigneeFilter);
          if (!hasAssignee) return false;
        }
        if (state.showOverdueOnly) {
          if (!task.dueDate || task.status === 'completed') return false;
          const today = new Date().toISOString().split('T')[0];
          if (task.dueDate >= today) return false;
        }
        if (state.searchQuery && state.searchQuery.trim()) {
          const query = state.searchQuery.toLowerCase();
          const titleMatch = (task.title || '').toLowerCase().includes(query);
          const descMatch = (task.description || '').toLowerCase().includes(query);
          if (!titleMatch && !descMatch) return false;
        }
        return true;
      });
    },

    tasksByStatus: (state) => {
      const groups = {
        pending: [],
        in_progress: [],
        review: [],
        completed: []
      };
      state.filteredTasks.forEach(task => {
        const s = task.status || 'pending';
        if (groups[s]) {
          groups[s].push(task);
        } else {
          groups.pending.push(task);
        }
      });
      return groups;
    },

    tasksByPriority: (state) => {
      const groups = {
        urgent: [],
        high: [],
        normal: [],
        low: []
      };
      state.filteredTasks.forEach(task => {
        const p = task.priority || 'normal';
        if (groups[p]) {
          groups[p].push(task);
        } else {
          groups.normal.push(task);
        }
      });
      return groups;
    },

    activeSpace: (state) => {
      if (!state.selectedSpaceId) return null;
      const spaceList = Array.isArray(state.spaces) ? state.spaces : [];
      return spaceList.find(s => (s._id || s.id) === state.selectedSpaceId);
    },

    activeList: (state) => {
      if (!state.selectedListId || !state.activeSpace) return null;
      return state.activeSpace.lists?.find(l => (l._id || l.id) === state.selectedListId);
    }
  },

  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

    toggleMobileSidebar() {
      this.sidebarMobileOpen = !this.sidebarMobileOpen;
    },

    async fetchSpaces() {
      try {
        const res = await axios.get('/api/spaces');
        this.spaces = Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        this.spaces = [];
        this.error = err.message;
      }
    },

    async fetchTasks() {
      this.loading = true;
      try {
        const params = {};
        if (this.selectedSpaceId) params.space_id = this.selectedSpaceId;
        if (this.selectedListId) params.list_id = this.selectedListId;
        if (this.statusFilter) params.status = this.statusFilter;
        if (this.priorityFilter) params.priority = this.priorityFilter;
        if (this.assigneeFilter) params.assignee = this.assigneeFilter;
        if (this.searchQuery) params.search = this.searchQuery;
        if (this.showOverdueOnly) params.overdue = 'true';

        const res = await axios.get('/api/tasks', { params });
        this.tasks = Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        this.tasks = [];
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async openTaskModal(taskId) {
      try {
        const res = await axios.get(`/api/tasks/${taskId}`);
        this.selectedTask = res.data;
        this.taskModalOpen = true;
      } catch (err) {
        this.error = err.message;
      }
    },

    async createTask(taskData) {
      try {
        const res = await axios.post('/api/tasks', taskData);
        await this.fetchTasks();
        await this.fetchSpaces();
        return res.data;
      } catch (err) {
        throw new Error(err.response?.data?.error || err.message);
      }
    },

    async updateTask(taskId, updates) {
      try {
        const res = await axios.put(`/api/tasks/${taskId}`, updates);
        if (this.selectedTask && (this.selectedTask._id === taskId || this.selectedTask.id === taskId)) {
          this.selectedTask = res.data;
        }
        await this.fetchTasks();
        return res.data;
      } catch (err) {
        throw new Error(err.response?.data?.error || err.message);
      }
    },

    async deleteTask(taskId) {
      try {
        await axios.delete(`/api/tasks/${taskId}`);
        this.taskModalOpen = false;
        this.selectedTask = null;
        await this.fetchTasks();
        await this.fetchSpaces();
      } catch (err) {
        throw new Error(err.response?.data?.error || err.message);
      }
    },

    async createSpace(spaceData) {
      try {
        const res = await axios.post('/api/spaces', spaceData);
        await this.fetchSpaces();
        this.selectedSpaceId = res.data._id || res.data.id;
        await this.fetchTasks();
        return res.data;
      } catch (err) {
        throw new Error(err.response?.data?.error || err.message);
      }
    },

    async createList(spaceId, listData) {
      try {
        const res = await axios.post(`/api/spaces/${spaceId}/lists`, listData);
        await this.fetchSpaces();
        this.selectedListId = res.data._id || res.data.id;
        await this.fetchTasks();
        return res.data;
      } catch (err) {
        throw new Error(err.response?.data?.error || err.message);
      }
    },

    async addComment(taskId, commentData) {
      try {
        const res = await axios.post(`/api/comments/tasks/${taskId}`, commentData);
        if (this.selectedTask && (this.selectedTask._id === taskId || this.selectedTask.id === taskId)) {
          if (!this.selectedTask.comments) this.selectedTask.comments = [];
          this.selectedTask.comments.push(res.data);
        }
        return res.data;
      } catch (err) {
        throw new Error(err.response?.data?.error || err.message);
      }
    },

    async fetchAnalytics() {
      try {
        const res = await axios.get('/api/analytics');
        this.analytics = res.data;
      } catch (err) {
        this.error = err.message;
      }
    }
  }
});
