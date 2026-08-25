<template>
  <div
    :class="[
      'rounded-full flex items-center justify-center font-bold uppercase shrink-0 overflow-hidden select-none',
      sizeClass,
      customClass
    ]"
    :style="avatarStyle"
    :title="name || 'User'"
  >
    <img
      v-if="hasValidImage"
      :src="avatarUrl"
      :alt="name"
      class="w-full h-full object-cover"
      @error="imageError = true"
    />
    <span v-else class="text-white tracking-wider" :style="{ fontSize: fontSizePx }">
      {{ initials }}
    </span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  name: { type: String, default: '' },
  avatar: { type: String, default: '' },
  size: { type: String, default: 'md' }, // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  customClass: { type: String, default: '' }
});

const imageError = ref(false);

const hasValidImage = computed(() => {
  if (imageError.value) return false;
  if (!props.avatar || typeof props.avatar !== 'string') return false;
  // Ignore random ugly dicebear cartoon avatars
  if (props.avatar.includes('dicebear.com/7.x/avataaars')) return false;
  return props.avatar.trim().length > 0;
});

const avatarUrl = computed(() => {
  if (!props.avatar) return '';
  if (props.avatar.startsWith('http') || props.avatar.startsWith('/uploads')) {
    return props.avatar;
  }
  return props.avatar;
});

const initials = computed(() => {
  if (!props.name || !props.name.trim()) return 'U';
  const parts = props.name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return props.name.substring(0, 2).toUpperCase();
});

const sizeClass = computed(() => {
  const map = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-16 h-16'
  };
  return map[props.size] || 'w-8 h-8';
});

const fontSizePx = computed(() => {
  const map = {
    xs: '9px',
    sm: '10px',
    md: '12px',
    lg: '14px',
    xl: '20px'
  };
  return map[props.size] || '12px';
});

// Deterministic pleasing gradient based on user name
const avatarStyle = computed(() => {
  if (hasValidImage.value) return {};
  const gradients = [
    'linear-gradient(135deg, #7B68EE 0%, #FF007F 100%)',
    'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)'
  ];
  let hash = 0;
  for (let i = 0; i < (props.name || 'User').length; i++) {
    hash = (props.name || 'User').charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return { background: gradients[index] };
});
</script>
