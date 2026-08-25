<template>
  <div
    v-if="taskStore.emailOutboxModalOpen"
    class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
    @click.self="taskStore.emailOutboxModalOpen = false"
  >
    <div class="bg-white dark:bg-[#202225] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2F3136] w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
      <!-- Top Modal Header -->
      <div class="px-6 py-4 border-b border-slate-200 dark:border-[#2F3136] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#18191B]/50">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Mail class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-base font-extrabold text-slate-900 dark:text-white">Email Notification Outbox & Logs</h3>
            <p class="text-xs text-slate-500">Live inspection of all automated transactional HTML emails dispatched by ClickUp</p>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button
            @click="testEmailFormOpen = !testEmailFormOpen"
            class="px-3 py-1.5 text-xs font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 transition-colors flex items-center space-x-1.5"
          >
            <Send class="w-3.5 h-3.5" />
            <span>Send Test Email</span>
          </button>

          <button
            @click="taskStore.emailOutboxModalOpen = false"
            class="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Quick Test Dispatch Drawer (Expandable) -->
      <div v-if="testEmailFormOpen" class="p-4 bg-purple-50/60 dark:bg-purple-950/20 border-b border-purple-100 dark:border-[#2F3136] animate-fade-in">
        <form @submit.prevent="handleSendTestEmail" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">To Email *</label>
            <input
              v-model="testEmailData.toEmail"
              type="email"
              required
              placeholder="employee@company.com"
              class="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#202225] border border-slate-200 dark:border-[#2F3136] rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Recipient Name</label>
            <input
              v-model="testEmailData.toName"
              type="text"
              placeholder="John Doe"
              class="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#202225] border border-slate-200 dark:border-[#2F3136] rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>
          <div class="flex items-end space-x-2">
            <input
              v-model="testEmailData.message"
              type="text"
              placeholder="Custom notification message..."
              class="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-[#202225] border border-slate-200 dark:border-[#2F3136] rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            <button
              type="submit"
              class="bg-purple-600 text-white font-bold text-xs px-4 py-1.5 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      <!-- Main Content: Left List & Right Live HTML Preview -->
      <div class="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        <!-- Left Pane: Outbox Email Log Items -->
        <div class="md:col-span-5 border-r border-slate-200 dark:border-[#2F3136] overflow-y-auto divide-y divide-slate-100 dark:divide-[#2F3136]">
          <div
            v-for="log in notifStore.emailLogs"
            :key="log.id"
            @click="selectEmail(log)"
            :class="[
              'p-4 cursor-pointer transition-colors space-y-1.5',
              selectedLog?.id === log.id
                ? 'bg-purple-50 dark:bg-purple-950/40 border-l-4 border-purple-600'
                : 'hover:bg-slate-50 dark:hover:bg-[#292B2F]'
            ]"
          >
            <div class="flex items-center justify-between">
              <span
                :class="[
                  'text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider',
                  getTriggerBadgeClass(log.trigger_type)
                ]"
              >
                {{ log.trigger_type ? log.trigger_type.replace('_', ' ') : 'EMAIL' }}
              </span>
              <span class="text-[10px] text-slate-400 font-semibold">{{ formatTimestamp(log.sent_at) }}</span>
            </div>

            <p class="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{{ log.subject }}</p>
            <p class="text-[11px] text-slate-500 truncate">To: {{ log.to_name }} &lt;{{ log.to_email }}&gt;</p>
          </div>

          <div v-if="notifStore.emailLogs.length === 0" class="py-12 text-center text-xs text-slate-400">
            No emails dispatched yet. Assign tasks or change status to trigger emails!
          </div>
        </div>

        <!-- Right Pane: Rendered HTML Email Preview -->
        <div class="md:col-span-7 flex flex-col bg-slate-100 dark:bg-[#18191B] overflow-hidden">
          <div v-if="selectedLog" class="flex-1 flex flex-col p-4 overflow-hidden">
            <div class="p-3 bg-white dark:bg-[#202225] rounded-xl border border-slate-200 dark:border-[#2F3136] mb-3 shrink-0 flex items-center justify-between text-xs">
              <div class="truncate">
                <span class="font-bold text-slate-700 dark:text-slate-300">Subject: </span>
                <span class="text-slate-900 dark:text-slate-100">{{ selectedLog.subject }}</span>
              </div>
              <span class="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded uppercase text-[10px]">
                {{ selectedLog.status }}
              </span>
            </div>

            <!-- Iframe Rendering Full Responsive HTML Email -->
            <div class="flex-1 bg-white rounded-xl shadow-inner overflow-hidden border border-slate-200 dark:border-[#2F3136]">
              <iframe
                :srcdoc="selectedLog.body_html"
                class="w-full h-full border-none"
                title="Email Preview"
              ></iframe>
            </div>
          </div>

          <div v-else class="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <Mail class="w-12 h-12 text-slate-300 mb-2" />
            <p class="text-xs font-semibold">Select an email log from the left to view rendered HTML template</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Mail, Send, X } from 'lucide-vue-next';
import { useTaskStore } from '@/stores/taskStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { format } from 'date-fns';

const taskStore = useTaskStore();
const notifStore = useNotificationStore();

const testEmailFormOpen = ref(false);
const selectedLog = ref(null);

const testEmailData = reactive({
  toEmail: 'employee.lead@company.com',
  toName: 'Lead Engineer',
  message: 'This is a test notification from ClickUp task engine.'
});

onMounted(async () => {
  await notifStore.fetchEmailLogs();
  if (notifStore.emailLogs.length > 0) {
    selectedLog.value = notifStore.emailLogs[0];
  }
});

function selectEmail(log) {
  selectedLog.value = log;
}

async function handleSendTestEmail() {
  if (!testEmailData.toEmail) return;
  try {
    await notifStore.sendTestEmail(testEmailData);
    testEmailFormOpen.value = false;
    if (notifStore.emailLogs.length > 0) {
      selectedLog.value = notifStore.emailLogs[0];
    }
  } catch (err) {
    alert('Failed to send test email: ' + err.message);
  }
}

function getTriggerBadgeClass(type) {
  const map = {
    task_assigned: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    task_completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    task_scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    task_comment: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    status_changed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
  };
  return map[type] || 'bg-slate-100 text-slate-700';
}

function formatTimestamp(d) {
  if (!d) return '';
  try {
    return format(new Date(d), 'MMM d, h:mm a');
  } catch (e) {
    return d;
  }
}
</script>
