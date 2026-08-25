<template>
  <div
    v-if="taskStore.taskModalOpen && task"
    class="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end z-50 animate-fade-in"
    @click.self="taskStore.closeTaskModal()"
  >
    <div class="w-full max-w-3xl bg-white dark:bg-[#202225] h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-[#2F3136] overflow-hidden">
      <!-- Top Action Bar -->
      <div class="h-14 px-6 border-b border-slate-200 dark:border-[#2F3136] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#18191B]/50">
        <div class="flex items-center space-x-2">
          <!-- Status Dropdown -->
          <div class="relative">
            <select
              v-model="statusValue"
              @change="handleStatusChange"
              class="appearance-none font-bold text-xs uppercase pl-3 pr-7 py-1.5 rounded-lg border text-white cursor-pointer shadow-xs focus:outline-none"
              :style="{ backgroundColor: getStatusColor(statusValue) }"
            >
              <option value="pending" class="bg-white text-slate-900 dark:bg-[#202225] dark:text-white">Pending</option>
              <option value="in_progress" class="bg-white text-slate-900 dark:bg-[#202225] dark:text-white">In Progress</option>
              <option value="review" class="bg-white text-slate-900 dark:bg-[#202225] dark:text-white">Review</option>
              <option value="completed" class="bg-white text-slate-900 dark:bg-[#202225] dark:text-white">Completed</option>
            </select>
            <ChevronDown class="w-3.5 h-3.5 text-white absolute right-2 top-2.5 pointer-events-none" />
          </div>

          <!-- Priority Dropdown -->
          <div class="relative">
            <select
              v-model="priorityValue"
              @change="handlePriorityChange"
              class="appearance-none font-bold text-xs uppercase pl-3 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-[#2F3136] bg-white dark:bg-[#202225] text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none"
            >
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="normal">🔵 Normal</option>
              <option value="low">⚪ Low</option>
            </select>
            <ChevronDown class="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Delete Task Button -->
          <button
            v-if="authStore.isManager"
            @click="confirmDeleteTask"
            class="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Delete Task"
          >
            <Trash2 class="w-4 h-4" />
          </button>

          <!-- Close Modal -->
          <button
            @click="taskStore.closeTaskModal()"
            class="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#292B2F] transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Main Body Container with Two Panes / Tabs -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Title Input -->
        <div>
          <input
            v-model="titleValue"
            @blur="saveTaskTitle"
            @keyup.enter="$event.target.blur()"
            type="text"
            class="w-full text-xl font-black text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-purple-500 pb-1 focus:outline-none transition-colors"
            placeholder="Task title..."
          />
        </div>

        <!-- Task Metadata Properties Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-[#18191B] rounded-xl border border-slate-200/80 dark:border-[#2F3136]">
          <!-- Assignees -->
          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Assignees</span>
            <div class="relative">
              <button
                @click="assigneeDropdownOpen = !assigneeDropdownOpen"
                class="flex items-center space-x-1.5 p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                <div class="flex items-center -space-x-1">
                  <template v-if="task.assignees && task.assignees.length > 0">
                    <img
                      v-for="a in task.assignees"
                      :key="a._id || a.id"
                      :src="a.avatar"
                      :title="a.name"
                      class="w-6 h-6 rounded-full object-cover ring-2 ring-white dark:ring-[#18191B]"
                    />
                  </template>
                  <span v-else class="text-xs text-slate-500 font-medium">+ Assign Team</span>
                </div>
              </button>

              <!-- Assignee Multi-Picker Dropdown -->
              <div
                v-if="assigneeDropdownOpen"
                class="absolute left-0 mt-2 w-64 bg-white dark:bg-[#202225] rounded-xl shadow-2xl border border-slate-200 dark:border-[#2F3136] p-2 z-50 animate-fade-in"
              >
                <p class="text-[11px] font-bold text-slate-400 uppercase px-2 py-1">Assign to Employee</p>
                <div class="max-h-48 overflow-y-auto space-y-0.5">
                  <button
                    v-for="u in authStore.users"
                    :key="u._id || u.id"
                    @click="toggleAssignee(u._id || u.id)"
                    class="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-purple-50 dark:hover:bg-purple-950/30 text-xs font-semibold"
                  >
                    <div class="flex items-center space-x-2">
                      <img :src="u.avatar" class="w-5 h-5 rounded-full object-cover" />
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
              @change="handleScheduleChange"
              class="w-full text-xs font-semibold bg-white dark:bg-[#202225] border border-slate-200 dark:border-[#2F3136] rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <!-- Due Date -->
          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Due Date</span>
            <input
              type="date"
              v-model="dueDateValue"
              @change="handleScheduleChange"
              class="w-full text-xs font-semibold bg-white dark:bg-[#202225] border border-slate-200 dark:border-[#2F3136] rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <!-- Time Estimate -->
          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Est. Time</span>
            <div class="flex items-center space-x-1">
              <input
                type="number"
                v-model="timeEstimateValue"
                @blur="handleTimeEstimateChange"
                min="0"
                step="30"
                class="w-16 text-xs font-semibold bg-white dark:bg-[#202225] border border-slate-200 dark:border-[#2F3136] rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none"
              />
              <span class="text-xs text-slate-400">mins</span>
            </div>
          </div>
        </div>

        <!-- Description Box -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Description</label>
          <textarea
            v-model="descriptionValue"
            @blur="saveDescription"
            rows="3"
            class="w-full p-3 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none leading-relaxed"
            placeholder="Add detailed task specifications, instructions, or goals..."
          ></textarea>
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
              class="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            <button
              type="submit"
              class="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
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
                    'truncate font-medium',
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

        <!-- Attachments & Files Section -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Paperclip class="w-4 h-4 text-purple-500" />
              <span>Attachments ({{ attachments.length }})</span>
            </h4>

            <label class="cursor-pointer text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center space-x-1">
              <Upload class="w-3.5 h-3.5" />
              <span>Upload File</span>
              <input type="file" @change="handleFileUpload" class="hidden" />
            </label>
          </div>

          <div v-if="attachments.length > 0" class="grid grid-cols-2 gap-2">
            <div
              v-for="file in attachments"
              :key="file._id || file.id"
              class="p-2.5 rounded-lg bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] flex items-center justify-between text-xs"
            >
              <div class="flex items-center space-x-2 truncate">
                <FileText class="w-4 h-4 text-purple-500 shrink-0" />
                <span class="truncate font-semibold text-slate-800 dark:text-slate-200">{{ file.originalName || file.filename }}</span>
              </div>
              <a
                :href="file.filePath"
                target="_blank"
                class="text-slate-400 hover:text-purple-600 p-1"
                title="Download file"
              >
                <ExternalLink class="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <!-- Comments & Activity Timeline -->
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
              Comments & Discussion ({{ comments.length }})
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
              Activity Audit Trail
            </button>
          </div>

          <!-- Comments Tab -->
          <div v-if="activeTab === 'comments'" class="space-y-4">
            <!-- Add Comment Form -->
            <form @submit.prevent="handlePostComment" class="flex items-start space-x-3">
              <img
                :src="authStore.currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'"
                class="w-7 h-7 rounded-full object-cover shrink-0 mt-1"
              />
              <div class="flex-1 space-y-2">
                <textarea
                  v-model="newCommentText"
                  rows="2"
                  placeholder="Write a comment... (triggers email notification to assignees)"
                  class="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                ></textarea>
                <div class="flex justify-end">
                  <button
                    type="submit"
                    :disabled="!newCommentText.trim()"
                    class="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5"
                  >
                    <Send class="w-3.5 h-3.5" />
                    <span>Send Comment</span>
                  </button>
                </div>
              </div>
            </form>

            <!-- Comments Stream -->
            <div class="space-y-3 pt-2">
              <div
                v-for="c in comments"
                :key="c._id || c.id"
                class="p-3 bg-slate-50/70 dark:bg-[#18191B]/70 rounded-xl border border-slate-100 dark:border-[#2F3136] space-y-1"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <img :src="c.user_avatar || c.user?.avatar" class="w-5 h-5 rounded-full object-cover" />
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200">{{ c.user_name || c.user?.name }}</span>
                    <span class="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase px-1.5 rounded font-bold">
                      {{ c.user_role || c.user?.role }}
                    </span>
                  </div>
                  <span class="text-[10px] text-slate-400">{{ formatTime(c.createdAt || c.created_at) }}</span>
                </div>
                <p class="text-xs text-slate-700 dark:text-slate-300 pl-7 leading-relaxed whitespace-pre-wrap">{{ c.content }}</p>
              </div>
            </div>
          </div>

          <!-- Activity Audit Trail Tab -->
          <div v-else-if="activeTab === 'activity'" class="space-y-2">
            <div
              v-for="act in activityLogs"
              :key="act._id || act.id"
              class="p-2.5 text-xs rounded-lg bg-slate-50 dark:bg-[#18191B] border border-slate-100 dark:border-[#2F3136] flex items-center justify-between"
            >
              <div class="flex items-center space-x-2">
                <span class="w-2 h-2 rounded-full bg-purple-500"></span>
                <span class="text-slate-800 dark:text-slate-200 font-medium">{{ act.details }}</span>
              </div>
              <span class="text-[10px] text-slate-400">{{ formatTime(act.created_at || act.createdAt) }}</span>
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
  X, ChevronDown, Trash2, Check, CheckSquare, Paperclip, Upload, FileText, ExternalLink, Send 
} from 'lucide-vue-next';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const taskStore = useTaskStore();
const authStore = useAuthStore();

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
const attachments = ref([]);
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
    fetchAttachments();
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
    const res = await axios.get(`/api/comments/task/${task.value._id || task.value.id}`);
    comments.value = res.data;
  } catch (e) {}
}

