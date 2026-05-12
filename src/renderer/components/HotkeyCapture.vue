<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
  currentKey: string
}>()

const emit = defineEmits<{
  close: []
  confirm: [key: string]
}>()

const capturedKey = ref('')
const error = ref('')

function buildKeyString(e: KeyboardEvent): string | null {
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')

  const key = e.key
  if (key === 'Control' || key === 'Shift' || key === 'Alt' || key === 'Meta') {
    return parts.length > 0 ? parts.join('+') : null
  }

  const keyMap: Record<string, string> = {
    ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
    ' ': 'Space',
  }
  const normalizedKey = keyMap[key] ?? (key.length === 1 ? key.toUpperCase() : key)
  parts.push(normalizedKey)
  return parts.join('+')
}

function onKeyDown(e: KeyboardEvent) {
  if (!props.visible) return
  e.preventDefault()
  e.stopPropagation()

  if (e.key === 'Escape') {
    emit('close')
    return
  }

  if (e.key === 'Enter' && capturedKey.value) {
    emit('confirm', capturedKey.value)
    return
  }

  const combo = buildKeyString(e)
  if (combo) {
    capturedKey.value = combo
    error.value = ''
  }
}

function onOverlayClick() {
  emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown, true)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown, true)
})
</script>

<template>
  <Transition name="capture">
    <div v-if="visible" class="capture-overlay" @click.self="onOverlayClick">
      <div class="capture-modal" @click.stop>
        <h3 class="capture-title">按下新快捷键</h3>
        <div class="capture-key-display" :class="{ captured: capturedKey }">
          {{ capturedKey || '等待按键...' }}
        </div>
        <p v-if="error" class="capture-error">{{ error }}</p>
        <div class="capture-actions">
          <button class="capture-btn capture-btn-confirm" :disabled="!capturedKey" @click="emit('confirm', capturedKey)">
            确认
          </button>
          <button class="capture-btn capture-btn-cancel" @click="emit('close')">
            取消
          </button>
        </div>
        <p class="capture-hint">按 Esc 取消 · Enter 确认</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.capture-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 15, 0.6);
  backdrop-filter: blur(4px);
}

.capture-modal {
  background: var(--color-surface-100);
  border: 1px solid var(--color-surface-200);
  border-radius: var(--radius-4);
  padding: var(--space-6);
  min-width: 320px;
  text-align: center;
  box-shadow: var(--shadow-modal);
}

.capture-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-surface-800);
  margin: 0 0 var(--space-5);
}

.capture-key-display {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-0);
  border: 2px dashed var(--color-surface-400);
  border-radius: var(--radius-3);
  font-family: var(--font-mono);
  font-size: 20px;
  color: var(--color-surface-500);
  transition: border-color var(--duration-fast) var(--ease-out);
  margin-bottom: var(--space-4);
}

.capture-key-display.captured {
  border-color: var(--color-primary-500);
  color: var(--color-surface-800);
}

.capture-error {
  font-size: 12px;
  color: var(--color-error);
  margin: 0 0 var(--space-3);
}

.capture-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
}

.capture-btn {
  height: 32px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out);
}

.capture-btn:active {
  transform: scale(0.97);
}

.capture-btn-confirm {
  background: var(--color-primary-500);
  color: #fff;
}

.capture-btn-confirm:hover:not(:disabled) {
  background: var(--color-primary-600);
  box-shadow: var(--shadow-button-hover);
}

.capture-btn-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.capture-btn-cancel {
  background: var(--color-surface-300);
  color: var(--color-surface-700);
}

.capture-btn-cancel:hover {
  background: var(--color-surface-400);
}

.capture-hint {
  font-size: 11px;
  color: var(--color-surface-500);
  margin: var(--space-3) 0 0;
}

.capture-enter-active {
  transition: opacity var(--duration-slow) var(--ease-smooth);
}

.capture-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out);
}

.capture-enter-from,
.capture-leave-to {
  opacity: 0;
}
</style>
