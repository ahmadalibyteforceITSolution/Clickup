<template>
  <div
    v-if="authStore.authModalOpen"
    class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
    @click.self="authStore.authModalOpen = false"
  >
    <div class="bg-white dark:bg-[#202225] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#2F3136] w-full max-w-md overflow-hidden flex flex-col">
      <!-- Gradient Header -->
      <div class="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 p-6 text-white text-center relative">
        <button
          @click="authStore.authModalOpen = false"
          class="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>

        <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
          <ShieldCheck v-if="authStore.authMode === 'verify'" class="w-6 h-6 text-white" />
          <Layers v-else class="w-6 h-6 text-white" />
        </div>

        <h3 class="text-xl font-black tracking-tight">
          {{ authStore.authMode === 'verify' ? 'Verify Your Email' : (authStore.authMode === 'register' ? 'Join Your Team' : 'Sign in to ClickUp') }}
        </h3>
        <p class="text-xs text-white/80 mt-1">
          {{ authStore.authMode === 'verify' ? 'Enter the 6-digit code sent to your inbox' : 'Enterprise Task Management & Real-time Collaboration' }}
        </p>
      </div>

      <!-- Mode Switcher (Login / Register) -->
      <div
        v-if="authStore.authMode !== 'verify'"
        class="flex border-b border-slate-100 dark:border-[#2F3136] bg-slate-50 dark:bg-[#18191B]"
      >
        <button
          @click="authStore.authMode = 'login'"
          :class="[
            'flex-1 py-3 text-xs font-bold transition-all border-b-2 text-center',
            authStore.authMode === 'login'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-[#202225]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          ]"
        >
          Sign In
        </button>
        <button
          @click="authStore.authMode = 'register'"
          :class="[
            'flex-1 py-3 text-xs font-bold transition-all border-b-2 text-center',
            authStore.authMode === 'register'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-[#202225]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          ]"
        >
          Create Account
        </button>
      </div>

      <!-- Form Body -->
      <div class="p-6 space-y-4">
        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium flex items-center space-x-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Success Alert -->
        <div
          v-if="successMessage"
          class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center space-x-2"
        >
          <CheckCircle2 class="w-4 h-4 shrink-0" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- 1. LOGIN FORM -->
        <form v-if="authStore.authMode === 'login'" @submit.prevent="handleLogin" class="space-y-3.5">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <div class="relative">
              <input
                v-model="loginForm.email"
                type="email"
                required
                placeholder="you@company.com"
                class="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
              />
              <Mail class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <div class="relative">
              <input
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
              />
              <Lock class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <EyeOff v-if="showPassword" class="w-3.5 h-3.5" />
                <Eye v-else class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {{ authStore.loading ? 'Signing In...' : 'Sign In' }}
          </button>

          <!-- Quick Persona Auto-Fill -->
          <div class="pt-2">
            <p class="text-[10px] font-bold text-slate-400 uppercase text-center mb-2">Or Quick Switch Persona</p>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                @click="quickSelectPersona('admin')"
                class="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-[#18191B] hover:bg-purple-100 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-colors truncate"
              >
                👑 Admin
              </button>
              <button
                type="button"
                @click="quickSelectPersona('manager')"
                class="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-[#18191B] hover:bg-purple-100 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-colors truncate"
              >
                💼 Manager
              </button>
              <button
                type="button"
                @click="quickSelectPersona('employee')"
                class="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-[#18191B] hover:bg-purple-100 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-colors truncate"
              >
                👨‍💻 Employee
              </button>
            </div>
          </div>
        </form>

        <!-- 2. REGISTRATION FORM -->
        <form v-else-if="authStore.authMode === 'register'" @submit.prevent="handleRegister" class="space-y-3">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              v-model="regForm.name"
              type="text"
              required
              placeholder="e.g. Alex Mercer"
              class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Company Email *</label>
            <input
              v-model="regForm.email"
              type="email"
              required
              placeholder="alex@company.com"
              class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Password *</label>
            <input
              v-model="regForm.password"
              type="password"
              required
              minlength="6"
              placeholder="At least 6 characters"
              class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Role</label>
              <select
                v-model="regForm.role"
                class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none font-semibold"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Department</label>
              <input
                v-model="regForm.department"
                type="text"
                placeholder="Engineering"
                class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {{ authStore.loading ? 'Creating Account...' : 'Register & Send Code' }}
          </button>
        </form>

        <!-- 3. EMAIL VERIFICATION FORM (6-digit OTP) -->
        <form v-else-if="authStore.authMode === 'verify'" @submit.prevent="handleVerifyEmail" class="space-y-4">
          <div class="text-center space-y-1">
            <p class="text-xs text-slate-600 dark:text-slate-400">
              We sent a 6-digit verification code to:
            </p>
            <p class="text-xs font-bold text-purple-600 dark:text-purple-400">{{ authStore.unverifiedEmail }}</p>
          </div>

          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 text-center">6-Digit Code</label>
            <input
              v-model="verificationCode"
              type="text"
              maxlength="6"
              required
              placeholder="123456"
              class="w-full text-center tracking-[12px] font-mono text-2xl font-black px-4 py-3 bg-purple-50/50 dark:bg-[#18191B] border-2 border-purple-500 rounded-2xl text-purple-900 dark:text-purple-300 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            :disabled="authStore.loading || verificationCode.length < 6"
            class="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {{ authStore.loading ? 'Verifying...' : 'Verify & Enter Workspace' }}
          </button>

          <div class="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              @click="handleResendCode"
              class="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
            >
              Resend Code
            </button>
            <button
              type="button"
              @click="authStore.authMode = 'login'"
              class="text-slate-400 hover:text-slate-600"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { 
  X, Layers, ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useNotificationStore } from '@/stores/notificationStore';

const authStore = useAuthStore();
const taskStore = useTaskStore();
const notifStore = useNotificationStore();

const showPassword = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const verificationCode = ref('');

const loginForm = reactive({
  email: '',
  password: ''
});

const regForm = reactive({
  name: '',
  email: '',
  password: '',
  role: 'employee',
  department: 'Engineering'
});

async function handleLogin() {
  errorMessage.value = '';
  try {
    await authStore.login(loginForm.email, loginForm.password);
    await taskStore.fetchTasks();
    if (authStore.currentUser) {
      await notifStore.fetchNotifications(authStore.currentUser.id || authStore.currentUser._id);
    }
  } catch (err) {
    errorMessage.value = err.message;
  }
}

async function handleRegister() {
  errorMessage.value = '';
  successMessage.value = '';
  try {
    const res = await authStore.register(regForm);
    successMessage.value = res.message || 'Verification code sent to your email!';
  } catch (err) {
    errorMessage.value = err.message;
  }
}

async function handleVerifyEmail() {
  errorMessage.value = '';
  try {
    await authStore.verifyEmail(authStore.unverifiedEmail, verificationCode.value.trim());
    await taskStore.fetchTasks();
    if (authStore.currentUser) {
      await notifStore.fetchNotifications(authStore.currentUser.id || authStore.currentUser._id);
    }
  } catch (err) {
    errorMessage.value = err.message;
  }
}

async function handleResendCode() {
  errorMessage.value = '';
  try {
    const res = await authStore.resendVerificationCode(authStore.unverifiedEmail);
    successMessage.value = res.message;
  } catch (err) {
    errorMessage.value = err.message;
  }
}

function quickSelectPersona(type) {
  if (authStore.users.length === 0) return;
  let user = null;
  if (type === 'admin') user = authStore.users.find(u => u.role === 'super_admin');
  else if (type === 'manager') user = authStore.users.find(u => u.role === 'manager');
  else user = authStore.users.find(u => u.role === 'employee');

  if (user) {
    authStore.switchUser(user);
    authStore.authModalOpen = false;
    taskStore.fetchTasks();
  }
}
</script>
