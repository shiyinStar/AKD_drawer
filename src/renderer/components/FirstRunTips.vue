<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits<{
  dismiss: []
}>()

interface ShortcutItem {
  label: string
  keyValue: string
  desc: string
}

const shortcuts = ref<ShortcutItem[]>([
  { label: '进入/退出预览', keyValue: 'F5', desc: '在预览窗口中查看路径布局' },
  { label: '开始绘制', keyValue: 'F6', desc: '在目标软件中自动绘制线稿' },
  { label: '停止绘制', keyValue: 'F7', desc: '立即抬笔并停止绘制' },
  { label: '预览/穿透', keyValue: 'Ctrl+Shift+F9', desc: '切换叠加窗口交互与穿透模式' },
])

onMounted(async () => {
  try {
    const config = await window.electronAPI.getSettings() as { hotkeys?: Record<string, string> }
    if (config?.hotkeys) {
      const hk = config.hotkeys
      shortcuts.value = [
        { label: '进入/退出预览', keyValue: hk.preview ?? 'F5', desc: '在预览窗口中查看路径布局' },
        { label: '开始绘制', keyValue: hk.startDraw ?? 'F6', desc: '在目标软件中自动绘制线稿' },
        { label: '停止绘制', keyValue: hk.stopDraw ?? 'F7', desc: '立即抬笔并停止绘制' },
        { label: '预览/穿透', keyValue: hk.toggleOverlay ?? 'Ctrl+Shift+F9', desc: '切换叠加窗口交互与穿透模式' },
      ]
    }
  } catch {
    // 使用默认快捷键
  }
})
</script>

<template>
  <Transition name="tips">
    <div class="tips-overlay" @click.self="emit('dismiss')">
      <div class="tips-card">
        <h2 class="tips-title">快捷键速查</h2>
        <p class="tips-subtitle">AKD 通过全局快捷键控制，以下为默认配置（可在设置中修改）</p>

        <div class="tips-list">
          <div v-for="item in shortcuts" :key="item.label" class="tips-row">
            <div class="tips-keycaps">
              <span
                v-for="(part, i) in item.keyValue.split('+')"
                :key="i"
                class="tips-keycap"
              >{{ part }}</span>
            </div>
            <div class="tips-info">
              <span class="tips-label">{{ item.label }}</span>
              <span class="tips-desc">{{ item.desc }}</span>
            </div>
          </div>
        </div>

        <button class="tips-dismiss-btn" @click="emit('dismiss')">知道了</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.tips-overlay {
  position: fixed;
  inset: 0;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 15, 0.7);
  backdrop-filter: blur(6px);
}

.tips-card {
  background: var(--color-surface-100);
  border: 1px solid var(--color-surface-200);
  border-radius: var(--radius-4);
  padding: var(--space-6);
  min-width: 420px;
  max-width: 480px;
  box-shadow: var(--shadow-modal);
  text-align: center;
}

.tips-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-surface-800);
  margin: 0 0 var(--space-2);
}

.tips-subtitle {
  font-size: 12px;
  color: var(--color-surface-500);
  margin: 0 0 var(--space-5);
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.tips-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-align: left;
}

.tips-keycaps {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
  min-width: 140px;
  justify-content: flex-end;
}

.tips-keycap {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-surface-800);
  background: var(--color-surface-300);
  padding: 2px 8px;
  border-radius: var(--radius-1);
  box-shadow: 0 2px 0 var(--color-surface-400);
}

.tips-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tips-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-surface-800);
}

.tips-desc {
  font-size: 11px;
  color: var(--color-surface-500);
}

.tips-dismiss-btn {
  height: 36px;
  padding: 0 var(--space-6);
  background: var(--color-primary-500);
  color: #fff;
  border: none;
  border-radius: var(--radius-2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out);
}

.tips-dismiss-btn:hover {
  background: var(--color-primary-600);
  box-shadow: var(--shadow-button-hover);
}

.tips-dismiss-btn:active {
  transform: scale(0.97);
}

.tips-enter-active {
  transition: opacity var(--duration-slow) var(--ease-smooth);
}

.tips-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out);
}

.tips-enter-from,
.tips-leave-to {
  opacity: 0;
}
</style>
