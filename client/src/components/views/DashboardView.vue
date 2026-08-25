<template>
  <div class="h-full overflow-y-auto p-4 md:p-6 space-y-6 select-none">
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2F3136]">
      <div>
        <h1 class="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
          <span>{{ authStore.isSuperAdmin || authStore.isManager ? 'Executive Dashboard & Team Workload' : 'My Personal Workspace & Workload' }}</span>
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">
          {{ authStore.isSuperAdmin || authStore.isManager ? 'Real-time metrics, employee task distributions, and upcoming deadlines' : 'Your personal task metrics, active progress, and assigned deadlines' }}
        </p>
      </div>

      <button
        @click="taskStore.fetchAnalytics()"
        class="text-xs theme-text font-semibold hover:underline flex items-center space-x-1"
      >
        <RefreshCw class="w-3.5 h-3.5" />
        <span>Refresh Metrics</span>
      </button>
    </div>

    <!-- Summary KPI Stat Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-[#202225] p-4 rounded-2xl border border-slate-200 dark:border-[#2F3136] shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tasks</p>
          <h3 class="text-2xl font-black text-slate-900 dark:text-white mt-1">{{ summary.total_tasks || 0 }}</h3>
          <p class="text-[11px] text-slate-500 mt-1">{{ summary.total_spaces || 0 }} Spaces Active</p>
        </div>
        <div class="w-10 h-10 rounded-2xl theme-light-bg theme-text flex items-center justify-center">
          <Layers class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-white dark:bg-[#202225] p-4 rounded-2xl border border-slate-200 dark:border-[#2F3136] shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Completion Rate</p>
          <h3 class="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{{ summary.completion_rate || 0 }}%</h3>
          <p class="text-[11px] text-slate-500 mt-1">{{ summary.completed_tasks || 0 }} tasks resolved</p>
        </div>
        <div class="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <CheckCircle2 class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-white dark:bg-[#202225] p-4 rounded-2xl border border-slate-200 dark:border-[#2F3136] shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</p>
          <h3 class="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{{ summary.in_progress_tasks || 0 }}</h3>
          <p class="text-[11px] text-slate-500 mt-1">{{ summary.pending_tasks || 0 }} pending start</p>
        </div>
        <div class="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <PlayCircle class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-white dark:bg-[#202225] p-4 rounded-2xl border border-slate-200 dark:border-[#2F3136] shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Overdue Alerts</p>
          <h3 class="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{{ summary.overdue_tasks || 0 }}</h3>
          <p class="text-[11px] text-red-500 font-semibold mt-1">Requires attention</p>
        </div>
        <div class="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
          <AlertCircle class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Main Grid: Employee Workload & Upcoming Deadlines -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Employee Workload Table -->
      <div class="lg:col-span-2 bg-white dark:bg-[#202225] rounded-2xl border border-slate-200 dark:border-[#2F3136] shadow-sm p-5 space-y-4">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Users class="w-4 h-4 theme-text" />
          <span>{{ authStore.isSuperAdmin || authStore.isManager ? 'Employee Workload & Task Distribution' : 'My Workload & Completion Status' }}</span>
        </h3>

        <div class="divide-y divide-slate-100 dark:divide-[#2F3136]">
          <div
            v-for="emp in (taskStore.analytics?.employee_workload || [])"
            :key="emp.user.id"
            class="py-3 flex items-center justify-between gap-4"
          >
            <div class="flex items-center space-x-3 min-w-0">
              <UserAvatar :name="emp.user.name" :avatar="emp.user.avatar" size="sm" />
              <div class="min-w-0">
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{{ emp.user.name }}</p>
                <p class="text-[10px] text-slate-400 uppercase font-semibold">{{ emp.user.role?.replace('_', ' ') }} • {{ emp.user.department }}</p>
              </div>
            </div>

            <!-- Task Distribution Mini Bar -->
            <div class="flex-1 max-w-xs space-y-1">
              <div class="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span>{{ emp.completed }} done / {{ emp.total }} total</span>
                <span v-if="emp.overdue > 0" class="text-red-500 font-bold">{{ emp.overdue }} overdue</span>
              </div>
              <div class="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full flex overflow-hidden">
                <div
                  class="h-full bg-emerald-500"
                  :style="{ width: `${emp.total > 0 ? (emp.completed / emp.total) * 100 : 0}%` }"
                  title="Completed"
                ></div>
                <div
                  class="h-full bg-blue-500"
                  :style="{ width: `${emp.total > 0 ? (emp.in_progress / emp.total) * 100 : 0}%` }"
                  title="In Progress"
                ></div>
                <div
                  class="h-full bg-amber-500"
                  :style="{ width: `${emp.total > 0 ? ((emp.total - emp.completed - emp.in_progress) / emp.total) * 100 : 0}%` }"
                  title="Pending"
                ></div>
              </div>
            </div>
          </div>

          <div v-if="!(taskStore.analytics?.employee_workload?.length)" class="py-6 text-center text-xs text-slate-400">
            No workload data available
          </div>
        </div>
      </div>

      <!-- Upcoming Deadlines Card -->
      <div class="bg-white dark:bg-[#202225] rounded-2xl border border-slate-200 dark:border-[#2F3136] shadow-sm p-5 space-y-4">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Calendar class="w-4 h-4 theme-text" />
          <span>Upcoming Deadlines</span>
        </h3>

        <div class="space-y-2.5">
          <div
            v-for="task in (taskStore.analytics?.upcoming_deadlines || [])"
            :key="task._id || task.id"
            @click="taskStore.openTaskModal(task)"
            class="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1e2023] hover:bg-slate-100 dark:hover:bg-[#292B2F] cursor-pointer transition-colors border border-slate-100 dark:border-[#2F3136]"
          >
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2">{{ task.title }}</p>
              <span class="text-[10px] font-bold text-slate-500 shrink-0">{{ task.dueDate }}</span>
            </div>
            <div class="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
              <span class="capitalize">{{ task.priority }} priority</span>
              <span class="capitalize font-semibold text-purple-400">{{ task.status.replace('_', ' ') }}</span>
            </div>
          </div>

          <div v-if="!(taskStore.analytics?.upcoming_deadlines?.length)" class="py-6 text-center text-xs text-slate-400">
            No upcoming deadlines
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { 
  Layers, CheckCircle2, PlayCircle, AlertCircle, Users, Calendar, RefreshCw 
} from 'lucide-vue-next';
import UserAvatar from '@/components/common/UserAvatar.vue';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';

const taskStore = useTaskStore();
const authStore = useAuthStore();

onMounted(async () => {
  await taskStore.fetchAnalytics();
});

const summary = computed(() => {
  return taskStore.analytics?.summary || {
    total_tasks: taskStore.tasks.length,
    completed_tasks: taskStore.tasks.filter(t => t.status === 'completed').length,
    in_progress_tasks: taskStore.tasks.filter(t => t.status === 'in_progress').length,
    pending_tasks: taskStore.tasks.filter(t => t.status === 'pending').length,
    overdue_tasks: taskStore.tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      return t.dueDate < new Date().toISOString().split('T')[0];
    }).length,
    completion_rate: taskStore.tasks.length > 0
      ? Math.round((taskStore.tasks.filter(t => t.status === 'completed').length / taskStore.tasks.length) * 100)
      : 0,
    total_spaces: taskStore.spaces.length
  };
});
</script>
