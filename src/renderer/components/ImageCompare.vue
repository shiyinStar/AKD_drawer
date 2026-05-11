<script setup lang="ts">
import ImageViewer from './ImageViewer.vue'

defineProps<{
  originalSrc: string | null
  lineArtSrc: string | null
  loading: boolean
}>()
</script>

<template>
  <div class="image-compare">
    <div class="image-compare__col">
      <ImageViewer
        :src="originalSrc"
        :loading="false"
        label="原图"
      />
    </div>
    <div class="image-compare__col image-compare__col--right">
      <ImageViewer
        :src="lineArtSrc"
        :loading="loading"
        label="线稿"
      />
    </div>
  </div>
</template>

<style scoped>
.image-compare {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.image-compare__col {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.image-compare__col--right {
  border-left: 1px solid var(--color-surface-300);
}
</style>
