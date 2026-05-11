<script setup lang="ts">
import { ref } from 'vue'
import { Image } from 'lucide-vue-next'
import ImageDropZone from './ImageDropZone.vue'
import PanelToolbar from './PanelToolbar.vue'

const hasImage = ref(false)
const dropZoneRef = ref<InstanceType<typeof ImageDropZone> | null>(null)

function onFileSelected(_filePath: string) {
  hasImage.value = true
}

function onImportClick() {
  // 触发 ImageDropZone 中的文件选择器
  // 当 hasImage 为 true 时需要重新渲染 drop zone，这里直接重置状态
  hasImage.value = false
}
</script>

<template>
  <div class="image-panel">
    <PanelToolbar
      :hasImage="hasImage"
      @import="onImportClick"
    />
    <div class="image-panel__content">
      <!-- 未导入：整块拖拽区 -->
      <ImageDropZone
        v-if="!hasImage"
        ref="dropZoneRef"
        @file-selected="onFileSelected"
      />
      <!-- 已导入：左右双栏 -->
      <template v-else>
        <div class="image-panel__col image-panel__col--left">
          <div class="image-panel__placeholder">
            <Image :size="32" stroke-width="1.5" class="image-panel__placeholder-icon" />
            <span class="image-panel__placeholder-label">原图</span>
          </div>
        </div>
        <div class="image-panel__col image-panel__col--right">
          <div class="image-panel__placeholder">
            <Image :size="32" stroke-width="1.5" class="image-panel__placeholder-icon" />
            <span class="image-panel__placeholder-label">线稿</span>
          </div>
        </div>
      </template>
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

.image-panel__col {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-panel__col--left {
  border-right: 1px solid var(--color-surface-300);
}

.image-panel__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.image-panel__placeholder-icon {
  color: var(--color-surface-400);
}

.image-panel__placeholder-label {
  font-size: 13px;
  color: var(--color-surface-500);
}
</style>
