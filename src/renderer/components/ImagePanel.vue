<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import type { StatusState, ErrorInfo } from '../../shared/types.js'
import ImageDropZone from './ImageDropZone.vue'
import ImageCompare from './ImageCompare.vue'
import PanelToolbar from './PanelToolbar.vue'
import ErrorOverlay from './ErrorOverlay.vue'

const props = defineProps<{
  appStatus: StatusState
  errorInfo: ErrorInfo | null
}>()

const hasImage = ref(false)
const originalSrc = ref<string | null>(null)
const lineArtSrc = ref<string | null>(null)
const isProcessing = ref(false)
const dropZoneRef = ref<InstanceType<typeof ImageDropZone> | null>(null)

const hasLineArt = computed(() => lineArtSrc.value !== null)

const showError = computed(() => props.appStatus === 'ERROR' && props.errorInfo !== null)

watch(
  () => props.appStatus,
  (newStatus, oldStatus) => {
    if (oldStatus === 'ERROR' && newStatus === 'NOT_READY') {
      hasImage.value = false
      originalSrc.value = null
      lineArtSrc.value = null
      isProcessing.value = false
    }
  },
)

async function onRetry() {
  try {
    await window.electronAPI.retryFromError()
  } catch {
    // IPC 未实现
  }
}

function onOpenLog(_logPath: string) {
  // logPath 目前为空，后续可接入 shell.openPath
}

async function onFileSelected(result: { filePath: string; dataUrl?: string }) {
  if (result.dataUrl) {
    originalSrc.value = result.dataUrl
    hasImage.value = true
    isProcessing.value = true
  }
}

async function onImportClick() {
  hasImage.value = false
  originalSrc.value = null
  lineArtSrc.value = null
  isProcessing.value = false
  await nextTick()
  dropZoneRef.value?.openFilePicker()
}

async function onExportClick() {
  try {
    await window.electronAPI.exportLineArt()
  } catch {
    // IPC 未实现
  }
}

onMounted(() => {
  window.electronAPI.onPipelineComplete((data) => {
    if (data.lineArtBase64) {
      lineArtSrc.value = `data:image/png;base64,${data.lineArtBase64}`
    }
    isProcessing.value = false
  })
})
</script>

<template>
  <div class="image-panel">
    <PanelToolbar
      :hasImage="hasImage"
      :hasLineArt="hasLineArt"
      @import="onImportClick"
      @export="onExportClick"
    />
    <div class="image-panel__content">
      <ErrorOverlay
        v-if="showError"
        :error="props.errorInfo!"
        @retry="onRetry"
        @openLog="onOpenLog"
      />
      <ImageDropZone
        v-else-if="!hasImage"
        ref="dropZoneRef"
        @file-selected="onFileSelected"
      />
      <ImageCompare
        v-else
        :originalSrc="originalSrc"
        :lineArtSrc="lineArtSrc"
        :loading="isProcessing"
      />
    </div>
  </div>
</template>

<style scoped>
.image-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.image-panel__content {
  position: relative;
  display: flex;
  flex: 1;
  overflow: hidden;
  background: var(--color-surface-0);
}
</style>
