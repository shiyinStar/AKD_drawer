# AKD 开发进度

**最后更新**: 2026-05-11

---

## 阶段 0：项目脚手架与 ESM 根基 ✅ 完成

### 步骤 0.1 — 初始化项目仓库 ✅
- `git init` 初始化空仓库
- `package.json`: `"type": "module"`（全局 ESM）、`"private": true`
- 占位 scripts: `dev`、`build`、`start`
- `.gitignore`: `node_modules/`、`dist/`、`out/`、`config.json`、`.env`、`*.log`
- `README.md`: 单行项目名

### 步骤 0.2 — 安装全部生产依赖 ✅
**生产依赖**: electron@42.0.1, vue@3.5.34, lucide-vue-next@0.400.0, @fontsource/inter@5.2.8, @fontsource/jetbrains-mono@5.2.8, onnxruntime-node@1.26.0, @techstark/opencv-js@4.12.0-release.1, @nut-tree-fork/nut-js@4.2.6, electron-store@11.0.2, sharp@0.34.5

**开发依赖**: typescript, vite@8.0.11, @vitejs/plugin-vue, esbuild, electron-builder, @electron/rebuild, tsx

**注意**: Electron 二进制下载需通过镜像（中国网络），命令: `ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" node node_modules/electron/install.js`

### 步骤 0.3 — TypeScript 配置文件 ✅
| 配置 | module | moduleResolution | include | outDir |
|------|--------|-----------------|---------|--------|
| tsconfig.json | — | — | project references | — |
| tsconfig.main.json | NodeNext | nodenext | src/main/**, src/preload/** | dist/main |
| tsconfig.worker.json | NodeNext | nodenext | src/workers/** | dist/workers |
| tsconfig.renderer.json | ESNext | bundler | src/renderer/** | dist/renderer |
| tsconfig.shared.json | NodeNext | nodenext | src/shared/** | dist/shared |

所有配置: `strict: true`, `target: "ES2022"`, `sourceMap: true`

### 步骤 0.4 — Vite 配置 ✅
- `vite.config.ts`: `vue()` 插件、`root: 'src/renderer'`、`base: './'`、`build.modulePreload: false`

### 步骤 0.5 — Esbuild 构建脚本 ✅
- `scripts/build-main.mjs`: 构建 main + preload → `dist/main/`
- `scripts/build-workers.mjs`: 构建 inference + path-extraction workers → `dist/workers/`
- 均: `format: 'esm'`、`platform: 'node'`、`target: 'node20'`

### 步骤 0.6 — 共享类型定义 ✅
`src/shared/types.ts` 包含:
- `StatusState` 枚举 (NOT_READY, IDLE, PREVIEWING, DRAWING, ERROR)
- `Point`, `DrawPath`, `BoundingBox` 接口
- `AppConfig`, `PipelineProgress`, `ErrorInfo` 接口
- `IPC_CHANNELS` 常量 (10 个通道)

---

## 阶段 1：Electron 最小可启动骨架 ✅ 完成

### 步骤 1.1 — Main Process 入口 ✅
- `src/main/index.ts`：Electron 主进程入口
  - `app.whenReady()` → `createMainWindow()`（960×680，`show: false` + `ready-to-show` 避免白屏）
  - CSP 通过 `session.defaultSession.webRequest.onHeadersReceived` 设置
  - Dev/prod URL 切换：`app.isPackaged` ? `loadFile` : `loadURL`
  - `window-all-closed` 不调用 `app.quit()`（保留系统托盘）
  - 全部使用 `node:` 协议导入，`import.meta.url` + `fileURLToPath` 替代 `__dirname`
- `package.json`：添加 `"main": "dist/main/main/index.js"`（esbuild 输出路径）

### 步骤 1.2 — Preload 脚本 ✅
- `src/preload/index.ts`：`contextBridge.exposeInMainWorld` 暴露 `window.electronAPI`
  - 9 个方法：`getAppState`、`onAppStateChange`、`onPipelineProgress`、`onDrawStatus`、`onAppError`、`importImage`、`retryFromError`、`updateSettings`、`exportLineArt`
  - 全部使用 `ipcRenderer.invoke`/`on` Promise 模式
  - 从 `../shared/types.js` 导入 `IPC_CHANNELS` 常量

### 步骤 1.3 — Renderer HTML + Vue 入口 ✅
- `src/renderer/env.d.ts`：`.vue` 文件模块声明 + `window.electronAPI` 全局接口
- `src/renderer/main.ts`：Vue 入口，导入字体 CSS + 全局样式 + `createApp(App).mount('#app')`
- `src/renderer/App.vue`：最小 SFC，显示 "AKD" 文字
- `src/renderer/styles/global.css`：CSS reset + 暗色背景 + 字体族

### 步骤 1.4 — 开发模式启动编排 ✅
- `scripts/dev.ts`：spawn Vite → HTTP 轮询等待 `localhost:5173` 就绪 → spawn Electron
- `package.json` dev 脚本：`"dev": "npx tsx scripts/dev.ts"`
- **已验证**：`npm run dev` → Vite dev server 启动 → Electron 窗口出现，显示 "AKD"

### 遇到的问题
- Node.js v24 对 `.mjs` 文件不做 TS 类型剥离，`data: Buffer` 导致 `SyntaxError`。解决：重命名为 `.ts` + `tsx` 运行
- `session.defaultSession` 是静态成员，不能通过 `win.webContents.session.defaultSession` 调用

---

## 下一步：阶段 2 — 核心基础设施

- 步骤 2.1: IPC 通信层
- 步骤 2.2: 全局状态机
- 步骤 2.3: 配置存储
- 步骤 2.4: 应用上下文

---

## 给后续开发者的备注

1. Main Process、Preload、Renderer 入口已实现，Worker 文件仍为占位注释
2. Node.js v24 内置 TS strip 模式不支持 enum 语法，需经 esbuild/tsx 编译后使用
3. 项目遵循 100% ESM，禁止 CommonJS（nut-js 有唯一的 CJS Adapter）
4. `@techstark/opencv-js` 实际版本号是 `4.12.0-release.1`，非 `^4.12.0`
