<template>
  <header class="h-14 bg-white dark:bg-[#202225] border-b border-slate-200 dark:border-[#2F3136] px-3 md:px-4 flex items-center justify-between shrink-0 select-none z-20">
    <!-- Left Section: Mobile Menu Toggle, Search & Overdue Filter -->
    <div class="flex items-center space-x-2 md:space-x-3">
      <!-- Mobile Hamburger Toggle -->
      <button
        @click="taskStore.toggleMobileSidebar"
        class="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#292B2F] transition-colors"
        title="Toggle Navigation Menu"
      >
        <Menu class="w-5 h-5" />
      </button>

      <div class="relative w-40 sm:w-60 md:w-80">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <Search class="w-4 h-4" />
        </span>
        <input
          v-model="taskStore.searchQuery"
          @input="taskStore.fetchTasks()"
          type="text"
          placeholder="Search my tasks..."
          class="w-full pl-9 pr-7 py-1.5 bg-slate-100 dark:bg-[#18191B] border border-transparent focus:border-purple-500 rounded-lg text-xs md:text-sm text-slate-800 dark:text-slate-200 focus:outline-none transition-all placeholder:text-slate-400"
        />
        <button
          v-if="taskStore.searchQuery"
          @click="taskStore.searchQuery = ''; taskStore.fetchTasks()"
          class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Overdue Quick Filter Toggle -->
      <button
        @click="toggleOverdueFilter"
        :class="[
          'px-2 py-1 rounded-md text-xs font-semibold hidden sm:flex items-center space-x-1.5 transition-colors border',
          taskStore.showOverdueOnly
            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
            : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-[#292B2F]'
        ]"
      >
        <Clock class="w-3.5 h-3.5" />
        <span>Overdue</span>
      </button>
    </div>

    <!-- Right Section: Actions & User Persona Switcher -->
    <div class="flex items-center space-x-1.5 sm:space-x-2.5">
      <!-- Create Task Button (Only Super Admin & Manager can create new tasks) -->
      <button
        v-if="authStore.isSuperAdmin || authStore.isManager"
        @click="taskStore.createTaskModalOpen = true"
        class="theme-gradient-bg text-white font-medium text-xs md:text-sm px-2.5 sm:px-3.5 py-1.5 rounded-lg flex items-center space-x-1 shadow-sm transition-all active:scale-95 hover:opacity-90"
      >
        <Plus class="w-4 h-4" />
        <span class="hidden sm:inline font-semibold">New Task</span>
      </button>

      <!-- Email Outbox & Logs Modal Trigger -->
      <button
        @click="openEmailOutbox"
        title="View ClickUp Email Outbox & Dispatch History"
        class="relative p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#292B2F] border border-slate-200 dark:border-[#2F3136] transition-colors flex items-center space-x-1"
      >
        <Mail class="w-4 h-4 theme-text" />
        <span class="text-xs font-semibold hidden md:inline">Emails</span>
        <span class="w-2 h-2 rounded-full theme-bg animate-pulse"></span>
      </button>

      <!-- In-App Notification Bell with Dropdown -->
      <div class="relative">
        <button
          @click="notificationsOpen = !notificationsOpen"
          class="relative p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#292B2F] transition-colors"
        >
          <Bell class="w-4 h-4" />
          <span
            v-if="notifStore.unreadCount > 0"
            class="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[#202225]"
          >
            {{ notifStore.unreadCount }}
          </span>
        </button>

        <!-- Notifications Dropdown Drawer -->
        <div
          v-if="notificationsOpen"
          class="absolute right-0 mt-2 w-72 sm:w-96 bg-white dark:bg-[#202225] rounded-xl shadow-2xl border border-slate-200 dark:border-[#2F3136] py-2 z-50 animate-fade-in"
        >
          <div class="px-4 py-2 border-b border-slate-100 dark:border-[#2F3136] flex items-center justify-between">
            <h4 class="font-bold text-sm text-slate-800 dark:text-white flex items-center space-x-2">
              <span>Notifications</span>
              <span class="theme-light-bg theme-text text-xs px-2 py-0.5 rounded-full font-bold">
                {{ notifStore.unreadCount }} new
              </span>
            </h4>
            <button
              v-if="notifStore.unreadCount > 0"
              @click="markAllAsRead"
              class="text-xs theme-text hover:underline font-medium"
            >
              Mark all read
            </button>
          </div>

          <div class="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2F3136]">
            <div
              v-for="n in notifStore.notifications"
              :key="n.id"
              @click="handleNotificationClick(n)"
              class="p-3.5 hover:bg-slate-50 dark:hover:bg-[#292B2F] cursor-pointer transition-colors"
              :class="{ 'theme-light-bg': !n.is_read }"
            >
              <div class="flex items-start justify-between">
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200">{{ n.title }}</p>
                <span class="text-[10px] text-slate-400">{{ formatRelativeTime(n.created_at) }}</span>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">{{ n.message }}</p>
            </div>
            <div v-if="notifStore.notifications.length === 0" class="py-8 text-center text-xs text-slate-400">
              No new notifications
            </div>
          </div>
        </div>
      </div>

      <!-- Workspace Theme Color Palette Dropdown -->
      <div class="relative">
        <button
          @click="colorPaletteOpen = !colorPaletteOpen"
          class="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#292B2F] transition-colors flex items-center space-x-1"
          title="Change Workspace Accent Color"
        >
          <Palette class="w-4 h-4 theme-text" />
          <span class="w-2.5 h-2.5 rounded-full theme-bg ring-1 ring-white dark:ring-slate-800"></span>
        </button>

        <!-- Color Palette Dropdown Card -->
        <div
          v-if="colorPaletteOpen"
          class="absolute right-0 mt-2 w-48 bg-white dark:bg-[#202225] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2F3136] p-3 z-50 animate-fade-in space-y-2"
        >
          <p class="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">Workspace Color</p>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="color in themePalette"
              :key="color.hex"
              @click="applyThemeColor(color.hex)"
              :title="color.name"
              class="w-8 h-8 rounded-xl flex items-center justify-center transition-transform hover:scale-110 shadow-xs"
              :style="{ backgroundColor: color.hex }"
            >
              <Check v-if="uiStore.themeColor.toLowerCase() === color.hex.toLowerCase()" class="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      <!-- Dark / Light Theme Toggle -->
      <button
        @click="toggleTheme"
        class="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#292B2F] transition-colors"
        title="Toggle Light/Dark Theme"
      >
        <Sun v-if="isDark" class="w-4 h-4 text-amber-400" />
        <Moon v-else class="w-4 h-4 text-slate-600" />
      </button>

      <!-- Live User Persona Menu & Edit Profile Trigger -->
      <div class="relative ml-1">
        <button
          @click="userMenuOpen = !userMenuOpen"
          class="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-[#292B2F] transition-colors"
        >
          <UserAvatar
            :name="authStore.currentUser?.name || 'User'"
            :avatar="authStore.currentUser?.avatar"
            size="sm"
          />
          <div class="hidden lg:flex flex-col text-left">
            <span class="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {{ authStore.currentUser?.name || 'Guest' }}
            </span>
            <span class="text-[10px] theme-text uppercase font-extrabold tracking-wider">
              {{ authStore.roleLabel }}
            </span>
          </div>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
        </button>

        <!-- User Dropdown Menu -->
        <div
          v-if="userMenuOpen"
          class="absolute right-0 mt-2 w-60 bg-white dark:bg-[#202225] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2F3136] py-2 z-50 animate-fade-in divide-y divide-slate-100 dark:divide-[#2F3136]"
        >
          <div class="px-4 py-2.5">
            <p class="text-xs font-bold text-slate-900 dark:text-white">{{ authStore.currentUser?.name }}</p>
            <p class="text-[11px] text-slate-500 truncate">{{ authStore.currentUser?.email }}</p>
            <div class="mt-1 flex items-center space-x-1.5">
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase theme-light-bg theme-text">
                {{ authStore.roleLabel }}
              </span>
              <span class="text-[10px] text-slate-400">• {{ authStore.currentUser?.department || 'General' }}</span>
            </div>
          </div>

          <div class="py-1">
            <!-- Edit Profile & Change Password -->
            <button
              @click="openProfileModal"
              class="w-full px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#292B2F] flex items-center space-x-2"
            >
              <UserIcon class="w-4 h-4 theme-text" />
              <span>Edit Profile & Password</span>
            </button>

            <!-- Workspace Settings (Super Admin Only) -->
            <button
              v-if="authStore.isSuperAdmin"
              @click="openSettings"
              class="w-full px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#292B2F] flex items-center space-x-2"
            >
              <SlidersHorizontal class="w-4 h-4 text-slate-500" />
              <span>Workspace Administration</span>
            </button>
          </div>

          <div class="py-1">
            <button
              @click="handleLogout"
              class="w-full px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center space-x-2"
            >
              <LogOut class="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <EditProfileModal
      :isOpen="profileModalOpen"
      :targetUser="authStore.currentUser"
      @close="profileModalOpen = false"
    />
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  Menu, Search, Plus, Bell, Moon, Sun, Mail, Clock, ChevronDown, User as UserIcon, SlidersHorizontal, LogOut, X, Palette, Check
} from 'lucide-vue-next';
import UserAvatar from '@/components/common/UserAvatar.vue';
import EditProfileModal from '@/components/settings/EditProfileModal.vue';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUiStore } from '@/stores/uiStore';
import { formatDistanceToNow } from 'date-fns';

