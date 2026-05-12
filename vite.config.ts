import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  root: 'src/renderer',
  base: './',
  build: {
    target: 'esnext',
    modulePreload: false,
    outDir: '../../dist/renderer',
    rollupOptions: {
      input: {
        main: 'src/renderer/index.html',
        overlay: 'src/renderer/overlay/index.html',
      },
    },
  },
})
