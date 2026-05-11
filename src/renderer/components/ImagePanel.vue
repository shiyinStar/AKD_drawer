<script setup lang="ts">
import { ref, nextTick } from 'vue'
import ImageDropZone from './ImageDropZone.vue'
import ImageCompare from './ImageCompare.vue'
import PanelToolbar from './PanelToolbar.vue'

const hasImage = ref(false)
const originalSrc = ref<string | null>(null)
const lineArtSrc = ref<string | null>(null)
const isProcessing = ref(false)
const dropZoneRef = ref<InstanceType<typeof ImageDropZone> | null>(null)

async function onFileSelected(result: { filePath: string; dataUrl?: string }) {
  if (result.dataUrl) {
    originalSrc.value = result.dataUrl
    hasImage.value = true
  }
}

async function onImportClick() {
  hasImage.value = false
  originalSrc.value = null
  lineArtSrc.value = null
  await nextTick()
  dropZoneRef.value?.openFilePicker()
}
</script>

<template>
  <div class="image-panel">
    <PanelToolbar
      :hasImage="hasImage"
      @import="onImportClick"
    />
    <div class="image-panel__content">
      <ImageDropZone
        v-if="!hasImage"
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
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
