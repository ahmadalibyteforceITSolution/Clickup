<template>
  <div class="h-full flex shrink-0">
    <!-- Mobile Backdrop Overlay -->
    <div
      v-if="taskStore.sidebarMobileOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
      @click="taskStore.sidebarMobileOpen = false"
    ></div>

    <!-- Sidebar Container -->
    <aside
      :class="[
        'bg-[#0f172a] dark:bg-[#111827] text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80 select-none transition-all duration-300 z-40 h-screen',
        'fixed md:static inset-y-0 left-0',
        taskStore.sidebarMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0',
        taskStore.sidebarCollapsed ? 'w-16' : 'w-72'
      ]"
    >
      <!-- Workspace Brand Header -->
      <div class="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 shrink-0">
        <div class="flex items-center space-x-3 overflow-hidden">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-500/25">
            <Layers class="w-5 h-5" />
          </div>
          <div v-if="!taskStore.sidebarCollapsed" class="truncate flex items-center space-x-1.5">
            <span class="font-black text-lg tracking-tight text-white">Click<span class="text-purple-400">Up</span></span>
            <span class="text-[10px] bg-purple-900/60 text-purple-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Workspace</span>
          </div>
        </div>

        <!-- Desktop Collapse / Expand Toggle Button -->
        <div class="flex items-center space-x-1">
          <button
            @click="taskStore.toggleSidebar"
            class="hidden md:flex text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors"
            :title="taskStore.sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
          >
            <ChevronLeft v-if="!taskStore.sidebarCollapsed" class="w-4 h-4" />
            <ChevronRight v-else class="w-4 h-4" />
          </button>

          <!-- Mobile Close Button -->
          <button
            @click="taskStore.sidebarMobileOpen = false"
            class="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Navigation Scrollable Body -->
      <div class="flex-1 overflow-y-auto px-3 py-5 space-y-6 custom-scrollbar">
        <!-- Views Section -->
        <div>
          <div v-if="!taskStore.sidebarCollapsed" class="px-2 mb-2 text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
            Views
          </div>
          <div class="space-y-1">
            <button
              v-for="v in viewOptions"
              :key="v.id"
              @click="switchView(v.id)"
              :title="v.label"
              :class="[
                'w-full flex items-center rounded-xl text-xs font-bold transition-all',
                taskStore.sidebarCollapsed ? 'justify-center p-3' : 'space-x-3 px-3 py-2.5',
                taskStore.activeView === v.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              ]"
            >
              <component :is="v.icon" class="w-4 h-4 shrink-0" />
              <span v-if="!taskStore.sidebarCollapsed" class="truncate">{{ v.label }}</span>
            </button>
          </div>
        </div>

        <!-- Spaces & Lists Section -->
        <div>
          <div v-if="!taskStore.sidebarCollapsed" class="px-2 mb-2 flex items-center justify-between">
            <span class="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Spaces</span>
            <button
              @click="openCreateSpaceModal"
              class="text-slate-400 hover:text-purple-400 p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
              title="Create Space"
            >
              <Plus class="w-4 h-4" />
            </button>
          </div>

          <!-- All Spaces Filter Option -->
          <button
            @click="selectSpace(null)"
            :title="'All Spaces (' + (taskStore.tasks?.length || 0) + ')'"
            :class="[
              'w-full flex items-center rounded-xl text-xs font-semibold transition-colors mb-1.5',
              taskStore.sidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2',
              !taskStore.selectedSpaceId
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            ]"
          >
            <div class="flex items-center space-x-2.5">
              <LayoutGrid class="w-4 h-4 text-purple-400 shrink-0" />
              <span v-if="!taskStore.sidebarCollapsed">All Spaces</span>
            </div>
            <span v-if="!taskStore.sidebarCollapsed" class="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-full font-bold">
              {{ taskStore.tasks?.length || 0 }}
            </span>
          </button>

          <!-- Space Accordions -->
          <div class="space-y-1.5 mt-1">
            <div
              v-for="space in (taskStore.spaces || [])"
              :key="space._id || space.id"
              class="rounded-xl overflow-hidden"
            >
              <div
                @click="selectSpace(space._id || space.id)"
                :title="space.name"
                :class="[
                  'flex items-center cursor-pointer rounded-xl text-xs font-semibold transition-colors group',
                  taskStore.sidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2',
                  taskStore.selectedSpaceId === (space._id || space.id)
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                ]"
              >
                <div class="flex items-center space-x-2.5 truncate">
                  <span
                    class="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/10"
                    :style="{ backgroundColor: space.color || '#7b68ee' }"
                  ></span>
                  <span v-if="!taskStore.sidebarCollapsed" class="truncate">{{ space.name }}</span>
                </div>

                <div v-if="!taskStore.sidebarCollapsed" class="flex items-center space-x-1 shrink-0">
                  <button
                    @click.stop="openCreateListModal(space._id || space.id, space.name)"
                    class="opacity-0 group-hover:opacity-100 hover:text-purple-400 p-1 rounded hover:bg-slate-700/50"
                    title="Add List"
                  >
                    <Plus class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Nested Lists (When sidebar is open) -->
              <div
                v-if="!taskStore.sidebarCollapsed && space.lists && space.lists.length > 0"
                class="pl-5 pr-1 py-1 space-y-1"
              >
                <button
                  v-for="list in space.lists"
                  :key="list._id || list.id"
                  @click="selectList(space._id || space.id, list._id || list.id)"
                  :class="[
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                    taskStore.selectedListId === (list._id || list.id)
                      ? 'bg-purple-900/50 text-purple-300 font-bold border-l-2 border-purple-400 pl-2'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  ]"
                >
                  <div class="flex items-center space-x-2 truncate">
                    <List class="w-3 h-3 text-slate-500" />
                    <span class="truncate">{{ list.name }}</span>
                  </div>
                  <span v-if="list.task_count > 0" class="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded-full font-bold">
                    {{ list.task_count }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Empty Spaces State -->
            <div v-if="!taskStore.spaces || taskStore.spaces.length === 0" class="p-1 text-center">
              <button
                @click="openCreateSpaceModal"
                class="w-full py-2.5 px-3 border-2 border-dashed border-slate-700/80 hover:border-purple-500 rounded-xl text-xs font-bold text-purple-400 hover:text-purple-300 hover:bg-purple-950/20 transition-all flex items-center justify-center space-x-1.5"
              >
                <Plus class="w-4 h-4 shrink-0" />
                <span v-if="!taskStore.sidebarCollapsed">Create Space</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Team Members Section -->
        <div v-if="authStore.users && authStore.users.length > 0">
          <div v-if="!taskStore.sidebarCollapsed" class="px-2 mb-2 flex items-center justify-between">
            <span class="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Team Members</span>
            <span class="text-[10px] text-slate-500 font-bold">{{ authStore.users.length }}</span>
          </div>

          <div class="space-y-1">
            <button
              @click="filterByAssignee(null)"
              :title="'All Members'"
              :class="[
                'w-full flex items-center rounded-xl text-xs transition-colors',
                taskStore.sidebarCollapsed ? 'justify-center p-2.5' : 'space-x-2.5 px-3 py-1.5',
                !taskStore.assigneeFilter ? 'text-white font-bold bg-slate-800/80' : 'text-slate-400 hover:text-slate-200'
              ]"
            >
              <Users class="w-4 h-4 text-purple-400 shrink-0" />
              <span v-if="!taskStore.sidebarCollapsed">All Members</span>
            </button>

            <button
              v-for="u in authStore.users"
              :key="u._id || u.id"
              @click="filterByAssignee(u._id || u.id)"
              :title="u.name"
              :class="[
                'w-full flex items-center rounded-xl text-xs transition-colors',
                taskStore.sidebarCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-1.5',
                taskStore.assigneeFilter === (u._id || u.id)
                  ? 'bg-purple-900/50 text-purple-300 font-bold border-l-2 border-purple-400 pl-2'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              ]"
            >
              <div class="flex items-center space-x-2 truncate">
                <UserAvatar :name="u.name" :avatar="u.avatar" size="xs" />
                <span v-if="!taskStore.sidebarCollapsed" class="truncate">{{ u.name }}</span>
              </div>
              <span v-if="!taskStore.sidebarCollapsed" class="text-[9px] text-slate-500 uppercase font-bold">{{ u.role === 'super_admin' ? 'Admin' : u.role }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- User Profile Footer -->
      <div class="p-3.5 border-t border-slate-800/80 bg-slate-950/80 shrink-0 flex items-center justify-between">
        <div v-if="authStore.currentUser" class="flex items-center space-x-3 min-w-0">
          <UserAvatar :name="authStore.currentUser?.name" :avatar="authStore.currentUser?.avatar" size="md" />
          <div v-if="!taskStore.sidebarCollapsed" class="min-w-0 flex-1">
            <p class="text-xs font-bold text-white truncate leading-tight">{{ authStore.currentUser?.name }}</p>
            <p class="text-[10px] text-slate-400 truncate">{{ authStore.currentUser?.email }}</p>
          </div>
        </div>
        <button
          v-else
          @click="authStore.authModalOpen = true; authStore.authMode = 'login'"
          class="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 transition-all"
        >
          <span v-if="!taskStore.sidebarCollapsed">Sign In / Register</span>
          <span v-else>🔑</span>
        </button>
      </div>

      <!-- CUSTOM CREATE SPACE MODAL -->
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

      <!-- CUSTOM CREATE LIST MODAL -->
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
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { 
  Layers, LayoutGrid, List, Kanban, Calendar, GanttChartSquare, BarChart3, Plus, Users, X, ChevronLeft, ChevronRight 
} from 'lucide-vue-next';
import UserAvatar from '@/components/common/UserAvatar.vue';
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
  taskStore.sidebarMobileOpen = false;
}

function selectSpace(spaceId) {
  taskStore.selectedSpaceId = spaceId;
  taskStore.selectedListId = null;
  taskStore.fetchTasks();
  taskStore.sidebarMobileOpen = false;
}

function selectList(spaceId, listId) {
  taskStore.selectedSpaceId = spaceId;
  taskStore.selectedListId = listId;
  taskStore.fetchTasks();
  taskStore.sidebarMobileOpen = false;
}

function filterByAssignee(userId) {
  taskStore.assigneeFilter = userId;
  taskStore.fetchTasks();
  taskStore.sidebarMobileOpen = false;
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
