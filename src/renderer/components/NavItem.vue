<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
  label: string
  active: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    class="nav-item"
    :class="{ active }"
    :title="label"
    @click="$emit('click')"
  >
    <component :is="icon" :size="20" stroke-width="1.5" />
  </button>
</template>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  background: transparent;
  color: var(--color-surface-500);
  cursor: pointer;
  position: relative;
  transition: color var(--duration-fast) var(--ease-out);
}

.nav-item:hover {
  color: var(--color-surface-700);
}

.nav-item.active {
  color: var(--color-primary-500);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 20px;
  background: var(--color-primary-500);
  border-radius: 0 1px 1px 0;
}
</style>
