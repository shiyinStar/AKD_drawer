<script setup lang="ts">
import { ref, computed } from 'vue'
import { Image } from 'lucide-vue-next'

const props = defineProps<{
  src: string | null
  loading: boolean
  label: string
}>()

const zoomLevel = ref(1)
const MIN_ZOOM = 0.1
const MAX_ZOOM = 2.0
const ZOOM_STEP = 0.05

const panX = ref(0)
const panY = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const panStartX = ref(0)
const panStartY = ref(0)

function onWheel(e: WheelEvent) {
  if (!props.src) return
  e.preventDefault()
  const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel.value + delta))
  if (newZoom <= 1) {
    panX.value = 0
    panY.value = 0
  }
  zoomLevel.value = newZoom
}

function onMouseDown(e: MouseEvent) {
  if (!props.src || zoomLevel.value <= 1) return
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  panStartX.value = panX.value
  panStartY.value = panY.value
  e.preventDefault()
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  const dx = (e.clientX - dragStartX.value) / zoomLevel.value
  const dy = (e.clientY - dragStartY.value) / zoomLevel.value
  panX.value = panStartX.value + dx
  panY.value = panStartY.value + dy
}

function onMouseUp() {
  isDragging.value = false
}

const zoomPercent = computed(() => Math.round(zoomLevel.value * 100))

const cursorStyle = computed(() => {
  if (!props.src || zoomLevel.value <= 1) return 'default'
  return isDragging.value ? 'grabbing' : 'grab'
})
</script>

<template>
  <div class="image-viewer" @wheel="onWheel">
    <!-- 加载骨架屏 -->
    <div v-if="loading" class="image-viewer__skeleton">
      <div class="image-viewer__skeleton-bar image-viewer__skeleton-bar--1" />
      <div class="image-viewer__skeleton-bar image-viewer__skeleton-bar--2" />
      <div class="image-viewer__skeleton-bar image-viewer__skeleton-bar--3" />
      <div class="image-viewer__skeleton-shimmer" />
    </div>

    <!-- 图片显示 -->
    <div
      v-else-if="src"
      class="image-viewer__image-wrap"
      :style="{
        transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
        cursor: cursorStyle,
      }"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
    >
      <img :src="src" class="image-viewer__image" :alt="label" />
    </div>

    <!-- 空状态 -->
    <div v-else class="image-viewer__empty">
      <Image :size="32" stroke-width="1.5" class="image-viewer__empty-icon" />
      <span class="image-viewer__empty-label">{{ label }}</span>
    </div>

    <!-- 缩放指示器 -->
    <div v-if="src && zoomLevel !== 1" class="image-viewer__zoom-badge">
      {{ zoomPercent }}%
    </div>
  </div>
</template>

<style scoped>
.image-viewer {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--color-surface-0);
}

.image-viewer__image-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  max-height: 100%;
}

.image-viewer__image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-viewer__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.image-viewer__empty-icon {
  color: var(--color-surface-400);
}

.image-viewer__empty-label {
  font-size: 13px;
  color: var(--color-surface-500);
}

.image-viewer__zoom-badge {
  position: absolute;
  bottom: var(--space-2);
  right: var(--space-2);
  padding: 2px 8px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-1);
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--color-surface-700);
  pointer-events: none;
}

/* 骨架屏 */
.image-viewer__skeleton {
  width: 80%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  position: relative;
  overflow: hidden;
}

.image-viewer__skeleton-bar {
  height: 12px;
  background: var(--color-surface-200);
  border-radius: var(--radius-2);
}

.image-viewer__skeleton-bar--1 {
  width: 100%;
}

.image-viewer__skeleton-bar--2 {
  width: 70%;
}

.image-viewer__skeleton-bar--3 {
  width: 85%;
}

.image-viewer__skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.03) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
