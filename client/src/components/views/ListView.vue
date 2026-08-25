<template>
  <div class="h-full overflow-y-auto p-4 md:p-6 space-y-6">
    <!-- Header Bar with Filter Pills -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-[#2F3136]">
      <div>
        <h1 class="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
          <span>{{ currentHeaderTitle }}</span>
          <span class="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full">
            {{ taskStore.filteredTasks.length }} tasks
          </span>
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">Click any task to view full discussion, assignees, subtasks, and files</p>
      </div>

      <!-- Priority Filter Pills -->
      <div class="flex items-center space-x-1.5 bg-slate-100 dark:bg-[#18191B] p-1 rounded-lg border border-slate-200 dark:border-[#2F3136]">
        <button
          @click="taskStore.priorityFilter = null; taskStore.fetchTasks()"
          :class="[
            'px-2.5 py-1 rounded text-xs font-semibold transition-all',
            !taskStore.priorityFilter ? 'bg-white dark:bg-[#202225] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
          ]"
        >
          All
        </button>
        <button
          v-for="p in ['urgent', 'high', 'normal', 'low']"
          :key="p"
          @click="taskStore.priorityFilter = p; taskStore.fetchTasks()"
          :class="[
            'px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all',
            taskStore.priorityFilter === p ? 'bg-white dark:bg-[#202225] shadow-sm font-bold ' + getPriorityTextColor(p) : 'text-slate-500 hover:text-slate-700'
          ]"
        >
          {{ p }}
        </button>
      </div>
    </div>

    <!-- Status Groups -->
    <div class="space-y-6">
      <div
        v-for="group in statusGroups"
        :key="group.status"
        class="bg-white dark:bg-[#202225] rounded-xl border border-slate-200 dark:border-[#2F3136] shadow-sm overflow-hidden"
      >
        <!-- Group Header -->
        <div
          class="px-4 py-3 border-b border-slate-100 dark:border-[#2F3136] flex items-center justify-between cursor-pointer select-none bg-slate-50/50 dark:bg-slate-900/30"
          @click="toggleCollapse(group.status)"
        >
          <div class="flex items-center space-x-2.5">
            <ChevronDown
              class="w-4 h-4 text-slate-400 transition-transform duration-200"
              :class="{ '-rotate-90': collapsedGroups[group.status] }"
            />
            <span
              class="w-3 h-3 rounded-full shrink-0"
              :style="{ backgroundColor: group.color }"
            ></span>
            <h3 class="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {{ group.label }}
            </h3>
            <span class="text-xs bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full">
              {{ getGroupTasks(group.status).length }}
            </span>
          </div>

          <button
            @click.stop="quickAddTask(group.status)"
            class="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold flex items-center space-x-1 p-1 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded transition-colors"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>

        <!-- Task Rows Table -->
        <div v-show="!collapsedGroups[group.status]" class="divide-y divide-slate-100 dark:divide-[#2F3136]">
          <div
            v-for="task in getGroupTasks(group.status)"
            :key="task._id || task.id"
            @click="taskStore.openTaskModal(task)"
            class="px-4 py-3 hover:bg-purple-50/30 dark:hover:bg-[#292B2F] cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors group"
          >
            <!-- Left: Checkbox, Title & Subtasks info -->
            <div class="flex items-center space-x-3 min-w-0 flex-1">
              <!-- Quick Status Checkbox -->
              <button
                @click.stop="toggleTaskCompleted(task)"
                :class="[
                  'w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0',
                  task.status === 'completed'
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-slate-300 dark:border-slate-600 hover:border-purple-500'
                ]"
              >
                <Check v-if="task.status === 'completed'" class="w-3.5 h-3.5 stroke-[3]" />
              </button>

              <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-2">
                  <p
                    :class="[
                      'text-xs md:text-sm font-semibold truncate',
                      task.status === 'completed'
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                    ]"
                  >
                    {{ task.title }}
                  </p>

                  <span
                    v-if="task.list?.name"
                    class="hidden sm:inline text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium px-2 py-0.5 rounded truncate max-w-[140px]"
                  >
                    {{ task.list.name }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Right: Priority, Dates, Assignees, Badges -->
            <div class="flex items-center space-x-3 shrink-0 self-end md:self-center">
              <!-- Subtask count badge -->
              <div
                v-if="task.subtasks && task.subtasks.length > 0"
                class="flex items-center space-x-1 text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded"
                title="Subtasks progress"
              >
                <CheckSquare class="w-3 h-3 text-slate-500" />
                <span>{{ task.subtasks.filter(s => s.completed).length }}/{{ task.subtasks.length }}</span>
              </div>

              <!-- Comments count -->
              <div
                v-if="task.comment_count > 0"
                class="flex items-center space-x-1 text-[11px] text-slate-400"
              >
                <MessageSquare class="w-3 h-3" />
                <span>{{ task.comment_count }}</span>
              </div>

              <!-- Due Date Badge -->
              <div
                v-if="task.dueDate"
                :class="[
                  'text-[11px] font-semibold px-2 py-0.5 rounded flex items-center space-x-1',
                  isOverdue(task)
                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                ]"
              >
                <Calendar class="w-3 h-3" />
                <span>{{ formatDateDisplay(task.dueDate) }}</span>
              </div>

              <!-- Priority Badge -->
              <span
                :class="[
                  'text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider',
                  getPriorityBadgeClass(task.priority)
                ]"
              >
                {{ task.priority }}
              </span>

              <!-- Assignee Avatars Stack -->
              <div class="flex items-center -space-x-1.5">
                <template v-if="task.assignees && task.assignees.length > 0">
                  <img
                    v-for="a in task.assignees.slice(0, 3)"
                    :key="a._id || a.id"
                    :src="a.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'"
                    :title="a.name + ' (' + (a.role || 'employee') + ')'"
                    class="w-6 h-6 rounded-full object-cover ring-2 ring-white dark:ring-[#202225]"
                  />
                  <span
                    v-if="task.assignees.length > 3"
                    class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center ring-2 ring-white dark:ring-[#202225]"
                  >
                    +{{ task.assignees.length - 3 }}
                  </span>
                </template>
                <span
                  v-else
                  class="w-6 h-6 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400"
                  title="Unassigned"
                >
                  <User class="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          <!-- Empty Group State -->
          <div
            v-if="getGroupTasks(group.status).length === 0"
            class="py-6 text-center text-xs text-slate-400 italic"
          >
            No tasks in {{ group.label.toLowerCase() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { 
  ChevronDown, Plus, Check, CheckSquare, MessageSquare, Calendar, User 
} from 'lucide-vue-next';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { format, isBefore, startOfToday } from 'date-fns';

const taskStore = useTaskStore();
const authStore = useAuthStore();

const statusGroups = [
  { status: 'pending', label: 'Pending', color: '#8B5CF6' },
  { status: 'in_progress', label: 'In Progress', color: '#3B82F6' },
  { status: 'review', label: 'Review', color: '#F59E0B' },
  { status: 'completed', label: 'Complete', color: '#10B981' }
];

const collapsedGroups = reactive({
  pending: false,
  in_progress: false,
  review: false,
  completed: false
});

const currentHeaderTitle = computed(() => {
  if (taskStore.selectedListId) {
    const list = taskStore.allLists.find(l => (l._id || l.id) === taskStore.selectedListId);
    return list ? list.name : 'List Tasks';
  }
  if (taskStore.selectedSpaceId) {
    const space = taskStore.spaces.find(s => (s._id || s.id) === taskStore.selectedSpaceId);
    return space ? space.name : 'Space Tasks';
  }
  return 'All Workspace Tasks';
});

function getGroupTasks(status) {
  return taskStore.filteredTasks.filter(t => t.status === status);
}

function toggleCollapse(status) {
  collapsedGroups[status] = !collapsedGroups[status];
}

function quickAddTask(status) {
  taskStore.createTaskModalOpen = true;
}

async function toggleTaskCompleted(task) {
  const newStatus = task.status === 'completed' ? 'pending' : 'completed';
  try {
    await taskStore.updateTask(task._id || task.id, {
      status: newStatus,
      updated_by: authStore.currentUser?._id || authStore.currentUser?.id
    });
  } catch (err) {
    alert('Failed to update task status: ' + err.message);
  }
}

function isOverdue(task) {
  if (!task.dueDate || task.status === 'completed') return false;
  return isBefore(new Date(task.dueDate), startOfToday());
}

function formatDateDisplay(dateStr) {
  try {
    return format(new Date(dateStr), 'MMM d');
  } catch (e) {
    return dateStr;
  }
}

function getPriorityTextColor(p) {
  const map = {
    urgent: 'text-red-600',
    high: 'text-orange-600',
    normal: 'text-blue-600',
    low: 'text-slate-600'
  };
  return map[p] || 'text-slate-600';
}

function getPriorityBadgeClass(p) {
  const map = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    normal: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  };
  return map[p] || 'bg-slate-100 text-slate-600';
}
</script>
