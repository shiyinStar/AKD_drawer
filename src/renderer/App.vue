<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { StatusState, ToastMessage } from '../shared/types.js'
import TitleBar from './components/TitleBar.vue'
import SideNav from './components/SideNav.vue'
import ContentRouter from './components/ContentRouter.vue'
import StatusBar from './components/StatusBar.vue'
import StatusIndicator from './components/StatusIndicator.vue'
import ToastContainer from './components/ToastContainer.vue'

const activePanel = ref<string>('image')
const appStatus = ref<StatusState>('NOT_READY' as StatusState)
const statusExtra = ref<string>('等待导入图片')

function onAppStateChange(state: StatusState) {
  appStatus.value = state
  switch (state) {
    case 'NOT_READY':
      statusExtra.value = '等待导入图片'
      break
    case 'IDLE':
      statusExtra.value = ''
      break
    case 'PREVIEWING':
      statusExtra.value = '1.0x'
      break
    case 'DRAWING':
      statusExtra.value = ''
      break
    case 'ERROR':
      statusExtra.value = ''
      break
  }
}

// Toast 管理
interface ToastItem {
  id: number
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  duration: number
}

const toasts = ref<ToastItem[]>([])
let toastId = 0

function addToast(msg: ToastMessage) {
  const id = ++toastId
  const duration = msg.duration ?? 3000
  toasts.value = [...toasts.value, { id, type: msg.type, message: msg.message, duration }]
  if (toasts.value.length > 3) {
    toasts.value = toasts.value.slice(-3)
  }
  setTimeout(() => {
    removeToast(id)
  }, duration)
}

function removeToast(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

// 调试接口：DevTools 控制台中切换状态／弹出 Toast
Object.defineProperty(window, '__akdDebug', {
  value: {
    setStatus(state: string, extra?: string) {
      onAppStateChange(state as StatusState)
      if (extra !== undefined) statusExtra.value = extra
    },
    toast(type: string, message: string) {
      addToast({ type: type as ToastMessage['type'], message })
    },
  },
  writable: false,
  configurable: true,
})

onMounted(async () => {
  try {
    const state = await window.electronAPI.getAppState()
    onAppStateChange(state)
  } catch {
    // preload 不可用
  }

  window.electronAPI.onAppStateChange((state) => onAppStateChange(state))
  window.electronAPI.onToast((toast) => addToast(toast))
})
</script>

<template>
  <div class="app-layout" data-theme="dark">
    <TitleBar />
    <div class="app-layout__body">
      <SideNav v-model:activePanel="activePanel" />
      <ContentRouter :activePanel="activePanel" />
    </div>
    <StatusBar>
      <template #indicator>
        <StatusIndicator :status="appStatus" :extraInfo="statusExtra" />
      </template>
    </StatusBar>
    <ToastContainer :toasts="toasts" @remove="removeToast" />
  </div>
</template>

<style>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-layout__body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
