<template>
  <div class="h-full flex flex-col p-4 md:p-6 select-none overflow-hidden">
    <!-- Calendar Controls Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#2F3136] shrink-0">
      <div class="flex items-center space-x-3">
        <h1 class="text-xl font-extrabold text-slate-900 dark:text-white">
          {{ monthYearLabel }}
        </h1>
        <div class="flex items-center space-x-1 bg-slate-100 dark:bg-[#18191B] p-1 rounded-lg border border-slate-200 dark:border-[#2F3136]">
          <button
            @click="prevMonth"
            class="p-1 rounded hover:bg-white dark:hover:bg-[#202225] text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            @click="goToToday"
            class="px-2 py-0.5 text-xs font-bold rounded hover:bg-white dark:hover:bg-[#202225] text-slate-700 dark:text-slate-200 transition-colors"
          >
            Today
          </button>
          <button
            @click="nextMonth"
            class="p-1 rounded hover:bg-white dark:hover:bg-[#202225] text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <span class="text-xs text-slate-500">Click any date to schedule a new task</span>
        <button
          @click="taskStore.createTaskModalOpen = true"
          class="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-sm transition-all"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>
    </div>

    <!-- Weekday Header -->
    <div class="grid grid-cols-7 gap-px bg-slate-200 dark:bg-[#2F3136] border-y border-slate-200 dark:border-[#2F3136] shrink-0 mt-3">
      <div
        v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
        :key="day"
        class="bg-slate-50 dark:bg-[#1e2023] py-2 text-center text-xs font-bold uppercase text-slate-500 tracking-wider"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar Month Grid -->
    <div class="flex-1 grid grid-cols-7 gap-px bg-slate-200 dark:bg-[#2F3136] overflow-y-auto">
      <div
        v-for="cell in calendarDays"
        :key="cell.dateStr"
        @click="handleDayClick(cell.dateStr)"
        :class="[
          'bg-white dark:bg-[#202225] p-2 min-h-[90px] flex flex-col justify-between transition-colors hover:bg-purple-50/20 dark:hover:bg-purple-950/10 cursor-pointer group',
          !cell.isCurrentMonth ? 'opacity-40 bg-slate-50/60 dark:bg-[#18191B]/60' : '',
          cell.isToday ? 'ring-2 ring-inset ring-purple-500' : ''
        ]"
      >
        <!-- Date Number -->
        <div class="flex items-center justify-between mb-1">
          <span
            :class="[
              'text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center',
              cell.isToday
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 group-hover:text-purple-600'
            ]"
          >
            {{ cell.dayNumber }}
          </span>
          <span
            v-if="cell.tasks.length > 0"
            class="text-[10px] font-bold text-slate-400"
          >
            {{ cell.tasks.length }}
          </span>
        </div>

        <!-- Task Chips for this day -->
        <div class="space-y-1 overflow-y-auto max-h-24">
          <div
            v-for="task in cell.tasks"
            :key="task._id || task.id"
            @click.stop="taskStore.openTaskModal(task)"
            :class="[
              'px-2 py-1 rounded text-[11px] font-semibold truncate flex items-center space-x-1.5 shadow-sm transition-all hover:scale-[1.02]',
              getTaskChipClass(task)
            ]"
            :title="task.title + ' (' + task.status + ')'"
          >
            <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: getStatusColor(task.status) }"></span>
            <span class="truncate">{{ task.title }}</span>
          </div>
        </div>

        <div></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-vue-next';
import { useTaskStore } from '@/stores/taskStore';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday as checkIsToday 
} from 'date-fns';

const taskStore = useTaskStore();
const currentDate = ref(new Date());

const monthYearLabel = computed(() => format(currentDate.value, 'MMMM yyyy'));

const calendarDays = computed(() => {
  const monthStart = startOfMonth(currentDate.value);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayTasks = taskStore.filteredTasks.filter(t => t.dueDate === dateStr || t.startDate === dateStr);

    return {
      date: day,
      dateStr,
      dayNumber: format(day, 'd'),
      isCurrentMonth: isSameMonth(day, monthStart),
      isToday: checkIsToday(day),
      tasks: dayTasks
    };
  });
});

function prevMonth() {
  currentDate.value = subMonths(currentDate.value, 1);
}

function nextMonth() {
  currentDate.value = addMonths(currentDate.value, 1);
}

function goToToday() {
  currentDate.value = new Date();
}

function handleDayClick(dateStr) {
  taskStore.createTaskModalOpen = true;
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

function getTaskChipClass(task) {
  if (task.status === 'completed') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
  }
  if (task.priority === 'urgent') {
    return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 font-bold';
  }
  return 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200';
}
</script>
