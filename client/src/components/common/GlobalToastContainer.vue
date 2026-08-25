<template>
  <div class="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
    <TransitionGroup
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-4"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="toast in uiStore.toasts"
        :key="toast.id"
        class="pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start space-x-3 transition-all"
        :class="getToastClasses(toast.type)"
      >
        <!-- Icon -->
        <div class="shrink-0 mt-0.5">
          <CheckCircle2 v-if="toast.type === 'success'" class="w-5 h-5 text-emerald-500" />
          <AlertCircle v-else-if="toast.type === 'error'" class="w-5 h-5 text-red-500" />
          <AlertTriangle v-else-if="toast.type === 'warning'" class="w-5 h-5 text-amber-500" />
          <Info v-else class="w-5 h-5 text-purple-500" />
        </div>

        <!-- Message Body -->
        <div class="flex-1 min-w-0 pr-1">
          <h4 v-if="toast.title" class="text-xs font-black uppercase tracking-wider mb-0.5">
            {{ toast.title }}
          </h4>
          <p class="text-xs font-semibold leading-relaxed break-words opacity-90">
            {{ toast.message }}
          </p>
        </div>

        <!-- Close Button -->
        <button
          @click="uiStore.removeToast(toast.id)"
          class="shrink-0 p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next';
import { useUiStore } from '@/stores/uiStore';

const uiStore = useUiStore();

function getToastClasses(type) {
  switch (type) {
    case 'success':
      return 'bg-slate-900/95 text-white border-emerald-500/40 shadow-emerald-950/30';
    case 'error':
      return 'bg-slate-900/95 text-white border-red-500/40 shadow-red-950/30';
    case 'warning':
      return 'bg-slate-900/95 text-white border-amber-500/40 shadow-amber-950/30';
    case 'info':
    default:
      return 'bg-slate-900/95 text-white border-purple-500/40 shadow-purple-950/30';
  }
}
</script>
