<template>
  <div
    v-if="taskStore.settingsModalOpen"
    class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
    @click.self="taskStore.settingsModalOpen = false"
  >
    <div class="bg-white dark:bg-[#202225] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#2F3136] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-slate-200 dark:border-[#2F3136] flex items-center justify-between bg-slate-50/70 dark:bg-[#18191B]/70 shrink-0">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white">
            <SlidersHorizontal class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">Workspace Administration</h3>
            <p class="text-[11px] text-slate-500">Manage team members, roles, and automated SMTP notifications</p>
          </div>
        </div>
        <button
          @click="taskStore.settingsModalOpen = false"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Tab Navigation -->
      <div class="flex items-center space-x-4 px-6 border-b border-slate-200 dark:border-[#2F3136] bg-white dark:bg-[#202225] shrink-0">
        <button
          @click="activeTab = 'team'"
          :class="[
            'py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2',
            activeTab === 'team'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          ]"
        >
          <Users class="w-4 h-4" />
          <span>Team & Roles ({{ authStore.users.length }})</span>
        </button>

        <button
          v-if="authStore.isSuperAdmin"
          @click="activeTab = 'smtp'"
          :class="[
            'py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-2',
            activeTab === 'smtp'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          ]"
        >
          <Mail class="w-4 h-4" />
          <span>Custom SMTP Config</span>
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div class="p-6 overflow-y-auto flex-1 space-y-6">
        <!-- Team & Employees Tab -->
        <div v-if="activeTab === 'team'" class="space-y-6">
          <!-- Add New Employee Form (Super Admin) -->
          <div v-if="authStore.isSuperAdmin" class="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-[#2F3136] space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center space-x-1.5">
              <UserPlus class="w-4 h-4" />
              <span>Add New Company Member</span>
            </h4>

            <form @submit.prevent="handleCreateUser" class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name *</label>
                <input
                  v-model="newUser.name"
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  class="w-full px-3 py-2 bg-white dark:bg-[#202225] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email Address *</label>
                <input
                  v-model="newUser.email"
                  type="email"
                  required
                  placeholder="sarah@company.com"
                  class="w-full px-3 py-2 bg-white dark:bg-[#202225] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department Dropdown *</label>
                <select
                  v-model="newUser.department"
                  @change="onNewUserDepartmentChange"
                  class="w-full px-3 py-2 bg-white dark:bg-[#202225] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none font-semibold"
                >
                  <option value="SMM">📱 SMM (Social Media Marketing)</option>
                  <option value="GRAPHICS DESIGNER">🎨 GRAPHICS DESIGNER</option>
                  <option value="SEO">🔍 SEO</option>
                  <option value="WEBSITE DEVELOPER">💻 WEBSITE DEVELOPER</option>
                  <option value="General">🏢 General</option>
                </select>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Role / Permissions</label>
                <select
                  v-model="newUser.role"
                  class="w-full px-3 py-2 bg-white dark:bg-[#202225] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none font-semibold"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div class="sm:col-span-2 flex justify-end pt-1">
                <button
                  type="submit"
                  class="bg-purple-600 text-white font-bold text-xs px-5 py-2 rounded-xl hover:bg-purple-700 shadow-sm transition-colors"
                >
                  + Add Team Member
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
                <UserAvatar :name="u.name" :avatar="u.avatar" size="md" />
                <div>
                  <p class="text-xs font-bold text-slate-900 dark:text-white">{{ u.name }}</p>
                  <p class="text-[11px] text-slate-500">{{ u.email }} • <span class="font-semibold text-purple-600 dark:text-purple-400">{{ u.department || u.job_title || 'General' }}</span></p>
                </div>
              </div>

              <span
                :class="[
                  'text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wider',
                  u.role === 'super_admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' :
                  u.role === 'manager' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                ]"
              >
                {{ u.role === 'super_admin' ? 'Super Admin' : u.role }}
              </span>
            </div>
          </div>
        </div>

        <!-- Email & SMTP Config Tab -->
        <div v-else-if="activeTab === 'smtp'" class="space-y-4 max-w-xl">
          <div class="p-4 bg-slate-50 dark:bg-[#18191B] rounded-2xl border border-slate-200 dark:border-[#2F3136] text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p class="font-bold text-slate-800 dark:text-slate-200">ℹ️ SMTP Delivery Status</p>
            <p>Emails are logged automatically to MongoDB Outbox with responsive HTML templates. You can provide custom SMTP credentials (e.g. SendGrid, Mailgun, AWS SES, Gmail) below to deliver emails to real inboxes.</p>
          </div>

          <form @submit.prevent="handleSaveSmtp" class="space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">SMTP Host</label>
                <input
                  v-model="smtpForm.host"
                  type="text"
                  placeholder="smtp.mailtrap.io"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">SMTP Port</label>
                <input
                  v-model="smtpForm.port"
                  type="number"
                  placeholder="587"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">SMTP Username</label>
                <input
                  v-model="smtpForm.user"
                  type="text"
                  placeholder="username / api_key"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">SMTP Password</label>
                <input
                  v-model="smtpForm.pass"
                  type="password"
                  placeholder="••••••••"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">From Sender Address</label>
              <input
                v-model="smtpForm.from"
                type="email"
                placeholder="notifications@yourdomain.com"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div class="flex justify-end pt-2">
              <button
                type="submit"
                class="bg-purple-600 text-white font-bold text-xs px-5 py-2 rounded-xl hover:bg-purple-700 shadow-md transition-colors"
              >
                Save SMTP Configuration
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
import { 
  SlidersHorizontal, Users, Mail, UserPlus, X 
} from 'lucide-vue-next';
import UserAvatar from '@/components/common/UserAvatar.vue';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUiStore } from '@/stores/uiStore';
import axios from 'axios';

