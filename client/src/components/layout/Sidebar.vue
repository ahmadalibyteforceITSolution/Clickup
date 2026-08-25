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
          <div class="w-9 h-9 rounded-xl theme-gradient-bg flex items-center justify-center text-white shrink-0 shadow-lg theme-shadow">
            <Layers class="w-5 h-5" />
          </div>
          <div v-if="!taskStore.sidebarCollapsed" class="truncate flex items-center space-x-1.5">
            <span class="font-black text-lg tracking-tight text-white">Click<span class="theme-text">Up</span></span>
            <span class="text-[10px] theme-light-bg theme-text font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Workspace</span>
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
                  ? 'theme-gradient-bg text-white shadow-md theme-shadow'
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
            <!-- Create Space Button (Only for Super Admin & Manager) -->
            <button
              v-if="authStore.isSuperAdmin || authStore.isManager"
              @click="openCreateSpaceModal"
              class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
              title="Create New Space"
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
              <LayoutGrid class="w-4 h-4 theme-text shrink-0" />
              <span v-if="!taskStore.sidebarCollapsed">{{ authStore.isEmployee ? 'My Spaces' : 'All Spaces' }}</span>
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
                    :style="{ backgroundColor: space.color || 'var(--theme-primary)' }"
                  ></span>
                  <span v-if="!taskStore.sidebarCollapsed" class="truncate">{{ space.name }}</span>
                </div>

                <!-- Space Action Buttons (Super Admin / Manager Only) -->
                <div v-if="!taskStore.sidebarCollapsed && (authStore.isSuperAdmin || authStore.isManager)" class="flex items-center space-x-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <!-- Add List -->
                  <button
                    @click.stop="openCreateListModal(space._id || space.id, space.name)"
                    class="hover:text-white p-1 rounded hover:bg-slate-700/50"
                    title="Add List"
                  >
                    <Plus class="w-3.5 h-3.5" />
                  </button>
                  <!-- Edit / Rename Space -->
                  <button
                    @click.stop="openEditSpaceModal(space)"
                    class="hover:text-white p-1 rounded hover:bg-slate-700/50"
                    title="Rename / Edit Space"
                  >
                    <Edit3 class="w-3.5 h-3.5" />
                  </button>
                  <!-- Delete Space -->
                  <button
                    @click.stop="handleDeleteSpace(space)"
                    class="hover:text-red-400 p-1 rounded hover:bg-slate-700/50"
                    title="Delete Space"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Nested Lists -->
              <div
                v-if="!taskStore.sidebarCollapsed && space.lists && space.lists.length > 0"
                class="pl-5 pr-1 py-1 space-y-1"
              >
                <div
                  v-for="list in space.lists"
                  :key="list._id || list.id"
                  @click="selectList(space._id || space.id, list._id || list.id)"
                  :class="[
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer group/list',
                    taskStore.selectedListId === (list._id || list.id)
                      ? 'theme-light-bg theme-text font-bold border-l-2 theme-border pl-2'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  ]"
                >
                  <div class="flex items-center space-x-2 truncate">
                    <List class="w-3 h-3 text-slate-500" />
                    <span class="truncate">{{ list.name }}</span>
                  </div>

                  <div class="flex items-center space-x-1 shrink-0">
                    <span v-if="list.task_count > 0" class="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded-full font-bold">
                      {{ list.task_count }}
                    </span>
                    <!-- List Edit / Delete (Super Admin / Manager Only) -->
                    <div v-if="authStore.isSuperAdmin || authStore.isManager" class="flex items-center space-x-0.5 opacity-0 group-hover/list:opacity-100 transition-opacity">
                      <button
                        @click.stop="openEditListModal(space._id || space.id, list)"
                        class="p-0.5 hover:text-white rounded hover:bg-slate-700/50"
                        title="Rename List"
                      >
                        <Edit3 class="w-3 h-3" />
                      </button>
                      <button
                        @click.stop="handleDeleteList(list)"
                        class="p-0.5 hover:text-red-400 rounded hover:bg-slate-700/50"
                        title="Delete List"
                      >
                        <Trash2 class="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty Spaces State -->
            <div v-if="(!taskStore.spaces || taskStore.spaces.length === 0) && (authStore.isSuperAdmin || authStore.isManager)" class="p-1 text-center">
              <button
                @click="openCreateSpaceModal"
                class="w-full py-2.5 px-3 border-2 border-dashed border-slate-700/80 theme-border rounded-xl text-xs font-bold theme-text hover:opacity-90 theme-light-bg transition-all flex items-center justify-center space-x-1.5"
              >
                <Plus class="w-4 h-4 shrink-0" />
                <span v-if="!taskStore.sidebarCollapsed">Create Space</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Team Members Section (Super Admin / Manager Only) -->
        <div v-if="(authStore.isSuperAdmin || authStore.isManager) && authStore.users && authStore.users.length > 0">
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
              <Users class="w-4 h-4 theme-text shrink-0" />
              <span v-if="!taskStore.sidebarCollapsed">All Members</span>
            </button>

            <div
              v-for="u in authStore.users"
              :key="u._id || u.id"
              class="flex items-center justify-between group rounded-xl hover:bg-slate-800/40 transition-colors"
              :class="[
                taskStore.assigneeFilter === (u._id || u.id) ? 'theme-light-bg theme-text font-bold border-l-2 theme-border' : ''
              ]"
            >
              <button
                @click="filterByAssignee(u._id || u.id)"
                :title="u.name"
                :class="[
                  'flex items-center flex-1 min-w-0 text-xs transition-colors',
                  taskStore.sidebarCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-1.5',
                  taskStore.assigneeFilter === (u._id || u.id)
                    ? 'theme-text font-bold pl-2'
                    : 'text-slate-400 hover:text-slate-200'
                ]"
              >
                <div class="flex items-center space-x-2 truncate">
                  <UserAvatar :name="u.name" :avatar="u.avatar" size="xs" />
                  <span v-if="!taskStore.sidebarCollapsed" class="truncate">{{ u.name }}</span>
                </div>
                <span v-if="!taskStore.sidebarCollapsed" class="text-[9px] text-slate-500 uppercase font-bold pr-1">
                  {{ u.role === 'super_admin' ? 'Admin' : u.role }}
                </span>
              </button>

              <!-- Super Admin Edit / Manage Button on Each Profile -->
              <button
                v-if="!taskStore.sidebarCollapsed && authStore.isSuperAdmin"
                @click.stop="openEditMemberModal(u)"
                class="opacity-0 group-hover:opacity-100 p-1.5 mr-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-opacity"
                title="Edit / Delete Employee Profile"
              >
                <Edit3 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- User Profile Footer -->
      <div class="p-3.5 border-t border-slate-800/80 bg-slate-950/80 shrink-0 flex items-center justify-between">
        <div v-if="authStore.currentUser" class="flex items-center space-x-3 min-w-0">
          <UserAvatar :name="authStore.currentUser?.name" :avatar="authStore.currentUser?.avatar" size="md" />
          <div v-if="!taskStore.sidebarCollapsed" class="min-w-0 flex-1">
            <p class="text-xs font-bold text-white truncate leading-tight">{{ authStore.currentUser?.name }}</p>
            <p class="text-[10px] theme-text font-semibold truncate uppercase">{{ authStore.roleLabel }}</p>
          </div>
        </div>
        <button
          v-else
          @click="authStore.authModalOpen = true; authStore.authMode = 'login'"
          class="w-full py-2.5 theme-gradient-bg text-white font-bold text-xs rounded-xl shadow-md theme-shadow transition-all hover:opacity-90"
        >
          <span v-if="!taskStore.sidebarCollapsed">Sign In / Register</span>
          <span v-else>🔑</span>
        </button>
      </div>

      <!-- CREATE / EDIT SPACE MODAL -->
      <div
        v-if="createSpaceModalOpen || editSpaceModalOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
        @click.self="closeSpaceModals"
      >
        <div class="bg-white dark:bg-[#202225] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2F3136] w-full max-w-sm p-5 space-y-4 text-slate-900 dark:text-white">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-extrabold flex items-center space-x-2">
              <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: selectedSpaceColor }"></span>
              <span>{{ editSpaceModalOpen ? 'Rename / Edit Space' : 'Create New Space' }}</span>
            </h3>
            <button @click="closeSpaceModals" class="text-slate-400 hover:text-slate-600">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Space Name *</label>
            <input
              v-model="newSpaceName"
              type="text"
              required
              placeholder="e.g. Marketing, Engineering, Operations..."
              class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-900 dark:text-white focus:outline-none theme-border"
              @keyup.enter="handleSaveSpace"
            />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Space Theme Color</label>
            <div class="flex items-center space-x-2">
              <button
                v-for="color in ['#7B68EE', '#2563EB', '#059669', '#E11D48', '#EA580C', '#0D9488', '#DC2626', '#4F46E5']"
                :key="color"
                type="button"
                @click="selectedSpaceColor = color"
                class="w-6 h-6 rounded-full transition-transform"
                :style="{ backgroundColor: color }"
                :class="{ 'ring-2 ring-offset-2 scale-110': selectedSpaceColor === color }"
              ></button>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-2 pt-2">
            <button
              @click="closeSpaceModals"
              class="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              @click="handleSaveSpace"
              :disabled="!newSpaceName.trim()"
              class="px-4 py-1.5 theme-bg hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              {{ editSpaceModalOpen ? 'Save Changes' : 'Create Space' }}
            </button>
          </div>
        </div>
      </div>

      <!-- CREATE / EDIT LIST MODAL -->
      <div
        v-if="createListModalOpen || editListModalOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
        @click.self="closeListModals"
      >
        <div class="bg-white dark:bg-[#202225] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2F3136] w-full max-w-sm p-5 space-y-4 text-slate-900 dark:text-white">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-extrabold flex items-center space-x-2">
              <List class="w-4 h-4 theme-text" />
              <span>{{ editListModalOpen ? 'Rename List' : `Add List in ${targetSpaceName}` }}</span>
            </h3>
            <button @click="closeListModals" class="text-slate-400 hover:text-slate-600">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">List Name *</label>
            <input
              v-model="newListName"
              type="text"
              required
              placeholder="e.g. Sprint 1, Backlog, Ideas, General Tasks..."
              class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-900 dark:text-white focus:outline-none theme-border"
              @keyup.enter="handleSaveList"
            />
          </div>

          <div class="flex items-center justify-end space-x-2 pt-2">
            <button
              @click="closeListModals"
              class="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              @click="handleSaveList"
              :disabled="!newListName.trim()"
              class="px-4 py-1.5 theme-bg hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              {{ editListModalOpen ? 'Save Changes' : 'Add List' }}
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Super Admin Member Profile Edit Modal -->
    <EditProfileModal
      :isOpen="editMemberModalOpen"
      :targetUser="selectedMemberToEdit"
      @close="editMemberModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { 
  Layers, LayoutGrid, List, Kanban, Calendar, GanttChartSquare, BarChart3, Plus, Users, X, ChevronLeft, ChevronRight, Edit3, Trash2, Share2 
} from 'lucide-vue-next';
import UserAvatar from '@/components/common/UserAvatar.vue';
import EditProfileModal from '@/components/settings/EditProfileModal.vue';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useUiStore } from '@/stores/uiStore';

