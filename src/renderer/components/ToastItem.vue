<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Check, AlertTriangle, X, Info } from 'lucide-vue-next'

const props = defineProps<{
  id: number
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  duration: number
}>()

const emit = defineEmits<{
  remove: [id: number]
}>()

const exiting = ref(false)

const iconMap = {
  success: Check,
  warning: AlertTriangle,
  error: X,
  info: Info,
}

const colorMap = {
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',
}

onMounted(() => {
  setTimeout(() => {
    exiting.value = true
    setTimeout(() => emit('remove', props.id), 200)
  }, props.duration)
})
</script>

<template>
  <div
    class="toast-item"
    :class="{ 'toast-item--exit': exiting }"
    :style="{ '--toast-color': colorMap[type] }"
  >
    <div class="toast-item__stripe" />
    <component :is="iconMap[type]" :size="16" stroke-width="1.5" class="toast-item__icon" />
    <span class="toast-item__message">{{ message }}</span>
  </div>
</template>

<style scoped>
.toast-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-2);
  position: relative;
  overflow: hidden;
  animation: toast-enter 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-item--exit {
  animation: toast-exit 200ms ease-out forwards;
}

.toast-item__stripe {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--toast-color);
}

.toast-item__icon {
  color: var(--toast-color);
  flex-shrink: 0;
}

.toast-item__message {
  font-size: 13px;
  color: var(--color-surface-800);
}

@keyframes toast-enter {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toast-exit {
  to {
    opacity: 0;
  }
}
</style>
