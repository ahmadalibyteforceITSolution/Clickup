<template>
  <div
    v-if="uiStore.confirmModal.isOpen"
    class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
    @click.self="uiStore.handleConfirmModalResult(false)"
  >
    <div class="bg-white dark:bg-[#202225] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#2F3136] w-full max-w-sm overflow-hidden p-6 space-y-4 text-slate-900 dark:text-white">
      <!-- Icon & Header -->
      <div class="flex items-center space-x-3">
        <div
          class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          :class="uiStore.confirmModal.isDanger ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400' : 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'"
        >
          <AlertTriangle v-if="uiStore.confirmModal.isDanger" class="w-5 h-5" />
          <HelpCircle v-else class="w-5 h-5" />
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-black leading-tight">{{ uiStore.confirmModal.title }}</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{{ uiStore.confirmModal.message }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-[#2F3136]">
        <button
          type="button"
          @click="uiStore.handleConfirmModalResult(false)"
          class="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          {{ uiStore.confirmModal.cancelText || 'Cancel' }}
        </button>
        <button
          type="button"
          @click="uiStore.handleConfirmModalResult(true)"
          class="px-5 py-2 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          :class="uiStore.confirmModal.isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'"
        >
          {{ uiStore.confirmModal.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { AlertTriangle, HelpCircle } from 'lucide-vue-next';
import { useUiStore } from '@/stores/uiStore';

const uiStore = useUiStore();
</script>
