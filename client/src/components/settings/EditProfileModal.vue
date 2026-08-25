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
          <span>Edit User Profile & Picture</span>
        </h3>
        <button @click="close" class="text-slate-400 hover:text-slate-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Body -->
      <form @submit.prevent="handleSaveProfile" class="p-6 space-y-5">
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
            placeholder="Your Name"
            class="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <!-- Job Title -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Job Title</label>
          <input
            v-model="profileForm.job_title"
            type="text"
            placeholder="e.g. Lead Designer, Software Engineer..."
            class="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <!-- Department -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Department</label>
          <input
            v-model="profileForm.department"
            type="text"
            placeholder="Engineering, Marketing, Operations..."
            class="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div class="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-[#2F3136]">
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
            {{ saving ? 'Saving Changes...' : 'Save Profile' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { X, User as UserIcon, Camera, Upload } from 'lucide-vue-next';
import UserAvatar from '@/components/common/UserAvatar.vue';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';

const props = defineProps({
  isOpen: { type: Boolean, default: false }
});

const emit = defineEmits(['close']);

const authStore = useAuthStore();
const fileInputRef = ref(null);
const previewAvatar = ref(null);
const avatarFile = ref(null);
const saving = ref(false);

const profileForm = reactive({
  name: '',
  job_title: '',
  department: '',
  avatar: ''
});

watch(() => props.isOpen, (open) => {
  if (open && authStore.currentUser) {
    profileForm.name = authStore.currentUser.name || '';
    profileForm.job_title = authStore.currentUser.job_title || '';
    profileForm.department = authStore.currentUser.department || 'General';
    profileForm.avatar = authStore.currentUser.avatar || '';
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
  if (!authStore.currentUser) return;
  saving.value = true;

  try {
    const userId = authStore.currentUser._id || authStore.currentUser.id;
    let finalAvatar = profileForm.avatar;

    // If a new avatar file was selected, upload it
    if (avatarFile.value) {
      const formData = new FormData();
      formData.append('avatar', avatarFile.value);
      const uploadRes = await axios.post(`/api/users/${userId}/avatar`, formData);
      finalAvatar = uploadRes.data.avatar;
    }

    const res = await axios.put(`/api/users/${userId}`, {
      name: profileForm.name,
      job_title: profileForm.job_title,
      department: profileForm.department,
      avatar: finalAvatar
    });

    authStore.currentUser = res.data;
    await authStore.fetchUsers();
    close();
  } catch (err) {
    alert('Failed to update profile: ' + (err.response?.data?.error || err.message));
  } finally {
    saving.value = false;
  }
}

function close() {
  emit('close');
}
</script>
