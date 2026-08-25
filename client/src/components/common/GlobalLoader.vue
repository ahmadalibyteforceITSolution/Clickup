<template>
  <div>
    <!-- Top Animated Gradient Progress Bar -->
    <div
      v-if="uiStore.isLoading"
      class="fixed top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-slate-200 dark:bg-slate-800"
    >
      <div class="h-full theme-gradient-bg animate-pulse w-full"></div>
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from '@/stores/uiStore';

const uiStore = useUiStore();
</script>