const authStore = useAuthStore();
const taskStore = useTaskStore();
const notifStore = useNotificationStore();
const uiStore = useUiStore();

const activeTab = ref('team');

const newUser = reactive({
  name: '',
  email: '',
  role: 'employee',
  department: 'SMM',
  job_title: 'SMM Specialist'
});

const smtpForm = reactive({
  host: '',
  port: 587,
  user: '',
  pass: '',
  from: ''
});

onMounted(async () => {
  await notifStore.fetchSmtpSettings();
  if (notifStore.smtpSettings) {
    smtpForm.host = notifStore.smtpSettings.host || '';
    smtpForm.port = notifStore.smtpSettings.port || 587;
    smtpForm.user = notifStore.smtpSettings.user || '';
    smtpForm.pass = notifStore.smtpSettings.pass || '';
    smtpForm.from = notifStore.smtpSettings.from || '';
  }
});

function onNewUserDepartmentChange() {
  const d = newUser.department;
  if (d === 'SMM') newUser.job_title = 'SMM Specialist';
  else if (d === 'GRAPHICS DESIGNER') newUser.job_title = 'Graphic Designer';
  else if (d === 'SEO') newUser.job_title = 'SEO Specialist';
  else if (d === 'WEBSITE DEVELOPER') newUser.job_title = 'Web Developer';
}

async function handleCreateUser() {
  try {
    await axios.post('/api/users', {
      ...newUser,
      password: 'User@123'
    });
    uiStore.success(`User "${newUser.name}" created successfully in ${newUser.department}`);
    newUser.name = '';
    newUser.email = '';
    newUser.department = 'SMM';
    await authStore.fetchUsers();
  } catch (err) {
    uiStore.error('Failed to create user: ' + (err.response?.data?.error || err.message));
  }
}

async function handleSaveSmtp() {
  try {
    await notifStore.saveSmtpSettings(smtpForm);
    uiStore.success('SMTP settings saved successfully!');
    taskStore.settingsModalOpen = false;
  } catch (err) {
    uiStore.error('Failed to save settings: ' + err.message);
  }
}
</script>
