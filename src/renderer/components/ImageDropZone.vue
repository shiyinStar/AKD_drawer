<script setup lang="ts">
import { ref } from 'vue'
import { ImagePlus } from 'lucide-vue-next'

const emit = defineEmits<{
  'file-selected': [result: { filePath: string; dataUrl?: string }]
}>()

const isDragOver = ref(false)
const isInvalidFile = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const acceptedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp']

function isValidFile(name: string): boolean {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
  return acceptedExtensions.includes(ext)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (!e.dataTransfer) return

  const hasFiles = e.dataTransfer.types.includes('Files')
  if (hasFiles) {
    isDragOver.value = true
  }
}

function onDragLeave() {
  isDragOver.value = false
  isInvalidFile.value = false
}

async function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  isInvalidFile.value = false

  const file = e.dataTransfer?.files?.[0]
  if (!file) return

  if (!isValidFile(file.name)) {
    isInvalidFile.value = true
    setTimeout(() => {
      isInvalidFile.value = false
    }, 300)
    return
  }

  const filePath = (file as { path?: string }).path
  if (filePath) {
    // 拖拽文件：通过 path 走主进程导入
    const result = (await window.electronAPI.importImage(filePath)) as {
      success: boolean
      dataUrl?: string
    }
    if (result.success) {
      emit('file-selected', { filePath, dataUrl: result.dataUrl })
    }
  } else {
    // 备用：FileReader 直接读取
    readAndEmit(file)
  }
}

function readAndEmit(file: File) {
  const reader = new FileReader()
  reader.onload = () => {
    emit('file-selected', {
      filePath: file.name,
      dataUrl: reader.result as string,
    })
  }
  reader.readAsDataURL(file)
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  readAndEmit(file)
  input.value = ''
}

function openFilePicker() {
  fileInput.value?.click()
}

function onClick() {
  openFilePicker()
}

defineExpose({ openFilePicker })
</script>

<template>
  <div
    class="drop-zone"
    :class="{
      'drop-zone--drag-over': isDragOver && !isInvalidFile,
      'drop-zone--invalid': isInvalidFile,
    }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @click="onClick"
  >
    <ImagePlus :size="48" stroke-width="1.5" class="drop-zone__icon" />
    <p class="drop-zone__text">拖拽图片到此处或点击选择文件</p>
    <p class="drop-zone__hint">支持 PNG / JPG / JPEG / WebP / BMP</p>
    <input
      ref="fileInput"
      type="file"
      :accept="acceptedExtensions.join(',')"
      class="drop-zone__input"
      @change="onFileChange"
    />
  </div>
</template>

<style scoped>
.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  width: 100%;
  height: 100%;
  border: 2px dashed var(--color-surface-500);
  border-radius: var(--radius-3);
  cursor: pointer;
  transition:
    border-color var(--duration-normal) var(--ease-out),
    background var(--duration-normal) var(--ease-out);
}

.drop-zone:hover {
  border-color: var(--color-surface-600);
}

.drop-zone--drag-over {
  border-color: var(--color-primary-500);
  background: rgba(99, 102, 241, 0.05);
}

.drop-zone--invalid {
  border-color: var(--color-error);
  background: rgba(248, 113, 113, 0.05);
}

.drop-zone__icon {
  color: var(--color-surface-500);
}

.drop-zone__text {
  font-size: 13px;
  color: var(--color-surface-500);
  margin: 0;
}

.drop-zone__hint {
  font-size: 11px;
  color: var(--color-surface-500);
  margin: 0;
}

.drop-zone__input {
  display: none;
}
</style>
