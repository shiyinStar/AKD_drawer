<script setup lang="ts">
</script>

<template>
  <footer class="status-bar">
    <div class="status-left">
      <slot name="indicator" />
    </div>
    <div class="status-right">
      <slot name="tasks" />
    </div>
  </footer>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
  padding: 0 var(--space-3);
  background: var(--color-surface-100);
  border-top: 1px solid var(--color-surface-200);
  flex-shrink: 0;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
</style>