const authStore = useAuthStore();
const taskStore = useTaskStore();
const uiStore = useUiStore();

const viewOptions = computed(() => {
  const options = [
    { id: 'list', label: 'List View', icon: List },
    { id: 'board', label: 'Kanban Board', icon: Kanban },
    { id: 'calendar', label: 'Calendar Schedule', icon: Calendar },
    { id: 'gantt', label: 'Gantt Timeline', icon: GanttChartSquare },
    { id: 'dashboard', label: 'Dashboard & Metrics', icon: BarChart3 }
  ];

  if (authStore.isSmmMember) {
    options.push({ id: 'smm', label: 'SMM & Campaign Sheets', icon: Share2 });
  }

  return options;
});

// Space Modals State
const createSpaceModalOpen = ref(false);
const editSpaceModalOpen = ref(false);
const editingSpaceId = ref(null);
const newSpaceName = ref('');
const selectedSpaceColor = ref('#7B68EE');

// List Modals State
const createListModalOpen = ref(false);
const editListModalOpen = ref(false);
const editingListId = ref(null);
const targetSpaceId = ref(null);
const targetSpaceName = ref('');
const newListName = ref('');

const editMemberModalOpen = ref(false);
const selectedMemberToEdit = ref(null);

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
  editingSpaceId.value = null;
  newSpaceName.value = '';
  selectedSpaceColor.value = uiStore.themeColor || '#7B68EE';
  editSpaceModalOpen.value = false;
  createSpaceModalOpen.value = true;
}

