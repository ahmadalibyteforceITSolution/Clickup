<template>
  <div
    v-if="taskStore.taskModalOpen && task"
    class="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-end z-50 animate-fade-in"
    @click.self="taskStore.closeTaskModal()"
  >
    <div class="w-full max-w-3xl bg-white dark:bg-[#202225] h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-[#2F3136] overflow-hidden">
      <!-- Top Action Bar -->
      <div class="h-16 px-6 border-b border-slate-200 dark:border-[#2F3136] flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-[#18191B]/70">
        <div class="flex items-center space-x-3">
          <!-- Status Dropdown -->
          <div class="relative">
            <select
              v-model="statusValue"
              @change="handleStatusChange"
              class="appearance-none font-extrabold text-xs uppercase pl-3 pr-7 py-2 rounded-xl text-white cursor-pointer shadow-md focus:outline-none transition-all"
              :style="{ backgroundColor: getStatusColor(statusValue) }"
            >
              <option value="pending" class="bg-white text-slate-900 dark:bg-[#202225] dark:text-white">⏳ Pending</option>
              <option value="in_progress" class="bg-white text-slate-900 dark:bg-[#202225] dark:text-white">🚀 In Progress</option>
              <option value="review" class="bg-white text-slate-900 dark:bg-[#202225] dark:text-white">🔍 In Review</option>
              <option value="completed" class="bg-white text-slate-900 dark:bg-[#202225] dark:text-white">✅ Completed</option>
            </select>
            <ChevronDown class="w-3.5 h-3.5 text-white absolute right-2.5 top-3 pointer-events-none" />
          </div>

          <!-- Priority Dropdown (Admin only) -->
          <div v-if="authStore.isSuperAdmin || authStore.isManager" class="relative">
            <select
              v-model="priorityValue"
              @change="handlePriorityChange"
              class="appearance-none font-extrabold text-xs uppercase pl-3 pr-7 py-2 rounded-xl border border-slate-200 dark:border-[#2F3136] bg-white dark:bg-[#202225] text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none shadow-xs"
            >
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="normal">🔵 Normal</option>
              <option value="low">⚪ Low</option>
            </select>
            <ChevronDown class="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
          <span v-else class="text-xs font-bold uppercase px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#2F3136] text-slate-600 dark:text-slate-300">
            {{ priorityValue }} Priority
          </span>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Delete Task Button (Super Admin / Manager Only) -->
          <button
            v-if="authStore.isSuperAdmin || authStore.isManager"
            @click="confirmDeleteTask"
            class="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Delete Task"
          >
            <Trash2 class="w-4 h-4" />
          </button>

          <!-- Close Modal -->
          <button
            @click="taskStore.closeTaskModal()"
            class="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#292B2F] transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Main Body Container -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Title Input (Editable by Admin, Read-only for Employee) -->
        <div>
          <input
            v-if="authStore.isSuperAdmin || authStore.isManager"
            v-model="titleValue"
            @blur="saveTaskTitle"
            @keyup.enter="$event.target.blur()"
            type="text"
            class="w-full text-2xl font-black text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-purple-500 pb-1 focus:outline-none transition-colors"
            placeholder="Task title..."
          />
          <h2 v-else class="text-2xl font-black text-slate-900 dark:text-white">
            {{ titleValue }}
          </h2>
        </div>

        <!-- Task Metadata Properties Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-[#18191B] rounded-2xl border border-slate-200/80 dark:border-[#2F3136]">
          <!-- Assignees -->
          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Assignees</span>
            <div class="relative">
              <button
                v-if="authStore.isSuperAdmin || authStore.isManager"
                @click="assigneeDropdownOpen = !assigneeDropdownOpen"
                class="flex items-center space-x-1.5 p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                <div class="flex items-center -space-x-1.5">
                  <template v-if="task.assignees && task.assignees.length > 0">
                    <UserAvatar
                      v-for="a in task.assignees"
                      :key="a._id || a.id"
                      :name="a.name"
                      :avatar="a.avatar"
                      size="xs"
                    />
                  </template>
                  <span v-else class="text-xs text-purple-600 dark:text-purple-400 font-bold">+ Assign Team</span>
                </div>
              </button>

              <div v-else class="flex items-center -space-x-1.5">
                <template v-if="task.assignees && task.assignees.length > 0">
                  <UserAvatar
                    v-for="a in task.assignees"
                    :key="a._id || a.id"
                    :name="a.name"
                    :avatar="a.avatar"
                    size="xs"
                  />
                </template>
                <span v-else class="text-xs text-slate-400">Unassigned</span>
              </div>

              <!-- Assignee Multi-Picker Dropdown -->
              <div
                v-if="assigneeDropdownOpen"
                class="absolute left-0 mt-2 w-64 bg-white dark:bg-[#202225] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2F3136] p-2 z-50 animate-fade-in"
              >
                <p class="text-[11px] font-bold text-slate-400 uppercase px-2 py-1">Assign to Employee</p>
                <div class="max-h-48 overflow-y-auto space-y-0.5">
                  <button
                    v-for="u in authStore.users"
                    :key="u._id || u.id"
                    @click="toggleAssignee(u._id || u.id)"
                    class="w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 text-xs font-semibold"
                  >
                    <div class="flex items-center space-x-2">
                      <UserAvatar :name="u.name" :avatar="u.avatar" size="xs" />
                      <span class="text-slate-800 dark:text-slate-200">{{ u.name }}</span>
                    </div>
                    <Check
                      v-if="isAssigned(u._id || u.id)"
                      class="w-4 h-4 text-purple-600 dark:text-purple-400"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Start Date -->
          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Start Date</span>
            <input
              type="date"
              v-model="startDateValue"
              :disabled="!authStore.isSuperAdmin && !authStore.isManager"
              @change="handleScheduleChange"
              class="w-full text-xs font-semibold bg-white dark:bg-[#202225] border border-slate-200 dark:border-[#2F3136] rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none disabled:opacity-60"
            />
          </div>

          <!-- Due Date -->
          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Due Date</span>
            <input
              type="date"
              v-model="dueDateValue"
              :disabled="!authStore.isSuperAdmin && !authStore.isManager"
              @change="handleScheduleChange"
              class="w-full text-xs font-semibold bg-white dark:bg-[#202225] border border-slate-200 dark:border-[#2F3136] rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none disabled:opacity-60"
            />
          </div>

          <!-- Time Estimate -->
          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Est. Time</span>
            <div class="flex items-center space-x-1">
              <input
                type="number"
                v-model="timeEstimateValue"
                :disabled="!authStore.isSuperAdmin && !authStore.isManager"
                @blur="handleTimeEstimateChange"
                min="0"
                step="30"
                class="w-16 text-xs font-semibold bg-white dark:bg-[#202225] border border-slate-200 dark:border-[#2F3136] rounded-xl px-2 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none disabled:opacity-60"
              />
              <span class="text-xs text-slate-400 font-bold">mins</span>
            </div>
          </div>
        </div>

        <!-- Description Box -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Description & Instructions</label>
          <textarea
            v-if="authStore.isSuperAdmin || authStore.isManager"
            v-model="descriptionValue"
            @blur="saveDescription"
            rows="3"
            class="w-full p-3.5 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none leading-relaxed"
            placeholder="Add detailed task specifications, instructions, or goals..."
          ></textarea>
          <div v-else class="p-3.5 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {{ descriptionValue || 'No description provided.' }}
          </div>
        </div>

        <!-- Subtasks & Checklist Section -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <CheckSquare class="w-4 h-4 text-purple-500" />
              <span>Subtasks & Checklists ({{ completedSubtasksCount }}/{{ (task.subtasks || []).length }})</span>
            </h4>
          </div>

          <!-- Add Subtask Input Form -->
          <form @submit.prevent="handleAddSubtask" class="flex items-center space-x-2">
            <input
              v-model="newSubtaskTitle"
              type="text"
              placeholder="+ Add a subtask checklist item..."
              class="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            <button
              type="submit"
              class="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
            >
              Add
            </button>
          </form>

          <!-- Subtasks List -->
          <div class="space-y-1.5 divide-y divide-slate-100 dark:divide-[#2F3136]">
            <div
              v-for="sub in (task.subtasks || [])"
              :key="sub._id || sub.id"
              class="pt-1.5 flex items-center justify-between group text-xs"
            >
              <div class="flex items-center space-x-2.5 flex-1 min-w-0">
                <input
                  type="checkbox"
                  :checked="sub.completed"
                  @change="handleToggleSubtask(sub)"
                  class="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span
                  :class="[
                    'truncate font-semibold',
                    sub.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                  ]"
                >
                  {{ sub.title }}
                </span>
              </div>

              <button
                @click="handleDeleteSubtask(sub._id || sub.id)"
                class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 transition-opacity"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Comments, Delay/Blocker Reasons & Discussion Thread -->
        <div class="space-y-4 pt-4 border-t border-slate-200 dark:border-[#2F3136]">
          <div class="flex items-center space-x-4 border-b border-slate-100 dark:border-[#2F3136] pb-2">
            <button
              @click="activeTab = 'comments'"
              :class="[
                'text-xs font-bold uppercase tracking-wider pb-1 transition-colors border-b-2',
                activeTab === 'comments'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              ]"
            >
              💬 Discussion & Status Reasons ({{ comments.length }})
            </button>
            <button
              @click="activeTab = 'activity'"
              :class="[
                'text-xs font-bold uppercase tracking-wider pb-1 transition-colors border-b-2',
                activeTab === 'activity'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              ]"
            >
              📜 Activity Audit Log
            </button>
          </div>

          <!-- Comments Tab -->
          <div v-if="activeTab === 'comments'" class="space-y-4">
            <!-- Add Comment Form -->
            <form @submit.prevent="handlePostComment" class="flex items-start space-x-3">
              <UserAvatar
                :name="authStore.currentUser?.name"
                :avatar="authStore.currentUser?.avatar"
                size="sm"
                customClass="mt-1 shrink-0"
              />
              <div class="flex-1 space-y-2">
                <textarea
                  v-model="newCommentText"
                  rows="2"
                  placeholder="Post an update, explain delay reasons, blockers, or completion notes..."
                  class="w-full p-3 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-2xl text-slate-800 dark:text-slate-200 focus:outline-none"
                ></textarea>
                <div class="flex items-center justify-between">
                  <span class="text-[11px] text-slate-400">⚡ Dispatches email alert to team</span>
                  <button
                    type="submit"
                    :disabled="!newCommentText.trim()"
                    class="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors flex items-center space-x-1.5 shadow-sm"
                  >
                    <Send class="w-3.5 h-3.5" />
                    <span>Post Comment</span>
                  </button>
                </div>
              </div>
            </form>

            <!-- Comments Stream -->
            <div class="space-y-3 pt-2">
              <div
                v-for="c in comments"
                :key="c._id || c.id"
                class="p-3.5 bg-slate-50/80 dark:bg-[#18191B]/80 rounded-2xl border border-slate-100 dark:border-[#2F3136] space-y-1.5"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <UserAvatar :name="c.user_name || c.user?.name" :avatar="c.user_avatar || c.user?.avatar" size="xs" />
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200">{{ c.user_name || c.user?.name }}</span>
                    <span class="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 uppercase px-2 py-0.5 rounded-full font-extrabold">
                      {{ c.user_role || c.user?.role }}
                    </span>
                  </div>
                  <span class="text-[10px] text-slate-400">{{ formatTime(c.createdAt || c.created_at) }}</span>
                </div>
                <p class="text-xs text-slate-700 dark:text-slate-300 pl-7 leading-relaxed whitespace-pre-wrap">{{ c.content }}</p>
              </div>

              <div v-if="comments.length === 0" class="py-6 text-center text-xs text-slate-400 italic">
                No discussion comments yet. Add a comment above to give status updates or explain blockers.
              </div>
            </div>
          </div>

          <!-- Activity Audit Log Tab -->
          <div v-else-if="activeTab === 'activity'" class="space-y-2">
            <div
              v-for="act in activityLogs"
              :key="act._id || act.id"
              class="p-3 text-xs rounded-xl bg-slate-50 dark:bg-[#18191B] border border-slate-100 dark:border-[#2F3136] flex items-center justify-between"
            >
              <div class="flex items-center space-x-2.5">
                <span class="w-2 h-2 rounded-full bg-purple-500"></span>
                <span class="text-slate-800 dark:text-slate-200 font-semibold">{{ act.details }}</span>
              </div>
              <span class="text-[10px] text-slate-400">{{ formatTime(act.created_at || act.createdAt) }}</span>
            </div>
            <div v-if="activityLogs.length === 0" class="py-6 text-center text-xs text-slate-400 italic">
              No activity logs recorded yet.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { 
  X, ChevronDown, Trash2, Check, CheckSquare, Send 
} from 'lucide-vue-next';
import UserAvatar from '@/components/common/UserAvatar.vue';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const taskStore = useTaskStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const task = computed(() => taskStore.activeTask);

