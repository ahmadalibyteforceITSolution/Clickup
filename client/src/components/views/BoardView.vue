<template>
  <div class="h-full overflow-x-auto p-4 md:p-6 select-none">
    <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2F3136] mb-6">
      <div>
        <h1 class="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
          <span>Kanban Board</span>
          <span class="text-xs theme-light-bg theme-text font-bold px-2.5 py-0.5 rounded-full">
            {{ taskStore.filteredTasks.length }} Cards
          </span>
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">Drag cards between columns to change status, assign team members, and trigger email notifications</p>
      </div>

      <button
        v-if="authStore.isSuperAdmin || authStore.isManager"
        @click="taskStore.createTaskModalOpen = true"
        class="theme-bg text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all hover:opacity-90 active:scale-95"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Add Task</span>
      </button>
    </div>

    <!-- Kanban Columns Grid -->
    <div class="flex items-start space-x-5 min-w-max pb-6">
      <div
        v-for="col in columns"
        :key="col.status"
        @dragover.prevent
        @drop="handleDrop($event, col.status)"
        class="w-72 sm:w-80 bg-slate-100 dark:bg-[#1e2023] rounded-2xl p-3 border border-slate-200/80 dark:border-[#2F3136] flex flex-col max-h-[calc(100vh-180px)] shadow-sm"
      >
        <!-- Column Header -->
        <div class="flex items-center justify-between px-2 py-1.5 mb-2">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: col.color }"></span>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {{ col.label }}
            </span>
            <span class="text-[11px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.2 rounded-full">
              {{ getColumnTasks(col.status).length }}
            </span>
          </div>

          <button
            v-if="authStore.isSuperAdmin || authStore.isManager"
            @click="openQuickCreate(col.status)"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Quick add to this column"
          >
            <Plus class="w-4 h-4" />
          </button>
        </div>

        <!-- Cards List -->
        <div class="flex-1 overflow-y-auto space-y-3 p-1">
          <div
            v-for="task in getColumnTasks(col.status)"
            :key="task._id || task.id"
            draggable="true"
            @dragstart="handleDragStart($event, task)"
            @click="taskStore.openTaskModal(task)"
            class="bg-white dark:bg-[#25282c] p-3.5 rounded-2xl border border-slate-200 dark:border-[#2F3136] shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all space-y-2.5 group hover:border-[var(--theme-primary)]"
          >
            <!-- Card Top: List tag & Priority -->
            <div class="flex items-center justify-between">
              <span
                v-if="task.list?.name"
                class="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded truncate max-w-[150px]"
              >
                {{ task.list.name }}
              </span>
              <span v-else></span>

              <span
                :class="[
                  'text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider',
                  getPriorityBadgeClass(task.priority)
                ]"
              >
                {{ task.priority }}
              </span>
            </div>

            <!-- Card Title & Description snippet -->
            <div>
              <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:underline">
                {{ task.title }}
              </h4>
              <p
                v-if="task.description"
                class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed"
              >
                {{ task.description }}
              </p>
            </div>

            <!-- Subtask progress bar -->
            <div v-if="task.subtasks && task.subtasks.length > 0" class="space-y-1">
              <div class="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Subtasks</span>
                <span>{{ task.subtasks.filter(s => s.completed).length }}/{{ task.subtasks.length }}</span>
              </div>
              <div class="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  class="h-full theme-bg rounded-full transition-all"
                  :style="{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }"
                ></div>
              </div>
            </div>

            <!-- Card Footer: Due Date & Assignees -->
            <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-[#2F3136]">
              <div
                v-if="task.dueDate"
                :class="[
                  'text-[10px] font-semibold flex items-center space-x-1 px-1.5 py-0.5 rounded',
                  isOverdue(task)
                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    : 'text-slate-500'
                ]"
              >
                <Calendar class="w-3 h-3" />
                <span>{{ formatDateDisplay(task.dueDate) }}</span>
              </div>
              <div v-else class="text-[10px] text-slate-400">No date</div>

              <div class="flex items-center space-x-2">
                <div v-if="task.comment_count > 0" class="flex items-center space-x-1 text-[10px] text-slate-400">
                  <MessageSquare class="w-3 h-3" />
                  <span>{{ task.comment_count }}</span>
                </div>

                <!-- Assignees -->
                <div class="flex items-center -space-x-1">
                  <template v-if="task.assignees && task.assignees.length > 0">
                    <img
                      v-for="a in task.assignees.slice(0, 2)"
                      :key="a._id || a.id"
                      :src="a.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'"
                      :title="a.name"
                      class="w-5 h-5 rounded-full object-cover ring-1 ring-white dark:ring-[#25282c]"
                    />
                  </template>
                  <span v-else class="w-5 h-5 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    <User class="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="getColumnTasks(col.status).length === 0"
            class="py-8 text-center text-xs text-slate-400 italic border-2 border-dashed border-slate-200 dark:border-[#2F3136] rounded-xl"
          >
            Drag cards here
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  Plus, Calendar, MessageSquare, User 
} from 'lucide-vue-next';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { format, isBefore, startOfToday } from 'date-fns';

const taskStore = useTaskStore();
const authStore = useAuthStore();

const columns = [
  { status: 'pending', label: 'Pending', color: '#8B5CF6' },
  { status: 'in_progress', label: 'In Progress', color: '#3B82F6' },
  { status: 'review', label: 'Review', color: '#F59E0B' },
  { status: 'completed', label: 'Complete', color: '#10B981' }
];

function getColumnTasks(status) {
  return taskStore.filteredTasks.filter(t => (t.status || 'pending') === status);
}

function handleDragStart(event, task) {
  event.dataTransfer.setData('text/plain', task._id || task.id);
  event.dataTransfer.effectAllowed = 'move';
}

async function handleDrop(event, targetStatus) {
  const taskId = event.dataTransfer.getData('text/plain');
  if (taskId) {
    await taskStore.updateTask(taskId, { status: targetStatus });
  }
}

function openQuickCreate(status) {
  taskStore.createTaskModalOpen = true;
}

function isOverdue(task) {
  if (!task.dueDate || task.status === 'completed') return false;
  return isBefore(new Date(task.dueDate), startOfToday());
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'MMM d');
  } catch (e) {
    return dateStr;
  }
}

function getPriorityBadgeClass(priority) {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300';
    case 'high':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300';
    case 'normal':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
    case 'low':
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }
}
</script>
