<script setup lang="ts">
import { Download, Upload } from 'lucide-vue-next'

defineProps<{
  hasImage: boolean
}>()

defineEmits<{
  import: []
}>()
</script>

<template>
  <div class="panel-toolbar">
    <button class="btn btn--primary" @click="$emit('import')">
      <Download :size="16" stroke-width="1.5" />
      <span>导入图片</span>
    </button>
    <button class="btn btn--secondary" :disabled="!hasImage">
      <Upload :size="16" stroke-width="1.5" />
      <span>导出线稿 PNG</span>
    </button>
  </div>
</template>

<style scoped>
.panel-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 var(--space-3);
  border-bottom: 1px solid var(--color-surface-200);
  background: var(--color-surface-100);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 32px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.btn--primary {
  border: none;
  background: var(--color-primary-500);
  color: var(--color-surface-900);
}

.btn--primary:hover {
  background: var(--color-primary-600);
  transform: translateY(-1px);
}

.btn--secondary {
  border: 1px solid var(--color-primary-500);
  background: transparent;
  color: var(--color-primary-500);
}

.btn--secondary:disabled {
  border-color: var(--color-surface-400);
  color: var(--color-surface-500);
  cursor: not-allowed;
  transform: none;
}
</style>