function openEditSpaceModal(space) {
  editingSpaceId.value = space._id || space.id;
  newSpaceName.value = space.name || '';
  selectedSpaceColor.value = space.color || uiStore.themeColor || '#7B68EE';
  createSpaceModalOpen.value = false;
  editSpaceModalOpen.value = true;
}

function closeSpaceModals() {
  createSpaceModalOpen.value = false;
  editSpaceModalOpen.value = false;
  editingSpaceId.value = null;
  newSpaceName.value = '';
}

async function handleSaveSpace() {
  if (!newSpaceName.value.trim()) return;
  try {
    if (editSpaceModalOpen.value && editingSpaceId.value) {
      await taskStore.updateSpace(editingSpaceId.value, {
        name: newSpaceName.value.trim(),
        color: selectedSpaceColor.value
      });
      uiStore.success(`Space renamed to "${newSpaceName.value.trim()}"`);
    } else {
      await taskStore.createSpace({
        name: newSpaceName.value.trim(),
        color: selectedSpaceColor.value,
        created_by: authStore.currentUser?._id || authStore.currentUser?.id
      });
      uiStore.success(`Space "${newSpaceName.value.trim()}" created`);
    }
    closeSpaceModals();
  } catch (err) {
    uiStore.error('Error saving space: ' + err.message);
  }
}

