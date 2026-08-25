<template>
  <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
    <!-- Workspace Brand Header -->
    <div class="h-14 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/40">
      <div class="flex items-center space-x-2.5">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
          <Layers class="w-5 h-5" />
        </div>
        <div>
          <span class="font-extrabold text-base tracking-tight text-white">Click<span class="text-purple-400">Up</span></span>
          <span class="ml-1.5 text-[9px] bg-purple-900/60 text-purple-300 font-bold px-1.5 py-0.5 rounded uppercase">Workspace</span>
        </div>
      </div>

      <button
        @click="taskStore.settingsModalOpen = true"
        class="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
        title="Settings"
      >
        <Sliders class="w-4 h-4" />
      </button>
    </div>

    <!-- Navigation Scrollable Body -->
    <div class="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      <!-- Views Section -->
      <div>
        <div class="px-2 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Views
        </div>
        <div class="space-y-1">
          <button
            v-for="v in viewOptions"
            :key="v.id"
            @click="switchView(v.id)"
            :class="[
              'w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all',
              taskStore.activeView === v.id
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            ]"
          >
            <component :is="v.icon" class="w-4 h-4" />
            <span>{{ v.label }}</span>
          </button>
        </div>
      </div>

      <!-- Spaces & Lists Section -->
      <div>
        <div class="px-2 mb-2 flex items-center justify-between">
          <span class="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Spaces</span>
          <button
            @click="openCreateSpaceModal"
            class="text-slate-400 hover:text-purple-400 p-0.5 rounded transition-colors"
            title="Create Space"
          >
            <Plus class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- All Spaces Filter Option -->
        <button
          @click="selectSpace(null)"
          :class="[
            'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors mb-1',
            !taskStore.selectedSpaceId
              ? 'bg-slate-800 text-white font-bold'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          ]"
        >
          <div class="flex items-center space-x-2">
            <LayoutGrid class="w-3.5 h-3.5 text-purple-400" />
            <span>All Spaces</span>
          </div>
          <span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded-full">
            {{ taskStore.tasks.length }}
          </span>
        </button>

        <!-- Space Accordions -->
        <div class="space-y-1 mt-1">
          <div
            v-for="space in taskStore.spaces"
            :key="space._id || space.id"
            class="rounded-lg overflow-hidden"
          >
            <div
              @click="selectSpace(space._id || space.id)"
              :class="[
                'flex items-center justify-between px-2.5 py-1.5 cursor-pointer rounded-md text-xs font-semibold transition-colors group',
                taskStore.selectedSpaceId === (space._id || space.id)
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              ]"
            >
              <div class="flex items-center space-x-2 truncate">
                <span
                  class="w-2.5 h-2.5 rounded-full shrink-0"
                  :style="{ backgroundColor: space.color || '#7b68ee' }"
                ></span>
                <span class="truncate">{{ space.name }}</span>
              </div>

              <div class="flex items-center space-x-1 shrink-0">
                <button
                  @click.stop="openCreateListModal(space._id || space.id, space.name)"
                  class="opacity-0 group-hover:opacity-100 hover:text-purple-400 p-0.5"
                  title="Add List"
                >
                  <Plus class="w-3 h-3" />
                </button>
              </div>
            </div>

            <!-- Nested Lists -->
            <div
              v-if="space.lists && space.lists.length > 0"
              class="pl-5 pr-1 py-1 space-y-0.5"
            >
              <button
                v-for="list in space.lists"
                :key="list._id || list.id"
                @click="selectList(space._id || space.id, list._id || list.id)"
                :class="[
                  'w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium transition-colors',
                  taskStore.selectedListId === (list._id || list.id)
                    ? 'bg-purple-900/40 text-purple-300 font-bold border-l-2 border-purple-400 pl-1.5'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                ]"
              >
                <div class="flex items-center space-x-1.5 truncate">
                  <List class="w-3 h-3 text-slate-500" />
                  <span class="truncate">{{ list.name }}</span>
                </div>
                <span v-if="list.task_count > 0" class="text-[9px] bg-slate-800 text-slate-400 px-1 rounded-full">
                  {{ list.task_count }}
                </span>
              </button>
            </div>
          </div>

          <!-- Empty Spaces State -->
          <div v-if="taskStore.spaces.length === 0" class="p-2 text-center">
            <button
              @click="openCreateSpaceModal"
              class="w-full py-2.5 px-3 border border-dashed border-slate-700 hover:border-purple-500 rounded-xl text-xs font-bold text-purple-400 hover:text-purple-300 hover:bg-purple-950/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <Plus class="w-4 h-4" />
              <span>+ Create First Space</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Employee Workload Filter -->
      <div v-if="authStore.users.length > 0">
        <div class="px-2 mb-2 flex items-center justify-between">
          <span class="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Team Members</span>
          <span class="text-[10px] text-slate-500">{{ authStore.users.length }}</span>
        </div>

        <div class="space-y-1">
          <button
            @click="filterByAssignee(null)"
            :class="[
              'w-full flex items-center space-x-2 px-2 py-1 rounded text-xs transition-colors',
              !taskStore.assigneeFilter ? 'text-white font-bold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            <Users class="w-3.5 h-3.5 text-purple-400" />
            <span>All Members</span>
          </button>

          <button
            v-for="u in authStore.users"
            :key="u._id || u.id"
            @click="filterByAssignee(u._id || u.id)"
            :class="[
              'w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors',
              taskStore.assigneeFilter === (u._id || u.id)
                ? 'bg-purple-900/40 text-purple-300 font-bold border-l-2 border-purple-400 pl-1.5'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            ]"
          >
            <div class="flex items-center space-x-2 truncate">
              <img :src="u.avatar" class="w-4 h-4 rounded-full object-cover shrink-0" />
              <span class="truncate">{{ u.name }}</span>
            </div>
            <span class="text-[9px] text-slate-500 uppercase">{{ u.role === 'super_admin' ? 'Admin' : u.role }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- User Profile Footer -->
    <div class="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
      <div v-if="authStore.currentUser" class="flex items-center space-x-2.5 min-w-0">
        <img
          :src="authStore.currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'"
          class="w-7 h-7 rounded-full object-cover ring-2 ring-purple-500/40 shrink-0"
        />
        <div class="min-w-0">
          <p class="text-xs font-bold text-white truncate leading-tight">{{ authStore.currentUser?.name }}</p>
          <p class="text-[10px] text-slate-400 truncate">{{ authStore.currentUser?.email }}</p>
        </div>
      </div>
      <button
        v-else
        @click="authStore.authModalOpen = true; authStore.authMode = 'login'"
        class="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors"
      >
        Sign In / Register
      </button>
    </div>

    <!-- CUSTOM CREATE SPACE MODAL (Replaces browser window.prompt) -->
    <div
      v-if="createSpaceModalOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
      @click.self="createSpaceModalOpen = false"
    >
      <div class="bg-white dark:bg-[#202225] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2F3136] w-full max-w-sm p-5 space-y-4 text-slate-900 dark:text-white">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-extrabold flex items-center space-x-2">
            <span class="w-3 h-3 rounded-full bg-purple-500"></span>
            <span>Create New Space</span>
          </h3>
          <button @click="createSpaceModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Space Name *</label>
          <input
            v-model="newSpaceName"
            type="text"
            required
            placeholder="e.g. Marketing, Engineering..."
            class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
            @keyup.enter="handleCreateSpace"
          />
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Space Theme Color</label>
          <div class="flex items-center space-x-2">
            <button
              v-for="color in ['#7B68EE', '#FF007F', '#00C875', '#1E75FF', '#FF7F00', '#F83232']"
              :key="color"
              type="button"
              @click="selectedSpaceColor = color"
              class="w-6 h-6 rounded-full transition-transform"
              :style="{ backgroundColor: color }"
              :class="{ 'ring-2 ring-offset-2 ring-purple-500 scale-110': selectedSpaceColor === color }"
            ></button>
          </div>
        </div>

        <div class="flex items-center justify-end space-x-2 pt-2">
          <button
            @click="createSpaceModalOpen = false"
            class="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold"
          >
            Cancel
          </button>
          <button
            @click="handleCreateSpace"
            :disabled="!newSpaceName.trim()"
            class="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Create Space
          </button>
        </div>
      </div>
    </div>

    <!-- CUSTOM CREATE LIST MODAL (Replaces browser window.prompt) -->
    <div
      v-if="createListModalOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
      @click.self="createListModalOpen = false"
    >
      <div class="bg-white dark:bg-[#202225] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2F3136] w-full max-w-sm p-5 space-y-4 text-slate-900 dark:text-white">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-extrabold flex items-center space-x-2">
            <List class="w-4 h-4 text-purple-500" />
            <span>Add List in {{ targetSpaceName }}</span>
          </h3>
          <button @click="createListModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">List Name *</label>
          <input
            v-model="newListName"
            type="text"
            required
            placeholder="e.g. Sprint 1, Backlog, Ideas..."
            class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
            @keyup.enter="handleCreateList"
          />
        </div>

        <div class="flex items-center justify-end space-x-2 pt-2">
          <button
            @click="createListModalOpen = false"
            class="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold"
          >
            Cancel
          </button>
          <button
            @click="handleCreateList"
            :disabled="!newListName.trim()"
            class="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Add List
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue';
import { 
  Layers, Sliders, LayoutGrid, List, Kanban, Calendar, GanttChartSquare, BarChart3, Plus, Users, X 
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';

const authStore = useAuthStore();
const taskStore = useTaskStore();

const viewOptions = [
  { id: 'list', label: 'List View', icon: List },
  { id: 'board', label: 'Kanban Board', icon: Kanban },
  { id: 'calendar', label: 'Calendar Schedule', icon: Calendar },
  { id: 'gantt', label: 'Gantt Timeline', icon: GanttChartSquare },
  { id: 'dashboard', label: 'Dashboard & Metrics', icon: BarChart3 }
];

// Custom Modals State
const createSpaceModalOpen = ref(false);
const newSpaceName = ref('');
const selectedSpaceColor = ref('#7B68EE');

const createListModalOpen = ref(false);
const targetSpaceId = ref(null);
const targetSpaceName = ref('');
const newListName = ref('');

function switchView(viewId) {
  taskStore.activeView = viewId;
  if (viewId === 'dashboard') {
    taskStore.fetchAnalytics();
  }
}

function selectSpace(spaceId) {
  taskStore.selectedSpaceId = spaceId;
  taskStore.selectedListId = null;
  taskStore.fetchTasks();
}

function selectList(spaceId, listId) {
  taskStore.selectedSpaceId = spaceId;
  taskStore.selectedListId = listId;
  taskStore.fetchTasks();
}

function filterByAssignee(userId) {
  taskStore.assigneeFilter = userId;
  taskStore.fetchTasks();
}

function openCreateSpaceModal() {
  newSpaceName.value = '';
  selectedSpaceColor.value = '#7B68EE';
  createSpaceModalOpen.value = true;
}

async function handleCreateSpace() {
  if (!newSpaceName.value.trim()) return;
  try {
    await taskStore.createSpace({
      name: newSpaceName.value.trim(),
      color: selectedSpaceColor.value,
      created_by: authStore.currentUser?._id || authStore.currentUser?.id
    });
    createSpaceModalOpen.value = false;
    newSpaceName.value = '';
  } catch (err) {
    alert('Error creating space: ' + err.message);
  }
}

function openCreateListModal(spaceId, spaceName) {
  targetSpaceId.value = spaceId;
  targetSpaceName.value = spaceName || 'Space';
  newListName.value = '';
  createListModalOpen.value = true;
}

async function handleCreateList() {
  if (!newListName.value.trim() || !targetSpaceId.value) return;
  try {
    await taskStore.createList(targetSpaceId.value, { name: newListName.value.trim() });
    createListModalOpen.value = false;
    newListName.value = '';
  } catch (err) {
    alert('Error creating list: ' + err.message);
  }
}
</script>
