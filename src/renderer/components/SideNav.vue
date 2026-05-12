<script setup lang="ts">
import { Image, Settings, Sun, Moon } from 'lucide-vue-next'
import NavItem from './NavItem.vue'

defineProps<{
  activePanel: string
  theme: 'dark' | 'light'
}>()

defineEmits<{
  'update:activePanel': [value: string]
  'toggle-theme': []
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
      <span class="theme-label">{{ theme === 'dark' ? '深色' : '浅色' }}</span>
      <button class="theme-toggle" :title="theme === 'dark' ? '切换浅色' : '切换深色'" @click="$emit('toggle-theme')">
        <Moon v-if="theme === 'dark'" :size="16" stroke-width="1.5" />
        <Sun v-else :size="16" stroke-width="1.5" />
      </button>
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

.side-nav__top {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.side-nav__bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: var(--space-2);
  gap: 2px;
}

.theme-label {
  font-size: 10px;
  color: var(--color-surface-500);
  user-select: none;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-2);
  background: transparent;
  color: var(--color-surface-500);
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out);
}

.theme-toggle:hover {
  color: var(--color-primary-500);
  background: var(--color-surface-200);
}

.theme-toggle:active {
  transform: scale(0.92);
}
</style>