const taskStore = useTaskStore();
const authStore = useAuthStore();
const notifStore = useNotificationStore();
const uiStore = useUiStore();

const notificationsOpen = ref(false);
const userMenuOpen = ref(false);
const colorPaletteOpen = ref(false);
const profileModalOpen = ref(false);

const isDark = computed(() => uiStore.isDarkMode);

const themePalette = [
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Rose Pink', hex: '#E11D48' },
  { name: 'Amber Orange', hex: '#EA580C' },
  { name: 'Ocean Teal', hex: '#0D9488' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Indigo', hex: '#4F46E5' }
];

onMounted(() => {
  uiStore.initTheme();
});

function applyThemeColor(hex) {
  uiStore.setThemeColor(hex);
  colorPaletteOpen.value = false;
  uiStore.success(`Workspace theme updated`);
}

function toggleTheme() {
  uiStore.toggleDarkMode();
}

function toggleOverdueFilter() {
  taskStore.showOverdueOnly = !taskStore.showOverdueOnly;
  taskStore.fetchTasks();
}

function openEmailOutbox() {
  taskStore.emailOutboxModalOpen = true;
}

function openSettings() {
  taskStore.settingsModalOpen = true;
  userMenuOpen.value = false;
}

function openProfileModal() {
  profileModalOpen.value = true;
  userMenuOpen.value = false;
}

function handleLogout() {
  authStore.logout();
  userMenuOpen.value = false;
}

async function markAllAsRead() {
  if (authStore.currentUser) {
    await notifStore.markAllAsRead(authStore.currentUser._id || authStore.currentUser.id);
  }
}

function handleNotificationClick(n) {
  if (n.task_id) {
    taskStore.openTaskModal(n.task_id);
  }
  notificationsOpen.value = false;
}

function formatRelativeTime(date) {
  if (!date) return '';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (e) {
    return '';
  }
}
</script>
