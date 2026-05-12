<script setup lang="ts">
import { CircleX, CircleDashed, FolderOpen } from 'lucide-vue-next'
import type { ErrorInfo } from '../../shared/types.js'

defineProps<{
  error: ErrorInfo
}>()

const emit = defineEmits<{
  retry: []
  openLog: [path: string]
}>()
</script>

<template>
  <div class="error-overlay">
    <div class="error-overlay__content">
      <CircleX :size="56" class="error-overlay__icon" />
      <p class="error-overlay__reason">{{ error.reason }}</p>
      <p class="error-overlay__suggestion">{{ error.suggestion }}</p>
      <button
        class="error-overlay__retry-btn"
        @click="emit('retry')"
        @keydown.enter="emit('retry')"
        @keydown.space.prevent="emit('retry')"
      >
        <CircleDashed :size="16" />
        <span>重试</span>
      </button>
      <button
        class="error-overlay__log-link"
        @click="emit('openLog', error.logPath)"
      >
        <FolderOpen :size="14" />
        <span>打开日志目录</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-100);
  z-index: 10;
  animation: error-fade-in 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.error-overlay__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px;
  animation: error-scale-in 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.error-overlay__icon {
  color: var(--color-error);
  margin-bottom: 12px;
}

.error-overlay__reason {
  font-size: 14px;
  color: var(--color-surface-800);
  margin: 0 0 8px 0;
  max-width: 360px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.error-overlay__suggestion {
  font-size: 12px;
  color: var(--color-surface-600);
  margin: 0 0 24px 0;
  max-width: 360px;
  line-height: 1.5;
}

.error-overlay__retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 16px;
  background: var(--color-primary-500);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 100ms ease-out, background 150ms ease-out;
}

.error-overlay__retry-btn:hover {
  background: var(--color-primary-600);
  transform: translateY(-1px);
}

.error-overlay__retry-btn:active {
  transform: scale(0.97);
}

.error-overlay__log-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  background: none;
  border: none;
  color: var(--color-surface-500);
  font-size: 12px;
  cursor: pointer;
  transition: color 150ms ease-out;
}

.error-overlay__log-link:hover {
  color: var(--color-primary-500);
}

@keyframes error-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes error-scale-in {
  from { transform: scale(0.95); }
  to   { transform: scale(1); }
}
</style>