const titleValue = ref('');
const descriptionValue = ref('');
const statusValue = ref('pending');
const priorityValue = ref('normal');
const startDateValue = ref('');
const dueDateValue = ref('');
const timeEstimateValue = ref(0);

const assigneeDropdownOpen = ref(false);
const activeTab = ref('comments');
const newSubtaskTitle = ref('');
const newCommentText = ref('');
const comments = ref([]);
const activityLogs = ref([]);

watch(() => taskStore.activeTask, (t) => {
  if (t) {
    titleValue.value = t.title || '';
    descriptionValue.value = t.description || '';
    statusValue.value = t.status || 'pending';
    priorityValue.value = t.priority || 'normal';
    startDateValue.value = t.startDate || t.start_date || '';
    dueDateValue.value = t.dueDate || t.due_date || '';
    timeEstimateValue.value = t.timeEstimate || t.time_estimate || 0;
    fetchComments();
    fetchActivity();
  }
}, { immediate: true });

const completedSubtasksCount = computed(() => {
  if (!task.value?.subtasks) return 0;
  return task.value.subtasks.filter(s => s.completed).length;
});

async function fetchComments() {
  if (!task.value) return;
  try {
    const res = await axios.get(`/api/comments/tasks/${task.value._id || task.value.id}`);
    comments.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    comments.value = [];
  }
}

