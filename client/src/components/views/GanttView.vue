<template>
  <div class="h-full flex flex-col p-4 md:p-6 select-none overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2F3136] shrink-0 mb-4">
      <div>
        <h1 class="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
          <span>Gantt & Timeline View</span>
          <span class="text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
            {{ timelineTasks.length }} Scheduled Tasks
          </span>
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">Visualize project timelines, task duration spans, and team schedules</p>
      </div>

      <button
        @click="taskStore.createTaskModalOpen = true"
        class="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-sm transition-all"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Add Task</span>
      </button>
    </div>

    <!-- Timeline Container with Horizontal Scroll -->
    <div class="flex-1 bg-white dark:bg-[#202225] rounded-xl border border-slate-200 dark:border-[#2F3136] shadow-sm flex flex-col overflow-hidden">
      <!-- Days Timeline Scale -->
      <div class="flex border-b border-slate-200 dark:border-[#2F3136] bg-slate-50 dark:bg-[#18191B] shrink-0">
        <div class="w-72 p-3 font-bold text-xs text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-[#2F3136] shrink-0">
          Task Name & Assignee
        </div>

        <div class="flex-1 overflow-x-auto flex divide-x divide-slate-200 dark:divide-[#2F3136]" ref="timelineHeaderRef">
          <div
            v-for="d in timelineDays"
            :key="d.dateStr"
            :class="[
              'w-16 py-2 px-1 text-center shrink-0 text-[11px]',
              d.isToday ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 font-extrabold' : 'text-slate-500'
            ]"
          >
            <div class="font-bold">{{ d.dayName }}</div>
            <div class="text-[10px]">{{ d.dayNum }}</div>
          </div>
        </div>
      </div>

      <!-- Task Timeline Rows -->
      <div class="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2F3136]">
        <div
          v-for="task in timelineTasks"
          :key="task._id || task.id"
          @click="taskStore.openTaskModal(task)"
          class="flex items-center hover:bg-slate-50 dark:hover:bg-[#292B2F] transition-colors cursor-pointer group"
        >
          <!-- Task Info Column -->
          <div class="w-72 p-3 border-r border-slate-200 dark:border-[#2F3136] shrink-0 flex items-center justify-between min-w-0">
            <div class="min-w-0 pr-2">
              <p class="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 truncate">
                {{ task.title }}
              </p>
              <div class="flex items-center space-x-1.5 mt-0.5">
                <span
                  class="w-2 h-2 rounded-full"
                  :style="{ backgroundColor: getStatusColor(task.status) }"
                ></span>
                <span class="text-[10px] text-slate-400 uppercase font-semibold">
                  {{ task.status.replace('_', ' ') }}
                </span>
              </div>
            </div>

            <!-- Avatar -->
            <div class="flex items-center -space-x-1 shrink-0">
              <template v-if="task.assignees && task.assignees.length > 0">
                <img
                  v-for="a in task.assignees.slice(0, 2)"
                  :key="a._id || a.id"
                  :src="a.avatar"
                  class="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                />
              </template>
            </div>
          </div>

          <!-- Gantt Bar Lane -->
          <div class="flex-1 overflow-x-auto relative h-14 flex items-center">
            <div
              v-if="getTaskBarStyle(task)"
              :style="getTaskBarStyle(task)"
              :class="[
                'absolute h-7 rounded-lg shadow-sm px-2 flex items-center justify-between text-white text-[11px] font-bold transition-all hover:brightness-110',
                task.status === 'completed'
                  ? 'bg-emerald-500'
                  : task.priority === 'urgent'
                  ? 'bg-red-500'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600'
              ]"
            >
              <span class="truncate">{{ task.title }}</span>
              <span class="text-[9px] bg-black/20 px-1 py-0.5 rounded ml-1">{{ task.priority }}</span>
            </div>
          </div>
        </div>

        <div v-if="timelineTasks.length === 0" class="py-12 text-center text-xs text-slate-400 italic">
          No scheduled tasks with start/due dates. Click "+ New Task" to schedule one!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Plus } from 'lucide-vue-next';
import { useTaskStore } from '@/stores/taskStore';
import { 
  addDays, subDays, format, differenceInCalendarDays, parseISO, isToday as checkIsToday 
} from 'date-fns';

const taskStore = useTaskStore();

const timelineTasks = computed(() => {
  return taskStore.filteredTasks.filter(t => t.startDate || t.dueDate);
});

// Generate 21-day timeline window centered on today
const baseDate = new Date();
const timelineDays = computed(() => {
  const days = [];
  for (let i = -5; i <= 15; i++) {
    const d = addDays(baseDate, i);
    days.push({
      date: d,
      dateStr: format(d, 'yyyy-MM-dd'),
      dayName: format(d, 'EEE'),
      dayNum: format(d, 'd'),
      isToday: checkIsToday(d)
    });
  }
  return days;
});

const dayWidthPx = 64; // w-16 = 64px
const startDateWindow = subDays(baseDate, 5);

function getTaskBarStyle(task) {
  const startStr = task.startDate || task.dueDate;
  const dueStr = task.dueDate || task.startDate;
  if (!startStr) return null;

  try {
    const sDate = parseISO(startStr);
    const dDate = parseISO(dueStr);

    const startOffset = differenceInCalendarDays(sDate, startDateWindow);
    const duration = Math.max(1, differenceInCalendarDays(dDate, sDate) + 1);

    const left = Math.max(0, startOffset * dayWidthPx);
    const width = Math.max(dayWidthPx, duration * dayWidthPx);

    return {
      left: `${left}px`,
      width: `${width}px`
    };
  } catch (e) {
    return null;
  }
}

function getStatusColor(status) {
  const map = {
    pending: '#8B5CF6',
    in_progress: '#3B82F6',
    review: '#F59E0B',
    completed: '#10B981'
  };
  return map[status] || '#8B5CF6';
}
</script>
