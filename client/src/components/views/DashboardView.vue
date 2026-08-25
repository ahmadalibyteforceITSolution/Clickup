<template>
  <div class="h-full overflow-y-auto p-4 md:p-6 space-y-6 select-none">
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2F3136]">
      <div>
        <h1 class="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
          <span>Executive Dashboard & Team Workload</span>
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">Real-time metrics, employee task distributions, and upcoming deadlines</p>
      </div>

      <button
        @click="taskStore.fetchAnalytics()"
        class="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center space-x-1"
      >
        <RefreshCw class="w-3.5 h-3.5" />
        <span>Refresh Metrics</span>
      </button>
    </div>

    <!-- Summary KPI Stat Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-[#202225] p-4 rounded-xl border border-slate-200 dark:border-[#2F3136] shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tasks</p>
          <h3 class="text-2xl font-black text-slate-900 dark:text-white mt-1">{{ summary.totalTasks || 0 }}</h3>
          <p class="text-[11px] text-slate-500 mt-1">{{ summary.totalSpaces || 0 }} Spaces Active</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
          <Layers class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-white dark:bg-[#202225] p-4 rounded-xl border border-slate-200 dark:border-[#2F3136] shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Completion Rate</p>
          <h3 class="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{{ summary.completionRate || 0 }}%</h3>
          <p class="text-[11px] text-slate-500 mt-1">{{ summary.completedTasks || 0 }} tasks resolved</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <CheckCircle2 class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-white dark:bg-[#202225] p-4 rounded-xl border border-slate-200 dark:border-[#2F3136] shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</p>
          <h3 class="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{{ summary.inProgressTasks || 0 }}</h3>
          <p class="text-[11px] text-slate-500 mt-1">{{ summary.pendingTasks || 0 }} pending start</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <PlayCircle class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-white dark:bg-[#202225] p-4 rounded-xl border border-slate-200 dark:border-[#2F3136] shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Overdue Alerts</p>
          <h3 class="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{{ summary.overdueTasks || 0 }}</h3>
          <p class="text-[11px] text-red-500 font-semibold mt-1">Requires manager review</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
          <AlertCircle class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Main Grid: Employee Workload & Upcoming Deadlines -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Employee Workload Table -->
      <div class="lg:col-span-2 bg-white dark:bg-[#202225] rounded-xl border border-slate-200 dark:border-[#2F3136] shadow-sm p-5 space-y-4">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Users class="w-4 h-4 text-purple-500" />
          <span>Employee Workload & Task Distribution</span>
        </h3>

        <div class="divide-y divide-slate-100 dark:divide-[#2F3136]">
          <div
            v-for="emp in (taskStore.analyticsData?.employeeWorkload || [])"
            :key="emp.id"
            class="py-3 flex items-center justify-between gap-4"
          >
            <div class="flex items-center space-x-3 min-w-0">
              <img :src="emp.avatar" class="w-8 h-8 rounded-full object-cover shrink-0" />
              <div class="min-w-0">
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{{ emp.name }}</p>
                <p class="text-[10px] text-slate-400 uppercase font-semibold">{{ emp.role.replace('_', ' ') }} • {{ emp.department }}</p>
              </div>
            </div>

            <!-- Task Distribution Mini Bar -->
            <div class="flex-1 max-w-xs space-y-1">
              <div class="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span>{{ emp.completed }} done / {{ emp.total_assigned }} assigned</span>
                <span v-if="emp.overdue > 0" class="text-red-500 font-bold">{{ emp.overdue }} overdue</span>
              </div>
              <div class="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full flex overflow-hidden">
                <div
                  class="h-full bg-emerald-500"
                  :style="{ width: `${emp.total_assigned > 0 ? (emp.completed / emp.total_assigned) * 100 : 0}%` }"
                  title="Completed"
                ></div>
                <div
                  class="h-full bg-blue-500"
                  :style="{ width: `${emp.total_assigned > 0 ? (emp.in_progress / emp.total_assigned) * 100 : 0}%` }"
                  title="In Progress"
                ></div>
                <div
                  class="h-full bg-amber-500"
                  :style="{ width: `${emp.total_assigned > 0 ? (emp.pending / emp.total_assigned) * 100 : 0}%` }"
                  title="Pending"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming Deadlines Card -->
      <div class="bg-white dark:bg-[#202225] rounded-xl border border-slate-200 dark:border-[#2F3136] shadow-sm p-5 space-y-4">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Calendar class="w-4 h-4 text-purple-500" />
          <span>Upcoming Deadlines</span>
        </h3>

        <div class="space-y-2.5">
          <div
            v-for="task in (taskStore.analyticsData?.upcomingDeadlines || [])"
            :key="task._id || task.id"
            @click="taskStore.openTaskModal(task)"
            class="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1e2023] hover:bg-purple-50 dark:hover:bg-[#292B2F] cursor-pointer transition-colors border border-slate-100 dark:border-[#2F3136]"
          >
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2">{{ task.title }}</p>
              <span class="text-[10px] font-bold text-purple-600 dark:text-purple-400 shrink-0">
                {{ task.dueDate }}
              </span>
            </div>
            <p class="text-[10px] text-slate-400 mt-1 capitalize">{{ task.priority }} Priority • {{ task.status.replace('_', ' ') }}</p>
          </div>

          <div
            v-if="!(taskStore.analyticsData?.upcomingDeadlines?.length)"
            class="py-8 text-center text-xs text-slate-400 italic"
          >
            No upcoming deadlines in the next 7 days
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { 
  RefreshCw, Layers, CheckCircle2, PlayCircle, AlertCircle, Users, Calendar 
} from 'lucide-vue-next';
import { useTaskStore } from '@/stores/taskStore';

const taskStore = useTaskStore();

const summary = computed(() => taskStore.analyticsData?.summary || {});

onMounted(() => {
  taskStore.fetchAnalytics();
});
</script>