async function fetchActivity() {
  if (!task.value) return;
  try {
    const res = await axios.get(`/api/analytics/activity`, { params: { task_id: task.value._id || task.value.id } });
    activityLogs.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    activityLogs.value = [];
  }
}

async function saveTaskTitle() {
  if (titleValue.value.trim() && titleValue.value !== task.value.title) {
    await taskStore.updateTask(task.value._id || task.value.id, {
      title: titleValue.value.trim(),
      updated_by: authStore.currentUser?._id || authStore.currentUser?.id
    });
  }
}

async function saveDescription() {
  await taskStore.updateTask(task.value._id || task.value.id, {
    description: descriptionValue.value,
    updated_by: authStore.currentUser?._id || authStore.currentUser?.id
  });
}

async function handleStatusChange() {
  await taskStore.updateTask(task.value._id || task.value.id, {
    status: statusValue.value,
    updated_by: authStore.currentUser?._id || authStore.currentUser?.id
  });
  fetchActivity();
}

async function handlePriorityChange() {
  await taskStore.updateTask(task.value._id || task.value.id, {
    priority: priorityValue.value,
    updated_by: authStore.currentUser?._id || authStore.currentUser?.id
  });
  fetchActivity();
}

async function handleScheduleChange() {
  await taskStore.updateTask(task.value._id || task.value.id, {
    start_date: startDateValue.value || null,
    due_date: dueDateValue.value || null,
    updated_by: authStore.currentUser?._id || authStore.currentUser?.id
  });
  fetchActivity();
}

