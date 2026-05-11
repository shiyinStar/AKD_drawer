<script setup lang="ts">
import { ref } from 'vue'
import { Minus, Square, X } from 'lucide-vue-next'

const isMaximized = ref(false)

async function handleMinimize() {
  await window.electronAPI.windowMinimize()
}

async function handleMaximize() {
  await window.electronAPI.windowMaximize()
  isMaximized.value = !isMaximized.value
}

async function handleClose() {
  await window.electronAPI.windowClose()
}
</script>

<template>
  <header class="title-bar" @dblclick="handleMaximize">
    <div class="title-bar__label">AKD</div>
    <div class="title-bar__controls">
      <button class="title-bar__btn" title="最小化" @click="handleMinimize">
        <Minus :size="16" stroke-width="1.5" />
      </button>
      <button class="title-bar__btn" title="最大化" @click="handleMaximize">
        <Square :size="14" stroke-width="1.5" />
      </button>
      <button class="title-bar__btn title-bar__btn--close" title="关闭" @click="handleClose">
        <X :size="16" stroke-width="1.5" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 var(--space-2);
  background: var(--color-surface-100);
  border-bottom: 1px solid var(--color-surface-200);
  -webkit-app-region: drag;
  flex-shrink: 0;
}

.title-bar__label {
  font-size: 12px;
  color: var(--color-surface-600);
  padding-left: var(--space-2);
}

.title-bar__controls {
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
}

.title-bar__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--color-surface-500);
  cursor: pointer;
  border-radius: var(--radius-1);
  transition: background var(--duration-fast) var(--ease-out);
}

.title-bar__btn:hover {
  background: var(--color-surface-200);
  color: var(--color-surface-700);
}

.title-bar__btn--close:hover {
  background: var(--color-error);
  color: var(--color-surface-900);
}
</style>
