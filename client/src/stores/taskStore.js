import { defineStore } from 'pinia';
import axios from 'axios';

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    spaces: [],
    tasks: [],
    selectedSpaceId: null,
    selectedListId: null,
    activeView: 'list', // 'list' | 'board' | 'calendar' | 'gantt' | 'dashboard'
    searchQuery: '',
    statusFilter: null,
    priorityFilter: null,
    assigneeFilter: null,
    showOverdueOnly: false,
    selectedTaskId: null,
    activeTask: null,
    loading: false,
    taskModalOpen: false,
    createTaskModalOpen: false,
    emailOutboxModalOpen: false,
    settingsModalOpen: false,
    analyticsData: null
  }),

  getters: {
    selectedSpace: (state) => {
      if (!state.selectedSpaceId) return null;
      return state.spaces.find(s => (s._id || s.id) === state.selectedSpaceId) || null;
    },

    allLists: (state) => {
      const lists = [];
      state.spaces.forEach(s => {
        if (s.lists) lists.push(...s.lists);
        if (s.folders) {
          s.folders.forEach(f => {
            if (f.lists) lists.push(...f.lists);
          });
        }
      });
      return lists;
    },

    filteredTasks: (state) => {
      return state.tasks.filter(t => {
        // Space filter
        if (state.selectedSpaceId) {
          const taskSpaceId = t.spaceId?._id || t.spaceId || t.list?.spaceId?._id || t.list?.spaceId;
          if (taskSpaceId && String(taskSpaceId) !== String(state.selectedSpaceId)) {
            return false;
          }
        }

        // List filter
        if (state.selectedListId) {
          const taskListId = t.listId?._id || t.listId || t.list?._id || t.list?.id;
          if (taskListId && String(taskListId) !== String(state.selectedListId)) {
            return false;
          }
        }

        // Status filter
        if (state.statusFilter && t.status !== state.statusFilter) {
          return false;
        }

        // Priority filter
        if (state.priorityFilter && t.priority !== state.priorityFilter) {
          return false;
        }

        // Assignee filter
        if (state.assigneeFilter) {
          const hasAssignee = (t.assignees || []).some(a => String(a._id || a.id) === String(state.assigneeFilter));
          if (!hasAssignee) return false;
        }

        // Overdue filter
        if (state.showOverdueOnly) {
          const today = new Date().toISOString().split('T')[0];
          if (t.status === 'completed' || !t.dueDate || t.dueDate >= today) {
            return false;
          }
        }

        // Search query
        if (state.searchQuery) {
          const q = state.searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = (t.description || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc) return false;
        }

        return true;
      });
    },

    tasksByStatus: (state) => {
      const filtered = state.tasks;
      return {
        pending: filtered.filter(t => t.status === 'pending'),
        in_progress: filtered.filter(t => t.status === 'in_progress'),
        review: filtered.filter(t => t.status === 'review'),
        completed: filtered.filter(t => t.status === 'completed')
      };
    }
  },

  actions: {
    async fetchSpaces() {
      try {
        const res = await axios.get('/api/spaces');
        this.spaces = res.data;
      } catch (err) {
        console.error('Failed to fetch spaces:', err);
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
        if (this.assigneeFilter) params.assignee_id = this.assigneeFilter;
        if (this.searchQuery) params.search = this.searchQuery;
        if (this.showOverdueOnly) params.overdue = 'true';

        const res = await axios.get('/api/tasks', { params });
        this.tasks = res.data;
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        this.loading = false;
      }
    },

    async fetchTaskDetails(id) {
      try {
        const res = await axios.get(`/api/tasks/${id}`);
        this.activeTask = res.data;
        this.selectedTaskId = id;
      } catch (err) {
        console.error('Failed to fetch task details:', err);
      }
    },

    openTaskModal(taskOrId) {
      const id = typeof taskOrId === 'object' ? (taskOrId._id || taskOrId.id) : taskOrId;
      this.fetchTaskDetails(id);
      this.taskModalOpen = true;
    },

    closeTaskModal() {
      this.taskModalOpen = false;
      this.activeTask = null;
      this.selectedTaskId = null;
    },

    async createTask(payload) {
      try {
        const res = await axios.post('/api/tasks', payload);
        this.tasks.unshift(res.data);
        await this.fetchSpaces(); // update count
        return res.data;
      } catch (err) {
        throw new Error(err.response?.data?.error || err.message);
      }
    },

    async updateTask(id, updates) {
      try {
        const res = await axios.put(`/api/tasks/${id}`, updates);
        const idx = this.tasks.findIndex(t => (t._id || t.id) === id);
        if (idx !== -1) {
          this.tasks[idx] = res.data;
        }
        if (this.activeTask && (this.activeTask._id || this.activeTask.id) === id) {
          this.activeTask = res.data;
        }
        return res.data;
      } catch (err) {
        throw new Error(err.response?.data?.error || err.message);
      }
    },

    async deleteTask(id) {
      try {
        await axios.delete(`/api/tasks/${id}`);
        this.tasks = this.tasks.filter(t => (t._id || t.id) !== id);
        if (this.selectedTaskId === id) {
          this.closeTaskModal();
        }
        await this.fetchSpaces();
      } catch (err) {
        throw new Error(err.response?.data?.error || err.message);
      }
    },

    async createSpace(payload) {
      try {
        const res = await axios.post('/api/spaces', payload);
        this.spaces.push(res.data);
        return res.data;
      } catch (err) {
        throw new Error(err.response?.data?.error || err.message);
      }
    },

    async createList(spaceId, payload) {
      try {
        const res = await axios.post(`/api/spaces/${spaceId}/lists`, payload);
        await this.fetchSpaces();
        return res.data;
      } catch (err) {
        throw new Error(err.response?.data?.error || err.message);
      }
    },

    async fetchAnalytics() {
      try {
        const res = await axios.get('/api/analytics/dashboard');
        this.analyticsData = res.data;
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      }
    }
  }
});
