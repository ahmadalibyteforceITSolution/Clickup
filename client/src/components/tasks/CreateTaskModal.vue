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
          <div class="w-7 h-7 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-md shadow-purple-500/20">
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
            class="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Description</label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Add context, specifications, or acceptance criteria..."
            class="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
          ></textarea>
        </div>

        <!-- Target Space & List -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Target List *</label>
              <button
                type="button"
                @click="promptQuickCreateList"
                class="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
              >
                + New List
              </button>
            </div>

            <!-- List Dropdown (Grouped by Space) -->
            <select
              v-if="hasLists"
              v-model="form.list_id"
              required
              class="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <optgroup
                v-for="space in taskStore.spaces"
                :key="space._id || space.id"
                :label="'📁 ' + space.name"
              >
                <option
                  v-for="l in space.lists"
                  :key="l._id || l.id"
                  :value="l._id || l.id"
                >
                  {{ l.name }}
                </option>
              </optgroup>
            </select>

            <!-- Fallback button when no space or list exists yet -->
            <button
              v-else
              type="button"
              @click="promptQuickCreateList"
              class="w-full py-2 px-3 border border-dashed border-purple-400 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-xl text-left flex items-center justify-between"
            >
              <span>+ Create First Space & List</span>
              <span class="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded">Setup</span>
            </button>
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
              :disabled="!form.title.trim() || !form.list_id"
              class="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/20 transition-all active:scale-95"
            >
              Create & Assign
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

const taskStore = useTaskStore();
const authStore = useAuthStore();

const selectedAssigneeId = ref('');

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
  return taskStore.allLists && taskStore.allLists.length > 0;
});

// Auto-select active or first available list when modal opens
watch(() => taskStore.createTaskModalOpen, (open) => {
  if (open) {
    if (taskStore.selectedListId) {
      form.list_id = taskStore.selectedListId;
    } else if (taskStore.allLists.length > 0) {
      form.list_id = taskStore.allLists[0]._id || taskStore.allLists[0].id;
    }
  }
});

async function promptQuickCreateList() {
  let spaceId = taskStore.selectedSpaceId;
  if (!spaceId && taskStore.spaces.length > 0) {
    spaceId = taskStore.spaces[0]._id || taskStore.spaces[0].id;
  }

  if (!spaceId) {
    // Create first space first
    const spaceName = prompt('Enter New Space Name (e.g. General, Engineering):');
    if (!spaceName || !spaceName.trim()) return;
    const newSpace = await taskStore.createSpace({
      name: spaceName.trim(),
      created_by: authStore.currentUser?._id || authStore.currentUser?.id
    });
    spaceId = newSpace._id || newSpace.id;
  }

  const listName = prompt('Enter New List Name (e.g. Tasks, Backlog, Sprint 1):');
  if (!listName || !listName.trim()) return;

  const newList = await taskStore.createList(spaceId, { name: listName.trim() });
  form.list_id = newList._id || newList.id;
}

async function handleSubmit() {
  if (!form.title.trim() || !form.list_id) return;

  const payload = {
    title: form.title.trim(),
    description: form.description,
    list_id: form.list_id,
    priority: form.priority,
    status: form.status,
    start_date: form.start_date || null,
    due_date: form.due_date || null,
    creator_id: authStore.currentUser?._id || authStore.currentUser?.id,
    assignee_ids: selectedAssigneeId.value ? [selectedAssigneeId.value] : []
  };

  try {
    const created = await taskStore.createTask(payload);
    taskStore.createTaskModalOpen = false;
    form.title = '';
    form.description = '';
    selectedAssigneeId.value = '';
    taskStore.openTaskModal(created._id || created.id || created);
  } catch (err) {
    alert('Failed to create task: ' + err.message);
  }
}
</script>
