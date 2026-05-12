<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HotkeySettings from './HotkeySettings.vue'
import SliderControl from './SliderControl.vue'

interface SettingsData {
  hotkeys: {
    preview: string
    startDraw: string
    stopDraw: string
    toggleOverlay: string
  }
  drawSpeed: number
  mouseButton: 'left' | 'right'
  overlayOpacity: number
  overlayLineColor: string
}

const settings = ref<SettingsData>({
  hotkeys: { preview: 'F5', startDraw: 'F6', stopDraw: 'F7', toggleOverlay: 'CommandOrControl+Shift+F9' },
  drawSpeed: 500,
  mouseButton: 'left',
  overlayOpacity: 0.6,
  overlayLineColor: '#000000',
})

const loaded = ref(false)

onMounted(async () => {
  try {
    const data = await window.electronAPI.getSettings() as SettingsData
    if (data) {
      settings.value = {
        hotkeys: { ...settings.value.hotkeys, ...data.hotkeys },
        drawSpeed: data.drawSpeed ?? 500,
        mouseButton: data.mouseButton ?? 'left',
        overlayOpacity: data.overlayOpacity ?? 0.6,
        overlayLineColor: data.overlayLineColor ?? '#000000',
      }
    }
  } catch {
    // 使用默认值
  }
  loaded.value = true
})

async function saveSetting(key: string, value: unknown) {
  try {
    await window.electronAPI.updateSettings({ [key]: value })
  } catch {
    // 静默失败
  }
}

function onHotkeyUpdate(hotkeyName: string, newKey: string) {
  settings.value.hotkeys = {
    ...settings.value.hotkeys,
    [hotkeyName]: newKey,
  }
  saveSetting('hotkeys', settings.value.hotkeys)
}

function onDrawSpeedChange(v: number) {
  settings.value.drawSpeed = v
  saveSetting('drawSpeed', v)
}

function onMouseButtonChange(btn: 'left' | 'right') {
  settings.value.mouseButton = btn
  saveSetting('mouseButton', btn)
}

function onOpacityChange(v: number) {
  settings.value.overlayOpacity = v
  saveSetting('overlayOpacity', v)
}

function onLineColorChange(e: Event) {
  const target = e.target as HTMLInputElement
  settings.value.overlayLineColor = target.value
  saveSetting('overlayLineColor', target.value)
}
</script>

<template>
  <div class="settings-panel">
    <div v-if="!loaded" class="settings-loading">
      <span class="text-body" style="color: var(--color-surface-500)">加载设置...</span>
    </div>

    <div v-else class="settings-content">
      <!-- 卡片 1：快捷键 -->
      <section class="settings-card">
        <h3 class="card-title">快捷键</h3>
        <HotkeySettings
          :hotkeys="settings.hotkeys"
          @update="onHotkeyUpdate"
        />
      </section>

      <!-- 卡片 2：绘制参数 -->
      <section class="settings-card">
        <h3 class="card-title">绘制参数</h3>
        <div class="card-body">
          <SliderControl
            label="绘制速度"
            :modelValue="settings.drawSpeed"
            :min="100"
            :max="2000"
            :step="50"
            unit="px/s"
            @update:modelValue="onDrawSpeedChange"
          />

          <div class="setting-row">
            <span class="setting-label">鼠标按键</span>
            <div class="radio-group">
              <button
                class="radio-btn"
                :class="{ active: settings.mouseButton === 'left' }"
                @click="onMouseButtonChange('left')"
              >左键</button>
              <button
                class="radio-btn"
                :class="{ active: settings.mouseButton === 'right' }"
                @click="onMouseButtonChange('right')"
              >右键</button>
            </div>
          </div>

          <SliderControl
            label="叠加层透明度"
            :modelValue="settings.overlayOpacity"
            :min="0.3"
            :max="0.8"
            :step="0.05"
            @update:modelValue="onOpacityChange"
          />

          <div class="setting-row">
            <span class="setting-label">线条颜色</span>
            <div class="color-picker-wrap">
              <input
                type="color"
                class="color-input"
                :value="settings.overlayLineColor"
                @input="onLineColorChange"
              />
              <span class="color-value">{{ settings.overlayLineColor }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 卡片 3：关于 -->
      <section class="settings-card">
        <h3 class="card-title">关于</h3>
        <div class="card-body">
          <div class="about-row">
            <span class="about-label">版本</span>
            <span class="about-value">0.1.0</span>
          </div>
          <div class="about-row">
            <span class="about-label">技术栈</span>
            <span class="about-value">Electron + Vue 3 + ONNX Runtime + OpenCV</span>
          </div>
          <div class="about-row">
            <span class="about-label">线稿提取引擎</span>
            <span class="about-value">Anime2Sketch + Zhang-Suen 骨架化</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
  background: var(--color-surface-0);
}

.settings-panel::-webkit-scrollbar {
  width: 4px;
}

.settings-panel::-webkit-scrollbar-thumb {
  background: var(--color-surface-400);
  border-radius: 2px;
}

.settings-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 520px;
}

.settings-card {
  background: var(--color-surface-100);
  border: 1px solid var(--color-surface-200);
  border-radius: var(--radius-3);
  padding: var(--space-4) var(--space-5);
  box-shadow: var(--shadow-card);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-surface-800);
  margin: 0 0 var(--space-4);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.setting-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 32px;
}

.setting-label {
  font-size: 12px;
  color: var(--color-surface-700);
  min-width: 72px;
  flex-shrink: 0;
}

.radio-group {
  display: flex;
  gap: 0;
  border: 1px solid var(--color-surface-300);
  border-radius: var(--radius-2);
  overflow: hidden;
}

.radio-btn {
  height: 28px;
  padding: 0 var(--space-4);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-surface-600);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out);
}

.radio-btn:not(:last-child) {
  border-right: 1px solid var(--color-surface-300);
}

.radio-btn:hover {
  background: var(--color-surface-200);
}

.radio-btn.active {
  background: var(--color-primary-500);
  color: #fff;
}

.color-picker-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.color-input {
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 28px;
  border: 2px solid var(--color-surface-300);
  border-radius: var(--radius-2);
  padding: 2px;
  cursor: pointer;
  background: transparent;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 2px;
}

.color-value {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-surface-600);
}

.about-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 28px;
}

.about-label {
  font-size: 12px;
  color: var(--color-surface-500);
  min-width: 72px;
  flex-shrink: 0;
}

.about-value {
  font-size: 12px;
  color: var(--color-surface-700);
}
</style>
