<script setup lang="ts">
import type { StatusState, ErrorInfo } from '../../shared/types.js'
import ImagePanel from './ImagePanel.vue'
import SettingsPanel from './SettingsPanel.vue'

const props = defineProps<{
  activePanel: string
  appStatus: StatusState
  errorInfo: ErrorInfo | null
}>()

const panels: Record<string, unknown> = {
  image: ImagePanel,
  settings: SettingsPanel,
}
</script>

<template>
  <main class="content-router">
    <Transition name="panel" mode="out-in">
      <KeepAlive>
        <component
          :is="panels[props.activePanel] ?? SettingsPanel"
          :key="props.activePanel"
          :appStatus="props.appStatus"
          :errorInfo="props.errorInfo"
        />
      </KeepAlive>
    </Transition>
  </main>
</template>

<style scoped>
.content-router {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.panel-enter-active,
.panel-leave-active {
  transition: opacity var(--duration-normal) var(--ease-in-out);
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}
</style>