async function fetchAttachments() {
  if (!task.value) return;
  try {
    const res = await axios.get(`/api/attachments/task/${task.value._id || task.value.id}`);
    attachments.value = res.data;
  } catch (e) {}
}

async function fetchActivity() {
  if (!task.value) return;
  try {
    const res = await axios.get(`/api/analytics/activity`, { params: { task_id: task.value._id || task.value.id } });
    activityLogs.value = res.data;
  } catch (e) {}
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
    newSubtaskTitle.value = '';
    taskStore.fetchTaskDetails(task.value._id || task.value.id);
  } catch (err) {
    alert('Failed to add subtask: ' + err.message);
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
    alert('Failed to toggle subtask: ' + err.message);
  }
}

async function handleDeleteSubtask(subId) {
  try {
    await axios.delete(`/api/subtasks/${subId}`);
    taskStore.fetchTaskDetails(task.value._id || task.value.id);
  } catch (err) {
    alert('Failed to delete subtask');
  }
}

async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', authStore.currentUser?._id || authStore.currentUser?.id || '');

  try {
    await axios.post(`/api/attachments/task/${task.value._id || task.value.id}`, formData);
    fetchAttachments();
  } catch (err) {
    alert('Upload failed: ' + err.message);
  }
}

async function handlePostComment() {
  if (!newCommentText.value.trim()) return;
  try {
    await axios.post(`/api/comments/task/${task.value._id || task.value.id}`, {
      content: newCommentText.value.trim(),
      user_id: authStore.currentUser?._id || authStore.currentUser?.id
    });
    newCommentText.value = '';
    fetchComments();
    fetchActivity();
  } catch (err) {
    alert('Failed to post comment: ' + err.message);
  }
}

async function confirmDeleteTask() {
  if (confirm(`Are you sure you want to delete task "${task.value.title}"?`)) {
    await taskStore.deleteTask(task.value._id || task.value.id);
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
