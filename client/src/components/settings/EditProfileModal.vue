<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
    @click.self="close"
  >
    <div class="bg-white dark:bg-[#202225] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#2F3136] w-full max-w-md overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 dark:border-[#2F3136] flex items-center justify-between bg-slate-50/50 dark:bg-[#18191B]/50">
        <h3 class="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
          <UserIcon class="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>{{ isEditingOther ? `Edit Profile: ${profileForm.name}` : 'Edit My Profile & Picture' }}</span>
        </h3>
        <button @click="close" class="text-slate-400 hover:text-slate-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Body -->
      <form @submit.prevent="handleSaveProfile" class="p-6 space-y-4">
        <!-- Avatar Upload / Photo Section -->
        <div class="flex flex-col items-center text-center space-y-3">
          <div class="relative group">
            <UserAvatar
              :name="profileForm.name"
              :avatar="previewAvatar || profileForm.avatar"
              size="xl"
              customClass="ring-4 ring-purple-500/20 shadow-lg cursor-pointer"
              @click="triggerFileInput"
            />
            <label
              class="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity"
            >
              <Camera class="w-5 h-5" />
              <input type="file" ref="fileInputRef" @change="handleAvatarFileSelect" accept="image/*" class="hidden" />
            </label>
          </div>

          <div class="flex items-center space-x-2">
            <button
              type="button"
              @click="triggerFileInput"
              class="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
            >
              <Upload class="w-3 h-3" />
              <span>Upload Custom Photo</span>
            </button>
            <span v-if="profileForm.avatar" class="text-slate-300">•</span>
            <button
              v-if="profileForm.avatar"
              type="button"
              @click="removeAvatar"
              class="text-xs font-bold text-red-500 hover:underline"
            >
              Remove Photo
            </button>
          </div>
        </div>

        <!-- Full Name -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Full Name *</label>
          <input
            v-model="profileForm.name"
            type="text"
            required
            placeholder="Name"
            class="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <!-- Email (Editable by Super Admin) -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Email Address</label>
          <input
            v-model="profileForm.email"
            type="email"
            :disabled="!authStore.isSuperAdmin"
            placeholder="email@company.com"
            class="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none disabled:opacity-60"
          />
        </div>

        <!-- Role Selector (Super Admin Only) -->
        <div v-if="authStore.isSuperAdmin">
          <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Role / Permissions</label>
          <select
            v-model="profileForm.role"
            class="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none font-semibold"
          >
            <option value="super_admin">Super Admin / Owner</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
        </div>

        <!-- Job Title & Department -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Job Title</label>
            <input
              v-model="profileForm.job_title"
              type="text"
              placeholder="e.g. Lead Designer"
              class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Department</label>
            <input
              v-model="profileForm.department"
              type="text"
              placeholder="Engineering"
              class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#2F3136]">
          <!-- Delete User Button (Super Admin only, cannot delete self if only 1 admin) -->
          <button
            v-if="authStore.isSuperAdmin && targetUser && (targetUser._id !== authStore.currentUser?._id && targetUser.id !== authStore.currentUser?.id)"
            type="button"
            @click="handleDeleteUser"
            class="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl flex items-center space-x-1 transition-colors"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>Delete User</span>
          </button>
          <div v-else></div>

          <div class="flex items-center space-x-2">
            <button
              type="button"
              @click="close"
              class="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 transition-all active:scale-95"
            >
              {{ saving ? 'Saving...' : 'Save Profile' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { X, User as UserIcon, Camera, Upload, Trash2 } from 'lucide-vue-next';
import UserAvatar from '@/components/common/UserAvatar.vue';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import axios from 'axios';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  targetUser: { type: Object, default: null }
});

const emit = defineEmits(['close']);

const authStore = useAuthStore();
const taskStore = useTaskStore();

const fileInputRef = ref(null);
const previewAvatar = ref(null);
const avatarFile = ref(null);
const saving = ref(false);

const activeTarget = computed(() => props.targetUser || authStore.currentUser);
const isEditingOther = computed(() => {
  if (!props.targetUser || !authStore.currentUser) return false;
  const targetId = props.targetUser._id || props.targetUser.id;
  const currentId = authStore.currentUser._id || authStore.currentUser.id;
  return targetId !== currentId;
});

const profileForm = reactive({
  name: '',
  email: '',
  role: 'employee',
  job_title: '',
  department: '',
  avatar: ''
});

watch(() => props.isOpen, (open) => {
  if (open && activeTarget.value) {
    profileForm.name = activeTarget.value.name || '';
    profileForm.email = activeTarget.value.email || '';
    profileForm.role = activeTarget.value.role || 'employee';
    profileForm.job_title = activeTarget.value.job_title || '';
    profileForm.department = activeTarget.value.department || 'Engineering';
    profileForm.avatar = activeTarget.value.avatar || '';
    previewAvatar.value = null;
    avatarFile.value = null;
  }
});

function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleAvatarFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  avatarFile.value = file;
  const reader = new FileReader();
  reader.onload = (event) => {
    previewAvatar.value = event.target.result;
  };
  reader.readAsDataURL(file);
}

function removeAvatar() {
  profileForm.avatar = '';
  previewAvatar.value = '';
  avatarFile.value = null;
}

async function handleSaveProfile() {
  if (!activeTarget.value) return;
  saving.value = true;

  try {
    const userId = activeTarget.value._id || activeTarget.value.id;
    let finalAvatar = profileForm.avatar;

    // If a new avatar file was selected, upload it
    if (avatarFile.value) {
      const formData = new FormData();
      formData.append('avatar', avatarFile.value);
      const uploadRes = await axios.post(`/api/users/${userId}/avatar`, formData);
      finalAvatar = uploadRes.data.avatar;
    }

    const payload = {
      name: profileForm.name,
      email: profileForm.email,
      department: profileForm.department,
      job_title: profileForm.job_title,
      avatar: finalAvatar
    };

    if (authStore.isSuperAdmin) {
      payload.role = profileForm.role;
    }

    await authStore.updateProfile(userId, payload);
    await taskStore.fetchTasks();
    close();
  } catch (err) {
    alert('Failed to update profile: ' + (err.response?.data?.error || err.message));
  } finally {
    saving.value = false;
  }
}

async function handleDeleteUser() {
  if (!props.targetUser) return;
  const userName = props.targetUser.name;
  if (confirm(`Are you sure you want to permanently delete user "${userName}"?`)) {
    try {
      const userId = props.targetUser._id || props.targetUser.id;
      await authStore.deleteUser(userId);
      await taskStore.fetchTasks();
      close();
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    }
  }
}

function close() {
  emit('close');
}
</script>
