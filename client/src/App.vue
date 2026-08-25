<template>
  <div class="h-screen w-screen flex overflow-hidden bg-slate-50 dark:bg-[#18191B]">
    <!-- Global Request Loading Bar -->
    <GlobalLoader />

    <!-- Left ClickUp Sidebar -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top Navigation Bar -->
      <Navbar />

      <!-- Active View Host (Smooth Transition without page reloads) -->
      <main class="flex-1 overflow-hidden relative">
        <KeepAlive>
          <component :is="activeViewComponent" />
        </KeepAlive>
      </main>
    </div>

    <!-- Modals & Drawers -->
    <TaskModal />
    <CreateTaskModal />
    <EmailOutboxModal />
    <SettingsModal />
    <AuthModal />

    <!-- Global Floating Toast Notification Container (Zero Alert System) -->
    <GlobalToastContainer />

    <!-- Global Confirmation Modal (Replaces browser confirm) -->
    <GlobalConfirmModal />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue';
import Navbar from '@/components/layout/Navbar.vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import ListView from '@/components/views/ListView.vue';
import BoardView from '@/components/views/BoardView.vue';
import CalendarView from '@/components/views/CalendarView.vue';
import GanttView from '@/components/views/GanttView.vue';
import DashboardView from '@/components/views/DashboardView.vue';
import SmmSheetView from '@/components/views/SmmSheetView.vue';
import TaskModal from '@/components/tasks/TaskModal.vue';
import CreateTaskModal from '@/components/tasks/CreateTaskModal.vue';
import EmailOutboxModal from '@/components/email/EmailOutboxModal.vue';
import SettingsModal from '@/components/settings/SettingsModal.vue';
import AuthModal from '@/components/auth/AuthModal.vue';
import GlobalLoader from '@/components/common/GlobalLoader.vue';
import GlobalToastContainer from '@/components/common/GlobalToastContainer.vue';
import GlobalConfirmModal from '@/components/common/GlobalConfirmModal.vue';

import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useSmmStore } from '@/stores/smmStore';

const authStore = useAuthStore();
const taskStore = useTaskStore();
const notifStore = useNotificationStore();
const smmStore = useSmmStore();

const activeViewComponent = computed(() => {
  switch (taskStore.activeView) {
    case 'list': return ListView;
    case 'board': return BoardView;
    case 'calendar': return CalendarView;
    case 'gantt': return GanttView;
    case 'dashboard': return DashboardView;
    case 'smm': return SmmSheetView;
    default: return ListView;
  }
});

let autoSyncTimer = null;

// Background Auto-Sync helper (Triggers all GET APIs without reloading the page)
async function triggerAutoSync() {
  if (document.hidden) return; // Save bandwidth when tab is backgrounded
  try {
    await taskStore.fetchTasks();
    await taskStore.fetchSpaces();
    if (authStore.currentUser) {
      await notifStore.fetchNotifications(authStore.currentUser._id || authStore.currentUser.id);
    }
    if (taskStore.activeView === 'smm' && authStore.isSmmMember) {
      await smmStore.fetchCampaigns();
    }
    if (taskStore.activeView === 'dashboard') {
      await taskStore.fetchAnalytics();
    }
  } catch (e) {
    // Silent fail in background sync
  }
}

// Watch for User Persona / Login Changes and auto-sync immediately
watch(() => authStore.currentUser, async (user) => {
  if (user) {
    await taskStore.fetchSpaces();
    await taskStore.fetchTasks();
    await notifStore.fetchNotifications(user._id || user.id);
    if (authStore.isSmmMember) {
      await smmStore.fetchCampaigns();
    }
  }
});

onMounted(async () => {
  await authStore.fetchUsers();
  await taskStore.fetchSpaces();
  await taskStore.fetchTasks();

  if (authStore.currentUser) {
    await notifStore.fetchNotifications(authStore.currentUser._id || authStore.currentUser.id);
  } else if (authStore.users.length === 0) {
    authStore.authModalOpen = true;
    authStore.authMode = 'register';
  }

  // 1. Handle direct task deep-linking from Gmail notification clicks (e.g. ?task=...)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const targetTaskId = urlParams.get('task');
    const targetView = urlParams.get('view');
    if (targetView) {
      taskStore.activeView = targetView;
    }
    if (targetTaskId) {
      await taskStore.openTaskModal(targetTaskId);
    }
  } catch (err) {
    console.warn('Could not parse task query param:', err);
  }

  // 2. Auto-trigger sync when user switches back to browser tab
  window.addEventListener('focus', triggerAutoSync);

  // 3. Periodic background auto-sync every 15 seconds (keeps tasks, spaces, and sheets live without page reload)
  autoSyncTimer = setInterval(triggerAutoSync, 15000);
});

onUnmounted(() => {
  window.removeEventListener('focus', triggerAutoSync);
  if (autoSyncTimer) {
    clearInterval(autoSyncTimer);
  }
});
</script>