async function handleTimeEstimateChange() {
  await taskStore.updateTask(task.value._id || task.value.id, {
    time_estimate: parseInt(timeEstimateValue.value, 10) || 0,
    updated_by: authStore.currentUser?._id || authStore.currentUser?.id
  });
}

function isAssigned(userId) {
  return (task.value?.assignees || []).some(a => (a._id || a.id) === userId);
}

async function toggleAssignee(userId) {
  const currentIds = (task.value?.assignees || []).map(a => a._id || a.id);
  let newIds = [];
  if (currentIds.includes(userId)) {
    newIds = currentIds.filter(id => id !== userId);
  } else {
    newIds = [...currentIds, userId];
  }

  await taskStore.updateTask(task.value._id || task.value.id, {
    assignee_ids: newIds,
    updated_by: authStore.currentUser?._id || authStore.currentUser?.id
  });
  fetchActivity();
}

async function handleAddSubtask() {
  if (!newSubtaskTitle.value.trim()) return;
  try {
    await axios.post(`/api/subtasks/task/${task.value._id || task.value.id}`, {
      title: newSubtaskTitle.value.trim(),
      user_id: authStore.currentUser?._id || authStore.currentUser?.id
    });
    uiStore.success('Subtask added');
    newSubtaskTitle.value = '';
    taskStore.fetchTaskDetails(task.value._id || task.value.id);
  } catch (err) {
    uiStore.error('Failed to add subtask: ' + err.message);
  }
}

