<script setup lang="ts">
import { Image, Settings, Info } from 'lucide-vue-next'
import NavItem from './NavItem.vue'

defineProps<{
  activePanel: string
}>()

defineEmits<{
  'update:activePanel': [value: string]
}>()
</script>

<template>
  <nav class="side-nav">
    <div class="side-nav__top">
      <NavItem
        :icon="Image"
        label="图片面板"
        :active="activePanel === 'image'"
        @click="$emit('update:activePanel', 'image')"
      />
      <NavItem
        :icon="Settings"
        label="设置面板"
        :active="activePanel === 'settings'"
        @click="$emit('update:activePanel', 'settings')"
      />
    </div>
    <div class="side-nav__bottom">
      <NavItem
        :icon="Info"
        label="关于"
        :active="false"
        @click="$emit('update:activePanel', 'about')"
      />
    </div>
  </nav>
</template>

<style scoped>
.side-nav {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 48px;
  background: var(--color-surface-100);
  border-right: 1px solid var(--color-surface-200);
  flex-shrink: 0;
}

.side-nav__top,
.side-nav__bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
