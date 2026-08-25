import { defineStore } from 'pinia';
import axios from 'axios';
import { useAuthStore } from './authStore';

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
    activeTask: (state) => state.selectedTask,

    allLists: (state) => {
      const result = [];
      const spaceList = Array.isArray(state.spaces) ? state.spaces : [];
      spaceList.forEach(s => {
        if (s.lists && Array.isArray(s.lists)) {
          s.lists.forEach(l => {
            result.push({
              _id: l._id || l.id,
              id: l._id || l.id,
              name: l.name,
              space_id: s._id || s.id,
              spaceName: s.name,
              spaceColor: s.color || '#7b68ee'
            });
          });
        }
      });
      return result;
    },

    filteredTasks: (state) => {
      const taskList = Array.isArray(state.tasks) ? state.tasks : [];
      const seenIds = new Set();
      const uniqueTasks = [];

      taskList.forEach(task => {
        const id = String(task._id || task.id);
        if (!seenIds.has(id)) {
          seenIds.add(id);
          uniqueTasks.push(task);
        }
      });

      return uniqueTasks.filter(task => {
        const taskSpaceId = String(task.spaceId?._id || task.spaceId || task.space_id?._id || task.space_id || '');
        const taskListId = String(task.listId?._id || task.listId || task.list_id?._id || task.list_id || '');

        if (state.selectedSpaceId && taskSpaceId && taskSpaceId !== String(state.selectedSpaceId)) {
          return false;
        }
        if (state.selectedListId && taskListId && taskListId !== String(state.selectedListId)) {
          return false;
        }
        if (state.statusFilter && task.status !== state.statusFilter) {
          return false;
        }
        if (state.priorityFilter && task.priority !== state.priorityFilter) {
          return false;
        }
        if (state.assigneeFilter) {
          const hasAssignee = task.assignees?.some(a => String(a._id || a.id || a) === String(state.assigneeFilter));
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

    closeTaskModal() {
      this.taskModalOpen = false;
      this.selectedTask = null;
    },

    async fetchSpaces() {
      try {
        const authStore = useAuthStore();
        const params = {};
        if (authStore.currentUser) {
          params.user_role = authStore.currentUser.role;
          params.user_id = authStore.currentUser._id || authStore.currentUser.id;
        }
        const res = await axios.get('/api/spaces', { params });
        this.spaces = Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        this.spaces = [];
        this.error = err.message;
      }
    },

    async fetchTasks() {
      this.loading = true;
      try {
        const authStore = useAuthStore();
        const params = {};

        if (authStore.currentUser) {
          params.user_role = authStore.currentUser.role;
          params.user_id = authStore.currentUser._id || authStore.currentUser.id;
        }

        if (this.selectedSpaceId) params.space_id = this.selectedSpaceId;
        if (this.selectedListId) params.list_id = this.selectedListId;
        if (this.statusFilter) params.status = this.statusFilter;
        if (this.priorityFilter) params.priority = this.priorityFilter;
        if (this.assigneeFilter) params.assignee_id = this.assigneeFilter;
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

    async openTaskModal(taskOrId) {
      try {
        const taskId = typeof taskOrId === 'object' ? (taskOrId._id || taskOrId.id) : taskOrId;
        const res = await axios.get(`/api/tasks/${taskId}`);
        this.selectedTask = res.data;
        this.taskModalOpen = true;
      } catch (err) {
        this.error = err.message;
      }
    },

    async fetchTaskDetails(taskId) {
      try {
        const res = await axios.get(`/api/tasks/${taskId}`);
        this.selectedTask = res.data;
        return res.data;
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
        const authStore = useAuthStore();
        const params = {};
        if (authStore.currentUser) {
          params.user_role = authStore.currentUser.role;
          params.user_id = authStore.currentUser._id || authStore.currentUser.id;
        }
        const res = await axios.get('/api/analytics', { params });
        this.analytics = res.data;
      } catch (err) {
        this.error = err.message;
      }
    }
  }
});
