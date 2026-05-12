<script setup lang="ts">
import { ref } from 'vue'
import { Pencil, RotateCcw } from 'lucide-vue-next'
import HotkeyCapture from './HotkeyCapture.vue'

const props = defineProps<{
  label: string
  keyValue: string
  defaultKey: string
}>()

const emit = defineEmits<{
  update: [newKey: string]
}>()

const showCapture = ref(false)

function onConfirm(newKey: string) {
  showCapture.value = false
  emit('update', newKey)
}

function onReset() {
  emit('update', props.defaultKey)
}
</script>

<template>
  <div class="hotkey-row">
    <span class="hotkey-label">{{ label }}</span>
    <div class="hotkey-keycaps">
      <span
        v-for="(part, i) in keyValue.split('+')"
        :key="i"
        class="keycap"
      >{{ part }}</span>
    </div>
    <button class="hotkey-modify-btn" @click="showCapture = true">
      <Pencil :size="14" stroke-width="1.5" />
    </button>
    <button class="hotkey-reset-btn" @click="onReset">
      <RotateCcw :size="12" stroke-width="1.5" />
      <span>恢复默认</span>
    </button>

    <HotkeyCapture
      :visible="showCapture"
      :currentKey="keyValue"
      @close="showCapture = false"
      @confirm="onConfirm"
    />
  </div>
</template>

<style scoped>
.hotkey-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 36px;
}

.hotkey-label {
  font-size: 12px;
  color: var(--color-surface-700);
  min-width: 80px;
  flex-shrink: 0;
}

.hotkey-keycaps {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.keycap {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-surface-800);
  background: var(--color-surface-300);
  padding: 2px 8px;
  border-radius: var(--radius-1);
  box-shadow: 0 2px 0 var(--color-surface-400);
}

.hotkey-modify-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-surface-300);
  border-radius: var(--radius-2);
  background: transparent;
  color: var(--color-surface-500);
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out);
  flex-shrink: 0;
}

.hotkey-modify-btn:hover {
  color: var(--color-primary-500);
  border-color: var(--color-primary-500);
}

.hotkey-reset-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--color-surface-500);
  font-size: 11px;
  cursor: pointer;
  padding: 2px 0;
  transition: color var(--duration-fast) var(--ease-out);
}

.hotkey-reset-btn:hover {
  color: var(--color-primary-500);
}
</style>
