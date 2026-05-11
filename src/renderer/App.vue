<script setup lang="ts">
import { ref } from 'vue'
import TitleBar from './components/TitleBar.vue'
import SideNav from './components/SideNav.vue'
import ContentRouter from './components/ContentRouter.vue'
import StatusBar from './components/StatusBar.vue'

const activePanel = ref<string>('image')
</script>

<template>
  <div class="app-layout" data-theme="dark">
    <TitleBar />
    <div class="app-layout__body">
      <SideNav v-model:activePanel="activePanel" />
      <ContentRouter :activePanel="activePanel" />
    </div>
    <StatusBar />
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
