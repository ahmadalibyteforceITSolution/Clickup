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

      <!-- Active View Host -->
      <main class="flex-1 overflow-hidden relative">
        <ListView v-if="taskStore.activeView === 'list'" />
        <BoardView v-else-if="taskStore.activeView === 'board'" />
        <CalendarView v-else-if="taskStore.activeView === 'calendar'" />
        <GanttView v-else-if="taskStore.activeView === 'gantt'" />
        <DashboardView v-else-if="taskStore.activeView === 'dashboard'" />
        <SmmSheetView v-else-if="taskStore.activeView === 'smm'" />
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
import { onMounted } from 'vue';
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

const authStore = useAuthStore();
const taskStore = useTaskStore();
const notifStore = useNotificationStore();

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
});
</script>