async function handleDeleteSpace(space) {
  const confirmed = await uiStore.confirm({
    title: 'Delete Space',
    message: `Are you sure you want to permanently delete space "${space.name}" and all its lists & tasks?`,
    confirmText: 'Delete Space',
    isDanger: true
  });

  if (confirmed) {
    try {
      await taskStore.deleteSpace(space._id || space.id);
      uiStore.success(`Space "${space.name}" deleted`);
    } catch (err) {
      uiStore.error('Failed to delete space: ' + err.message);
    }
  }
}

function openCreateListModal(spaceId, spaceName) {
  targetSpaceId.value = spaceId;
  targetSpaceName.value = spaceName || 'Space';
  editingListId.value = null;
  newListName.value = '';
  editListModalOpen.value = false;
  createListModalOpen.value = true;
}

function openEditListModal(spaceId, list) {
  targetSpaceId.value = spaceId;
  editingListId.value = list._id || list.id;
  newListName.value = list.name || '';
  createListModalOpen.value = false;
  editListModalOpen.value = true;
}

function closeListModals() {
  createListModalOpen.value = false;
  editListModalOpen.value = false;
  editingListId.value = null;
  newListName.value = '';
}

async function handleSaveList() {
  if (!newListName.value.trim()) return;
  try {
    if (editListModalOpen.value && editingListId.value) {
      await taskStore.updateList(editingListId.value, {
        name: newListName.value.trim()
      });
      uiStore.success(`List renamed to "${newListName.value.trim()}"`);
    } else if (targetSpaceId.value) {
      await taskStore.createList(targetSpaceId.value, { name: newListName.value.trim() });
      uiStore.success(`List "${newListName.value.trim()}" added to ${targetSpaceName.value}`);
    }
    closeListModals();
  } catch (err) {
    uiStore.error('Error saving list: ' + err.message);
  }
}

async function handleDeleteList(list) {
  const confirmed = await uiStore.confirm({
    title: 'Delete List',
    message: `Are you sure you want to delete list "${list.name}" and all its tasks?`,
    confirmText: 'Delete List',
    isDanger: true
  });

  if (confirmed) {
    try {
      await taskStore.deleteList(list._id || list.id);
      uiStore.success(`List "${list.name}" deleted`);
    } catch (err) {
      uiStore.error('Failed to delete list: ' + err.message);
    }
  }
}

function openEditMemberModal(user) {
  selectedMemberToEdit.value = user;
  editMemberModalOpen.value = true;
}
</script>
