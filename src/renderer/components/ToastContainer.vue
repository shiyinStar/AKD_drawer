<script setup lang="ts">
import ToastItem from './ToastItem.vue'

defineProps<{
  toasts: { id: number; type: 'success' | 'warning' | 'error' | 'info'; message: string; duration: number }[]
}>()

defineEmits<{
  remove: [id: number]
}>()
</script>

<template>
  <div class="toast-container" aria-live="polite">
    <TransitionGroup name="toast-list">
      <ToastItem
        v-for="toast in toasts"
        :key="toast.id"
        :id="toast.id"
        :type="toast.type"
        :message="toast.message"
        :duration="toast.duration"
        @remove="$emit('remove', toast.id)"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 12px;
  right: 12px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 360px;
  pointer-events: none;
}

.toast-container > * {
  pointer-events: auto;
}

.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-list-leave-to {
  opacity: 0;
}
</style>
