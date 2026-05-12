<script setup lang="ts">
import HotkeyRow from './HotkeyRow.vue'

const props = defineProps<{
  hotkeys: {
    preview: string
    startDraw: string
    stopDraw: string
    toggleOverlay: string
  }
}>()

const emit = defineEmits<{
  update: [key: string, value: string]
}>()

const defaults: Record<string, string> = {
  preview: 'F5',
  startDraw: 'F6',
  stopDraw: 'F7',
  toggleOverlay: 'Ctrl+Shift+F9',
}

function onUpdate(label: string, newKey: string) {
  emit('update', label, newKey)
}
</script>

<template>
  <div class="hotkey-settings">
    <HotkeyRow
      label="进入/退出预览"
      :keyValue="hotkeys.preview"
      :defaultKey="defaults.preview"
      @update="(k: string) => onUpdate('preview', k)"
    />
    <HotkeyRow
      label="开始绘制"
      :keyValue="hotkeys.startDraw"
      :defaultKey="defaults.startDraw"
      @update="(k: string) => onUpdate('startDraw', k)"
    />
    <HotkeyRow
      label="停止绘制"
      :keyValue="hotkeys.stopDraw"
      :defaultKey="defaults.stopDraw"
      @update="(k: string) => onUpdate('stopDraw', k)"
    />
    <HotkeyRow
      label="预览/穿透"
      :keyValue="hotkeys.toggleOverlay"
      :defaultKey="defaults.toggleOverlay"
      @update="(k: string) => onUpdate('toggleOverlay', k)"
    />
  </div>
</template>

<style scoped>
.hotkey-settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
