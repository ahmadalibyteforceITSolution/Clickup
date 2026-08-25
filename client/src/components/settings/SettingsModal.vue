<template>
  <div
    v-if="taskStore.settingsModalOpen"
    class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
    @click.self="taskStore.settingsModalOpen = false"
  >
    <div class="bg-white dark:bg-[#202225] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2F3136] w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-200 dark:border-[#2F3136] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#18191B]/50">
        <div class="flex items-center space-x-2">
          <Settings class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 class="text-base font-extrabold text-slate-900 dark:text-white">ClickUp Settings & Management</h3>
        </div>
        <button
          @click="taskStore.settingsModalOpen = false"
          class="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Settings Nav Tabs -->
      <div class="flex items-center space-x-4 px-6 pt-3 border-b border-slate-200 dark:border-[#2F3136] bg-slate-50/30 dark:bg-[#18191B]/30 shrink-0">
        <button
          @click="activeTab = 'team'"
          :class="[
            'text-xs font-bold uppercase tracking-wider pb-3 border-b-2 transition-colors',
            activeTab === 'team'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          ]"
        >
          Team & Employees ({{ authStore.users.length }})
        </button>
        <button
          @click="activeTab = 'smtp'"
          :class="[
            'text-xs font-bold uppercase tracking-wider pb-3 border-b-2 transition-colors',
            activeTab === 'smtp'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          ]"
        >
          Email & SMTP Server Config
        </button>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Team & Employees Tab -->
        <div v-if="activeTab === 'team'" class="space-y-6">
          <!-- Add New Employee Form (Super Admin) -->
          <div v-if="authStore.isSuperAdmin" class="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-[#2F3136] space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center space-x-1.5">
              <UserPlus class="w-4 h-4" />
              <span>Add New Company Member</span>
            </h4>

            <form @submit.prevent="handleCreateUser" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name *</label>
                <input
                  v-model="newUser.name"
                  type="text"
                  required
                  placeholder="e.g. Rachel Green"
                  class="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#202225] border border-slate-200 dark:border-[#2F3136] rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email Address *</label>
                <input
                  v-model="newUser.email"
                  type="email"
                  required
                  placeholder="rachel@company.com"
                  class="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#202225] border border-slate-200 dark:border-[#2F3136] rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Role</label>
                <select
                  v-model="newUser.role"
                  class="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#202225] border border-slate-200 dark:border-[#2F3136] rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div class="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  class="bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Team Member
                </button>
              </div>
            </form>
          </div>

          <!-- Existing Team Members List -->
          <div class="divide-y divide-slate-100 dark:divide-[#2F3136]">
            <div
              v-for="u in authStore.users"
              :key="u._id || u.id"
              class="py-3 flex items-center justify-between"
            >
              <div class="flex items-center space-x-3">
                <img :src="u.avatar" class="w-9 h-9 rounded-full object-cover" />
                <div>
                  <p class="text-xs font-bold text-slate-900 dark:text-white">{{ u.name }}</p>
                  <p class="text-[11px] text-slate-500">{{ u.email }} • {{ u.job_title || u.department }}</p>
                </div>
              </div>

              <span
                :class="[
                  'text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider',
                  u.role === 'super_admin' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                  u.role === 'manager' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                ]"
              >
                {{ u.role.replace('_', ' ') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Email & SMTP Config Tab -->
        <div v-else-if="activeTab === 'smtp'" class="space-y-4 max-w-xl">
          <div class="p-4 bg-slate-50 dark:bg-[#18191B] rounded-xl border border-slate-200 dark:border-[#2F3136] text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p class="font-bold text-slate-800 dark:text-slate-200">ℹ️ SMTP Delivery Status</p>
            <p>Emails are logged automatically to MongoDB Outbox with responsive HTML templates. You can provide custom SMTP credentials (e.g. SendGrid, Mailgun, AWS SES, Gmail) below to deliver emails to real inboxes.</p>
          </div>

          <form @submit.prevent="handleSaveSmtp" class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">SMTP Host</label>
              <input
                v-model="smtpForm.smtp_host"
                type="text"
                placeholder="smtp.mailgun.org or smtp.gmail.com"
                class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">SMTP Port</label>
                <input
                  v-model="smtpForm.smtp_port"
                  type="text"
                  placeholder="587"
                  class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">From Address</label>
                <input
                  v-model="smtpForm.from_email"
                  type="email"
                  placeholder="notifications@clickup.app"
                  class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">SMTP Username / API User</label>
              <input
                v-model="smtpForm.smtp_user"
                type="text"
                placeholder="postmaster@domain.com"
                class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">SMTP Password / API Key</label>
              <input
                v-model="smtpForm.smtp_pass"
                type="password"
                placeholder="••••••••••••••••"
                class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div class="pt-2 flex justify-end">
              <button
                type="submit"
                class="bg-purple-600 text-white font-bold text-xs px-5 py-2 rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Settings, X, UserPlus } from 'lucide-vue-next';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

const taskStore = useTaskStore();
const authStore = useAuthStore();
const notifStore = useNotificationStore();

const activeTab = ref('team');

const newUser = reactive({
  name: '',
  email: '',
  role: 'employee',
  department: 'Engineering'
});

const smtpForm = reactive({
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  smtp_pass: '',
  from_email: 'notifications@clickup.app'
});

onMounted(async () => {
  await notifStore.fetchSmtpSettings();
  Object.assign(smtpForm, notifStore.smtpSettings);
});

async function handleCreateUser() {
  if (!newUser.name || !newUser.email) return;
  try {
    await authStore.createUser(newUser);
    newUser.name = '';
    newUser.email = '';
    alert('User created successfully!');
  } catch (err) {
    alert('Failed to create user: ' + err.message);
  }
}

async function handleSaveSmtp() {
  try {
    await notifStore.saveSmtpSettings(smtpForm);
    alert('SMTP settings saved successfully!');
  } catch (err) {
    alert('Failed to save settings: ' + err.message);
  }
}
</script>