async function handleToggleSubtask(sub) {
  try {
    await axios.put(`/api/subtasks/${sub._id || sub.id}`, {
      completed: !sub.completed,
      user_id: authStore.currentUser?._id || authStore.currentUser?.id
    });
    taskStore.fetchTaskDetails(task.value._id || task.value.id);
  } catch (err) {
    uiStore.error('Failed to toggle subtask: ' + err.message);
  }
}

async function handleDeleteSubtask(subId) {
  try {
    await axios.delete(`/api/subtasks/${subId}`);
    uiStore.info('Subtask deleted');
    taskStore.fetchTaskDetails(task.value._id || task.value.id);
  } catch (err) {
    uiStore.error('Failed to delete subtask');
  }
}

async function handlePostComment() {
  if (!newCommentText.value.trim()) return;
  try {
    await axios.post(`/api/comments/tasks/${task.value._id || task.value.id}`, {
      content: newCommentText.value.trim(),
      user_id: authStore.currentUser?._id || authStore.currentUser?.id
    });
    uiStore.success('Comment posted and team notified via email');
    newCommentText.value = '';
    await fetchComments();
    await fetchActivity();
  } catch (err) {
    uiStore.error('Failed to post comment: ' + err.message);
  }
}

async function confirmDeleteTask() {
  const confirmed = await uiStore.confirm({
    title: 'Delete Task',
    message: `Are you sure you want to permanently delete task "${task.value.title}"?`,
    confirmText: 'Delete Task',
    isDanger: true
  });

  if (confirmed) {
    try {
      await taskStore.deleteTask(task.value._id || task.value.id);
      uiStore.success(`Task "${task.value?.title || 'Task'}" deleted`);
      taskStore.closeTaskModal();
    } catch (err) {
      uiStore.error('Failed to delete task: ' + err.message);
    }
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

function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch (e) {
    return dateStr;
  }
}
</script>
