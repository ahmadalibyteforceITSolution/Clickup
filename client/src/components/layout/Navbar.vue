<template>
  <header class="h-14 bg-white dark:bg-[#202225] border-b border-slate-200 dark:border-[#2F3136] px-3 md:px-4 flex items-center justify-between shrink-0 select-none z-20">
    <!-- Left Section: Mobile Menu Toggle, Search & Overdue Filter -->
    <div class="flex items-center space-x-2 md:space-x-3">
      <!-- Mobile Hamburger Toggle -->
      <button
        @click="taskStore.sidebarMobileOpen = !taskStore.sidebarMobileOpen"
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
          placeholder="Search tasks..."
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
      <!-- Create Task Button (Super Admin / Manager / Team) -->
      <button
        @click="taskStore.createTaskModalOpen = true"
        class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium text-xs md:text-sm px-2.5 sm:px-3.5 py-1.5 rounded-lg flex items-center space-x-1 shadow-sm shadow-purple-500/20 transition-all active:scale-95"
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
        <Mail class="w-4 h-4 text-purple-600 dark:text-purple-400" />
        <span class="text-xs font-semibold hidden md:inline">Emails</span>
        <span class="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
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
              <span class="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full font-bold">
                {{ notifStore.unreadCount }} new
              </span>
            </h4>
            <button
              v-if="notifStore.unreadCount > 0"
              @click="markAllAsRead"
              class="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
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
              :class="{ 'bg-purple-50/40 dark:bg-purple-950/20': !n.is_read }"
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
          class="flex items-center space-x-1.5 sm:space-x-2 p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#292B2F] border border-slate-200 dark:border-[#2F3136] transition-colors"
        >
          <UserAvatar
            :name="authStore.currentUser?.name"
            :avatar="authStore.currentUser?.avatar"
            size="sm"
          />
          <div class="text-left hidden lg:block pr-1">
            <p class="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
              {{ authStore.currentUser?.name || 'Sign In' }}
            </p>
            <p class="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              {{ authStore.roleLabel || 'Guest' }}
            </p>
          </div>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
        </button>

        <!-- User Dropdown Menu -->
        <div
          v-if="userMenuOpen"
          class="absolute right-0 mt-2 w-72 bg-white dark:bg-[#202225] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2F3136] py-2 z-50 animate-fade-in"
        >
          <div class="px-4 py-3 border-b border-slate-100 dark:border-[#2F3136] flex items-center space-x-3">
            <UserAvatar
              :name="authStore.currentUser?.name"
              :avatar="authStore.currentUser?.avatar"
              size="md"
            />
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{{ authStore.currentUser?.name || 'Guest User' }}</p>
              <p class="text-[10px] text-slate-400 truncate">{{ authStore.currentUser?.email }}</p>
            </div>
          </div>

          <div class="p-2 space-y-1">
            <!-- Edit Profile & Photo Button -->
            <button
              @click="editProfileOpen = true; userMenuOpen = false"
              class="w-full text-left px-3 py-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-xl flex items-center space-x-2 transition-colors"
            >
              <UserEdit class="w-4 h-4" />
              <span>Edit Profile & Upload Photo</span>
            </button>

            <!-- Register / Switch Account -->
            <button
              @click="authStore.authModalOpen = true; authStore.authMode = 'register'; userMenuOpen = false"
              class="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#292B2F] rounded-xl flex items-center space-x-2 transition-colors"
            >
              <UserPlus class="w-4 h-4 text-slate-400" />
              <span>Register New Account</span>
            </button>

            <!-- Settings & SMTP -->
            <button
              @click="taskStore.settingsModalOpen = true; userMenuOpen = false"
              class="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#292B2F] rounded-xl flex items-center space-x-2 transition-colors"
            >
              <Settings class="w-4 h-4 text-slate-400" />
              <span>Workspace Settings & SMTP</span>
            </button>

            <!-- Logout -->
            <button
              @click="authStore.logout(); userMenuOpen = false"
              class="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl flex items-center space-x-2 transition-colors"
            >
              <LogOut class="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <EditProfileModal
      :isOpen="editProfileOpen"
      @close="editProfileOpen = false"
    />
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { 
  Menu, Search, X, Plus, Mail, Bell, Sun, Moon, ChevronDown, Clock, Settings, UserPlus, LogOut, UserCheck as UserEdit 
} from 'lucide-vue-next';
import UserAvatar from '@/components/common/UserAvatar.vue';
import EditProfileModal from '@/components/settings/EditProfileModal.vue';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';

const authStore = useAuthStore();
const taskStore = useTaskStore();
const notifStore = useNotificationStore();

const notificationsOpen = ref(false);
const userMenuOpen = ref(false);
const editProfileOpen = ref(false);
const isDark = ref(false);

function toggleTheme() {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function toggleOverdueFilter() {
  taskStore.showOverdueOnly = !taskStore.showOverdueOnly;
  taskStore.fetchTasks();
}

function openEmailOutbox() {
  notifStore.fetchEmailLogs();
  taskStore.emailOutboxModalOpen = true;
}

function markAllAsRead() {
  if (authStore.currentUser) {
    notifStore.markAllRead(authStore.currentUser._id || authStore.currentUser.id);
  }
}

function handleNotificationClick(n) {
  if (n.task_id) {
    taskStore.openTaskModal(n.task_id);
    notificationsOpen.value = false;
  }
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch (e) {
    return '';
  }
}
</script>
