<template>
  <div
    v-if="taskStore.createTaskModalOpen"
    class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
    @click.self="taskStore.createTaskModalOpen = false"
  >
    <div class="bg-white dark:bg-[#202225] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#2F3136] w-full max-w-xl overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 dark:border-[#2F3136] flex items-center justify-between bg-slate-50/50 dark:bg-[#18191B]/50">
        <div class="flex items-center space-x-2.5">
          <div class="w-7 h-7 rounded-lg theme-gradient-bg flex items-center justify-center text-white text-sm font-black shadow-md theme-shadow">
            +
          </div>
          <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">Create New Task</h3>
        </div>
        <button
          @click="taskStore.createTaskModalOpen = false"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- Title -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Task Title *</label>
          <input
            v-model="form.title"
            type="text"
            required
            placeholder="e.g. Design responsive UI components..."
            class="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-900 dark:text-white focus:outline-none theme-border"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Description</label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Add context, specifications, or acceptance criteria..."
            class="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-900 dark:text-white focus:outline-none theme-border"
          ></textarea>
        </div>

        <!-- Target Space & List -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Target List *</label>
            </div>

            <!-- List Dropdown (Grouped by Space) -->
            <select
              v-if="hasLists"
              v-model="form.list_id"
              required
              class="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none theme-border"
            >
              <option value="" disabled>Select target list</option>
              <optgroup
                v-for="space in taskStore.spaces"
                :key="space._id || space.id"
                :label="space.name"
              >
                <option
                  v-for="list in space.lists"
                  :key="list._id || list.id"
                  :value="list._id || list.id"
                >
                  📁 {{ space.name }} / {{ list.name }}
                </option>
              </optgroup>
            </select>

            <div
              v-else
              class="w-full py-2 px-3 border border-dashed border-slate-300 bg-slate-50 dark:bg-[#18191B] text-slate-500 text-xs font-semibold rounded-xl text-left"
            >
              Please create a Space & List first in the sidebar.
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Priority</label>
            <select
              v-model="form.priority"
              class="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="normal">🔵 Normal</option>
              <option value="low">⚪ Low</option>
            </select>
          </div>
        </div>

        <!-- Assign to Employee & Dates -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Assignee -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Assign Employee</label>
            <select
              v-model="selectedAssigneeId"
              class="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="">Unassigned</option>
              <option
                v-for="u in authStore.users"
                :key="u._id || u.id"
                :value="u._id || u.id"
              >
                {{ u.name }} ({{ u.role.replace('_', ' ') }})
              </option>
            </select>
          </div>

          <!-- Start Date -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
            <input
              type="date"
              v-model="form.start_date"
              class="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <!-- Due Date -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
            <input
              type="date"
              v-model="form.due_date"
              class="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-[#2F3136]">
          <span class="text-[11px] text-slate-400">⚡ Automatically sends HTML notification email to assignee</span>
          <div class="flex items-center space-x-2">
            <button
              type="button"
              @click="taskStore.createTaskModalOpen = false"
              class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!form.title.trim() || !form.list_id || isSubmitting"
              class="px-5 py-2 theme-gradient-bg disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md theme-shadow transition-all active:scale-95 hover:opacity-90"
            >
              {{ isSubmitting ? 'Creating...' : 'Create & Assign' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue';
import { X } from 'lucide-vue-next';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

const taskStore = useTaskStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const selectedAssigneeId = ref('');
const isSubmitting = ref(false);

const form = reactive({
  title: '',
  description: '',
  list_id: '',
  priority: 'normal',
  status: 'pending',
  start_date: '',
  due_date: ''
});

const hasLists = computed(() => {
  return taskStore.spaces && taskStore.spaces.some(s => s.lists && s.lists.length > 0);
});

// Auto-select active list if one is currently selected in sidebar
watch(() => taskStore.createTaskModalOpen, (isOpen) => {
  if (isOpen) {
    isSubmitting.value = false;
    if (taskStore.selectedListId) {
      form.list_id = taskStore.selectedListId;
    } else {
      // Find first available list across all spaces
      for (const space of taskStore.spaces) {
        if (space.lists && space.lists.length > 0) {
          form.list_id = space.lists[0]._id || space.lists[0].id;
          break;
        }
      }
    }
  }
});

async function handleSubmit() {
  if (!form.title.trim() || !form.list_id || isSubmitting.value) return;

  isSubmitting.value = true;
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      list_id: form.list_id,
      priority: form.priority,
      status: form.status,
      startDate: form.start_date || null,
      dueDate: form.due_date || null,
      assignees: selectedAssigneeId.value ? [selectedAssigneeId.value] : []
    };

    await taskStore.createTask(payload);
    uiStore.success(`Task "${form.title.trim()}" created successfully!`);

    // Reset Form
    form.title = '';
    form.description = '';
    selectedAssigneeId.value = '';
    form.start_date = '';
    form.due_date = '';

    // Immediately close modal
    taskStore.createTaskModalOpen = false;
  } catch (err) {
    uiStore.error('Failed to create task: ' + err.message);
  } finally {
    isSubmitting.value = false;
  }
}
</script>