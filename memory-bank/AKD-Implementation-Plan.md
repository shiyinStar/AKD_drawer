# AKD 实施计划

**日期**: 2026-05-10
**原则**: 基础优先、每一步小而可验证、先跑通完整骨架再丰满功能。

---

## 阶段 0：项目脚手架与 ESM 根基

### 步骤 0.1 — 初始化项目仓库

- 创建空目录 `AKD`，`git init`
- 创建 `package.json`：
  - `"name": "akd"`
  - `"type": "module"`（全局 ESM）
  - `"private": true`
  - 占位 scripts：`dev`、`build`、`start`
- 创建 `.gitignore`（含 `node_modules/`、`dist/`、`out/`、`config.json`、`.env`）
- 创建 `README.md`（一行项目名即可）

**验证**：
1. `node -e "console.log('ESM OK')"` 在项目根目录执行成功
2. `git status` 显示待提交文件列表包含上述文件

---

### 步骤 0.2 — 安装全部生产依赖

- 安装以下 npm 包至 `dependencies`：
  - `electron` (^42)
  - `vue` (^3)
  - `lucide-vue-next` (^0.400)
  - `@fontsource/inter` (^5)
  - `@fontsource/jetbrains-mono` (^5)
  - `onnxruntime-node`
  - `@techstark/opencv-js` (^4.12.0)
  - `@nut-tree-fork/nut-js`
  - `electron-store` (^11)
  - `sharp` (^0.34)

- 安装以下 npm 包至 `devDependencies`：
  - `typescript`
  - `vite`
  - `@vitejs/plugin-vue`
  - `esbuild`
  - `electron-builder`
  - `@electron/rebuild`
  - `tsx`

**验证**：
1. `node -e "import('vue')"` 不报错
2. `node -e "import('electron-store')"` 不报错
3. `node_modules/` 目录存在且包含以上所有包

---

### 步骤 0.3 — 创建 TypeScript 配置文件

- 创建 `tsconfig.json`（根配置，仅设 `compilerOptions` 基线和 `references`）
- 创建 `tsconfig.main.json`：
  - `"module": "NodeNext"`、`"moduleResolution": "nodenext"`
  - `"include": ["src/main/**/*"]`
  - `"outDir": "dist/main"`
- 创建 `tsconfig.worker.json`：
  - `"module": "NodeNext"`、`"moduleResolution": "nodenext"`
  - `"include": ["src/workers/**/*"]`
  - `"outDir": "dist/workers"`
- 创建 `tsconfig.renderer.json`：
  - `"module": "ESNext"`、`"moduleResolution": "bundler"`
  - `"include": ["src/renderer/**/*"]`
  - `"outDir": "dist/renderer"`
- 创建 `tsconfig.shared.json`：
  - `"module": "NodeNext"`、`"moduleResolution": "nodenext"`
  - `"include": ["src/shared/**/*"]`
  - `"outDir": "dist/shared"`
- 每个配置均设 `"strict": true`、`"target": "ES2022"`、`"sourceMap": true`

**验证**：
1. `npx tsc -p tsconfig.main.json --noEmit` 无报错（尚无源文件也可通过）
2. `npx tsc -p tsconfig.worker.json --noEmit` 无报错
3. `npx tsc -p tsconfig.renderer.json --noEmit` 无报错
4. `npx tsc -p tsconfig.shared.json --noEmit` 无报错

---

### 步骤 0.4 — 创建 Vite 配置

- 创建 `vite.config.ts`：
  - 插件：`vue()`
  - `build.target: 'esnext'`
  - `build.modulePreload: false`
  - `root: 'src/renderer'`
  - `base: './'`
  - `build.outDir: '../../dist/renderer'`

**验证**：
1. `npx vite build` 不报错（尚无源文件也不会崩溃）

---

### 步骤 0.5 — 创建 esbuild 构建脚本

- 创建 `scripts/build-main.mjs`（自身为 `.mjs` 文件）：
  - 使用 `esbuild.build()` 构建 `src/main/` 下所有 `.ts` 入口
  - 参数：`format: 'esm'`、`platform: 'node'`、`target: 'node20'`
  - `external` 列表包含 `electron`、`onnxruntime-node`、`@techstark/opencv-js`、`sharp`、以及所有 `node:xxx` 内置模块
  - `outdir: 'dist/main'`

- 创建 `scripts/build-workers.mjs`（同理）：
  - 构建 `src/workers/` 下所有 Worker 入口
  - 使用与 `build-main.mjs` 相同的 esbuild 参数
  - `outdir: 'dist/workers'`

**验证**：
1. `node scripts/build-main.mjs` 不报错
2. `node scripts/build-workers.mjs` 不报错

---

### 步骤 0.6 — 创建共享类型定义

- 创建 `src/shared/types.ts`，定义以下内容：
  - `StatusState` 枚举：`NOT_READY`、`IDLE`、`PREVIEWING`、`DRAWING`、`ERROR`
  - `Point` 接口：`{ x: number; y: number }`
  - `DrawPath` 类型：`Point[]`
  - `BoundingBox` 接口：`{ minX: number; minY: number; width: number; height: number }`
  - `AppConfig` 接口：hotkeys（嵌套对象，含 preview/startDraw/stopDraw 三个 string 字段）、drawSpeed（number）、mouseButton（`'left' | 'right'`）、overlayOpacity（number）、overlayLineColor（string）
  - `PipelineProgress` 接口：`{ stage: string; progress: number }`
  - `ErrorInfo` 接口：`{ reason: string; suggestion: string; logPath: string }`
  - IPC 通道名常量集合（`IPC_CHANNELS` 对象）：包含 `IMPORT_IMAGE`、`PIPELINE_PROGRESS`、`PIPELINE_COMPLETE`、`HOTKEY_TRIGGERED`、`DRAW_STATUS`、`APP_ERROR`、`RETRY_FROM_ERROR`、`UPDATE_SETTINGS`、`APP_STATE`、`OVERLAY_SCALE_CHANGED`

**验证**：
1. `npx tsc -p tsconfig.shared.json --noEmit` 通过，0 类型错误
2. `StatusState.NOT_READY` 枚举值经编译后可直接被 JavaScript 引用

---

## 阶段 1：Electron 最小可启动骨架

### 步骤 1.1 — 创建 Main Process 入口

- 创建 `src/main/index.ts`（入口文件）：
  - 使用 `node:` 协议导入 `app`、`BrowserWindow`（来自 `electron`）
  - 使用 `node:` 协议导入 `node:path`、`node:url`
  - 在 `app.whenReady()` 中创建最小 `BrowserWindow`：
    - 尺寸：960 × 680
    - `show: false` 配合 `ready-to-show` 事件后再 `show`（避免白屏闪烁）
    - `webPreferences.preload` 指向后续创建的 preload 脚本编译产物路径
    - 开发模式加载 `http://localhost:5173`，生产模式加载 `dist/renderer/index.html`
  - `app.on('window-all-closed')` 中不调用 `app.quit()`（保留托盘）
  - 设置 Content-Security-Policy：`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'`
  - 所有相对导入必须带 `.js` 后缀
  - 禁止使用 `__dirname`、`__filename`——用 `import.meta.url` + `fileURLToPath` 替代

**验证**：
1. `npx tsc -p tsconfig.main.json --noEmit` 通过
2. `node scripts/build-main.mjs` 成功产出 `dist/main/index.js`
3. 编译产物中无 `require()` 调用、无 `__dirname` 引用
4. `grep -r "from 'fs'" dist/main/` 无匹配（所有 Node 内置模块使用 `node:` 前缀）

---

### 步骤 1.2 — 创建 Preload 脚本

- 创建 `src/preload/index.ts`（preload 脚本）：
  - 使用 `contextBridge.exposeInMainWorld` 暴露 `electronAPI` 对象
  - `electronAPI` 包含以下方法（全部走 `ipcRenderer.invoke` / `ipcRenderer.on`）：
    - `getAppState()` — 获取当前状态（invoke）
    - `onAppStateChange(callback)` — 监听状态变更（on）
    - `onPipelineProgress(callback)` — 监听推理/提取进度（on）
    - `onDrawStatus(callback)` — 监听绘制状态（on）
    - `onAppError(callback)` — 监听错误（on）
    - `importImage(filePath)` — 触发图片导入（invoke）
    - `retryFromError()` — 从错误恢复（invoke）
    - `updateSettings(partialSettings)` — 更新部分配置（invoke）
    - `exportLineArt()` — 导出线稿 PNG（invoke）
  - 所有 `ipcRenderer` 导入来自 `electron`
  - 禁止使用 `require()`、禁止使用 `__dirname`

**验证**：
1. `npx tsc -p tsconfig.main.json --noEmit` 通过（preload 也走 Main Process 的 tsconfig）
2. 文件中无 `require()`、无 `__dirname`/`__filename`
3. 所有 `ipcRenderer` 方法调用均为安全的 invoke/on 模式（非 `sendSync`）

---

### 步骤 1.3 — 创建最小 Renderer HTML + Vue 入口

- 创建 `src/renderer/index.html`：
  - 标准 HTML5 模板
  - `<title>AKD</title>`
  - `<div id="app"></div>`
  - `<script type="module" src="./main.ts"></script>`

- 创建 `src/renderer/main.ts`：
  - `import { createApp } from 'vue'`
  - 导入字体 CSS（`@fontsource/inter/400.css`、`500.css`、`600.css`、`@fontsource/jetbrains-mono/400.css`、`500.css`）
  - 导入全局 CSS（`./styles/global.css`）
  - `createApp(App).mount('#app')`

- 创建 `src/renderer/App.vue`：
  - 最小 SFC：`<template>` 内仅一个 `<div>` 显示 "AKD" 文字
  - 无 props、无状态、无 script setup

**验证**：
1. `npx vite build` 成功产出 `dist/renderer/index.html` 及打包 JS/CSS
2. `npx vite` 启动 dev server → 浏览器打开 `localhost:5173` → 页面显示 "AKD" 文字
3. 浏览器 DevTools Console 无报错
4. 字体 CSS 通过 `@fontsource/inter` 导入后 Vite 构建不报模块解析错误

---

### 步骤 1.4 — Electron 开发模式启动编排

- 更新 `package.json` 的 `dev` 脚本，实现：
  - 先启动 Vite dev server（端口 5173）
  - 等待 Vite ready → 再启动 Electron 并指向 `http://localhost:5173`
  - 可选方案：使用 `tsx scripts/dev.mjs` 编排脚本

- 创建 `scripts/dev.mjs`（编排脚本）：
  - 使用 `node:child_process` 的 `spawn` 启动 Vite dev server
  - 监听 stdout 中 Vite 的就绪信号 → spawn Electron 进程
  - Electron 附加 `--inspect` 参数便于调试
  - 所有导入使用 `node:` 协议

**验证**：
1. `npm run dev` → Electron 窗口出现，显示 "AKD" 文字
2. 窗口大小约 960×680
3. 关闭窗口后 Electron 进程退出（此阶段直接退出可接受）
4. `ctrl+shift+i` 可打开 DevTools

---

## 阶段 2：核心基础设施

### 步骤 2.1 — IPC 通信层（Main Process 侧）

- 创建 `src/main/ipc-handlers.ts`：
  - 导入 `ipcMain`（来自 `electron`）
  - 集中注册所有 IPC handler（使用 `ipcMain.handle` 模式）
  - 每个 handler 签名与 preload 暴露的 API 一一对应
  - 当前阶段所有 handler 返回占位数据或空实现
  - 使用 `node:` 协议导入 Node 内置模块
  - 所有相对导入带 `.js` 后缀

**验证**：
1. `npx tsc -p tsconfig.main.json --noEmit` 通过
2. 文件中无 `require()`、无 `module.exports`
3. IPC handler 注册数量与 preload 暴露的 API 数量一致
4. 所有 handler 使用 `ipcMain.handle` 而非 `ipcMain.on`（Promise 模式）

---

### 步骤 2.2 — 全局状态机实现

- 创建 `src/main/state-machine.ts`：
  - 从 `src/shared/types.ts` 导入 `StatusState` 枚举
  - 内部维护私有状态字段，仅通过 `getState()` 方法读取
  - `transition(newState)` 方法：
    - 校验转移合法性（仅允许设计文档 §7.1 中定义的有效转移路径）
    - 非法转移 → 抛出 `InvalidTransitionError`（自定义 Error 子类）
    - 合法转移 → 更新内部状态 → 触发 `state-change` 事件
  - 从 `NOT_READY` 允许转至：`IDLE`、`ERROR`
  - 从 `IDLE` 允许转至：`PREVIEWING`、`NOT_READY`、`ERROR`
  - 从 `PREVIEWING` 允许转至：`DRAWING`、`IDLE`（退出预览）、`NOT_READY`、`ERROR`
  - 从 `DRAWING` 允许转至：`IDLE`（停止绘制）、`NOT_READY`、`ERROR`
  - 从 `ERROR` 允许转至：`NOT_READY`（仅通过重试按钮）
  - 使用 `EventEmitter`（来自 `node:events`）发布状态变更事件
  - 导出单例实例

**验证**：
1. `npx tsc -p tsconfig.main.json --noEmit` 通过
2. 编写 `tests/unit/state-machine.test.ts`：
   - 初始状态为 `NOT_READY`
   - `NOT_READY → IDLE` 合法转移成功
   - `IDLE → PREVIEWING` 合法转移成功
   - `PREVIEWING → DRAWING` 合法转移成功
   - `DRAWING → IDLE` 合法转移成功
   - `IDLE → DRAWING`（跳过 PREVIEWING）非法转移抛异常
   - `NOT_READY → DRAWING` 非法转移抛异常
   - `ERROR` 可从 `NOT_READY`/`IDLE`/`PREVIEWING`/`DRAWING` 任意状态转入
   - `ERROR → NOT_READY` 合法转移成功
   - `ERROR → IDLE`（直接跳过 NOT_READY）非法
   - 状态变更后 `state-change` 事件被触发，且事件参数包含旧状态和新状态
3. 用 `npx tsx tests/unit/state-machine.test.ts` 执行，全部通过

---

### 步骤 2.3 — 配置存储初始化

- 创建 `src/main/config-store.ts`：
  - 使用 `electron-store` v11 原生 ESM 导入（`import Store from 'electron-store'`）
  - 配置文件落于 `path.dirname(process.execPath) + '/config.json'`（便携化部署）
  - 定义 `schema`（类型校验与默认值）：
    - `hotkeys.preview`：默认 `'F5'`
    - `hotkeys.startDraw`：默认 `'F6'`
    - `hotkeys.stopDraw`：默认 `'F7'`
    - `drawSpeed`：默认 `500`，范围 100~2000
    - `mouseButton`：默认 `'left'`，枚举 `'left'` | `'right'`
    - `overlayOpacity`：默认 `0.6`，范围 0.3~0.8
    - `overlayLineColor`：默认 `'#000000'`
  - 导出方法：`get(key)`、`set(key, value)`、`getAll()`、`reset(key)`
  - 导出 `onDidChange(key, callback)` 监听器
  - `reset(key)` 将指定 key 恢复为 schema 中定义的默认值

**验证**：
1. `npx tsc -p tsconfig.main.json --noEmit` 通过
2. 文件中使用 `import Store from 'electron-store'`，无 CJS 互操作
3. schema 中所有字段及其类型/默认值与设计文档 §10.2 完全一致
4. 编写 `tests/unit/config-store.test.ts`：
   - 模拟 `process.execPath` 指向临时目录
   - 测试写入 → 读取 → 修改 → 重置默认值全流程
   - `onDidChange` 在值变更时回调被触发
   - `reset('drawSpeed')` 后 `get('drawSpeed')` 恢复为 `500`
   - `getAll()` 返回完整配置对象
   - 测试结束后删除临时目录及文件
5. 用 `npx tsx tests/unit/config-store.test.ts` 执行，全部通过

---

### 步骤 2.4 — 应用上下文（依赖注入容器）

- 创建 `src/main/app-context.ts`：
  - 定义 `AppContext` 接口或类，持有以下引用：
    - `stateMachine`：状态机单例
    - `configStore`：配置存储单例
    - `mainWindow`：主 BrowserWindow 引用（初始为 null）
  - 导出 `createAppContext()` 工厂函数，返回初始化后的上下文对象
  - 各模块通过参数接收 `AppContext`，禁止直接 import 全局变量
- 更新 `src/main/index.ts`：
  - `app.whenReady()` 中先创建 `AppContext` → 初始化状态机 + 配置 → 创建窗口 → 设置 IPC → 创建托盘

**验证**：
1. `npx tsc -p tsconfig.main.json --noEmit` 通过
2. 三个核心模块（状态机、配置存储、应用上下文）互相之间无循环依赖
3. `src/main/index.ts` 入口文件中无 `require()` 调用
4. 各模块通过构造参数或方法参数接收依赖，不通过全局单例 import

---

## 阶段 3：渲染进程 UI 骨架

### 步骤 3.1 — 全局 CSS 变量与主题

- 创建 `src/renderer/styles/tokens.css`：
  - `:root` 下定义全部 CSS 自定义属性：
    - 颜色系统（主色、暗色表面 9 阶、语义色、叠加层色、毛玻璃色）
    - 排版（字体链、字号、字重）
    - 间距（7 级等比：4/8/12/16/24/32/48）
    - 圆角（4/6/8/12）
    - 动画时长（微交互 150ms、标准过渡 250ms、入场 300ms、弹性 400ms）
  - 值与设计文档 §4.2、§4.3、§4.8 严格一致
  - `--font-ui`：`'Inter', 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif`
  - `--font-mono`：`'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace`
  - `[data-theme="light"]` 下提供亮色主题对应值（颜色反转）

- 创建 `src/renderer/styles/global.css`：
  - 导入 `tokens.css`
  - body 设置：`font-family: var(--font-ui)`、`background-color: var(--color-surface-0)`、`color: var(--color-surface-800)`、`margin: 0`、`overflow: hidden`
  - `*, *::before, *::after { box-sizing: border-box }`
  - 滚动条暗色主题样式（宽度 6px、track 透明、thumb 为 `--color-surface-400`）
  - 选中文本颜色

- 创建 `src/renderer/styles/typography.css`：
  - 工具类：`.text-body`（13px）、`.text-caption`（11px）、`.text-mono`（等宽）、`.text-heading`（16px）

**验证**：
1. `npx vite build` 构建成功，CSS 被正确打包
2. 浏览器 dev server 中 `:root` 包含全部定义的 CSS 变量
3. `getComputedStyle(document.body).getPropertyValue('--font-ui')` 返回正确的字体链
4. `[data-theme="light"]` 下颜色值正确切换（通过 JS 切换 `document.documentElement.dataset.theme`）

---

### 步骤 3.2 — 自定义标题栏组件

- 创建 `src/renderer/components/TitleBar.vue`：
  - 高度固定 32px
  - 左侧：应用名称 "AKD"（12px，`--color-surface-600`）
  - 右侧：三个窗口控制按钮（最小化、最大化/还原、关闭）
  - 按钮使用 lucide-vue-next 图标：`Minus`、`Square`、`X`（16px，`stroke-width="1.5"`）
  - 按钮 hover 背景 `--color-surface-200`
  - 关闭按钮 hover 背景 `--color-error`（红色）
  - 关闭按钮点击 → IPC 调用 `mainWindow.hide()` 而非退出
  - 支持双击标题栏空白区域切换最大化/还原
  - `-webkit-app-region: drag` 实现拖拽移动，按钮区域 `no-drag`
  - 所有窗口控制方法通过 preload 暴露的 API 调用 Main Process

**验证**：
1. 标题栏高度精确 32px
2. 双击空白区域 → 窗口最大化/还原
3. 点击关闭按钮 → 窗口隐藏（非退出）
4. 三个控制按钮图标正确显示，hover 时背景色变化
5. 标题栏可拖拽移动窗口

---

### 步骤 3.3 — 左侧导航栏组件

- 创建 `src/renderer/components/SideNav.vue`：
  - 宽度固定 48px
  - 垂直排列 3 个 `NavItem` + 底部固定 1 个（关于）
  - 接收 prop `activePanel: string` 和 emit `update:activePanel`

- 创建 `src/renderer/components/NavItem.vue`：
  - props：`icon`（lucide 组件引用）、`label`（string）、`active`（boolean）
  - 尺寸：48×48px 点击区域（最小 28×28 无障碍要求已满足）
  - 图标：20×20px 居中，`stroke-width="1.5"`，`currentColor`
  - 激活态：左侧 2px 竖条（`--color-primary-500`）+ 图标颜色变为 `--color-primary-500`
  - 非激活态：图标颜色 `--color-surface-500`
  - hover 态（非激活）：图标颜色 `--color-surface-700`
  - 图标下方 10px 字号 tooltip（hover 300ms 后显示）

- 图标分配：
  - 图片面板 → `Image`（lucide）
  - 设置面板 → `Settings`（lucide）
  - 关于 → `Info`（lucide）

**验证**：
1. 侧栏宽度精确 48px
2. 三个导航项垂直排列，间距均匀
3. 点击"图片面板"→ 激活态显示左侧蓝色竖条 + 图标变蓝，其余两项恢复默认
4. 点击"设置面板"→ 同上切换
5. hover 非激活项 → 图标颜色变亮
6. hover 300ms 后显示 tooltip 文字

---

### 步骤 3.4 — 状态栏组件

- 创建 `src/renderer/components/StatusBar.vue`：
  - 高度 28px
  - 背景 `--color-surface-100`
  - 上边框 1px `--color-surface-200`
  - 左侧：`StatusIndicator`（状态指示灯占位）
  - 右侧：`BackgroundTasks`（后台任务指示占位，当前阶段空 div）
  - 左右 padding 12px

**验证**：
1. 状态栏高度精确 28px
2. 背景色与设计一致
3. 上边框可见

---

### 步骤 3.5 — App.vue 整体布局

- 更新 `src/renderer/App.vue`：
  - 完整布局（从上到下）：
    - TitleBar（32px）
    - 中间区域（flex-grow）：SideNav（48px 固定宽）+ ContentRouter（flex-grow）
    - StatusBar（28px）
  - 使用 Flexbox 或 CSS Grid 组织
  - 管理 `activePanel` 状态（`ref<'image' | 'settings'>`，默认 `'image'`）
  - 将 `activePanel` 传给 SideNav 和 ContentRouter
  - 全局 `data-theme` 属性绑定（默认 `'dark'`）

**验证**：
1. 主窗口显示完整四区域布局：标题栏 + 侧栏 + 内容区 + 状态栏
2. 窗口尺寸变化时布局自适应（内容区伸缩、侧栏和状态栏固定）
3. 侧栏点击可切换内容区

---

### 步骤 3.6 — 内容路由切换

- 创建 `src/renderer/components/ContentRouter.vue`：
  - 接收 prop `activePanel: string`
  - 使用 Vue `<component :is="...">` 动态组件
  - `'image'` → 渲染 `ImagePanel`
  - `'settings'` → 渲染 `SettingsPanel`（当前为占位组件）
  - 切换时 250ms `ease-in-out` 淡入淡出过渡（使用 `<Transition>`）

- 创建 `src/renderer/components/SettingsPanel.vue`（占位）：
  - 仅显示标题文字"设置"（居中，`--color-surface-500`）

**验证**：
1. 侧栏点击"图片面板"→ 内容区显示 ImagePanel
2. 侧栏点击"设置面板"→ 内容区显示占位文字"设置"
3. 切换时有淡入淡出动画效果

---

### 步骤 3.7 — 图片面板：空状态与拖拽区

- 创建 `src/renderer/components/ImagePanel.vue`：
  - 布局：左右双栏（flex: 1 各占 50%）
  - 左侧：原图展示区，含 ImageDropZone（空状态）
  - 右侧：线稿展示区，含空状态占位
  - 底部：PanelToolbar（固定高度）

- 创建 `src/renderer/components/ImageDropZone.vue`：
  - 空状态显示：虚线边框（`[6,4]` 虚线间隔，`--color-surface-500`）+ 图标（`ImagePlus`，48px）+ 提示文字"拖拽图片到此处或点击选择文件"
  - `dragover` 事件：preventDefault + 边框变 `--color-primary-500` + 背景 5% `--color-primary-500`（通过 CSS class 切换）
  - `dragleave`：恢复默认样式
  - `drop` 事件：preventDefault + 获取文件路径 → 调用 `window.electronAPI.importImage(filePath)`
  - 点击空区域 → 触发隐藏的 `<input type="file" accept=".png,.jpg,.jpeg,.webp,.bmp">`
  - 文件选择器选择后 → 同 drop 流程
  - 不接受的文件格式：拖拽时显示红色边框 + "格式不支持"提示（300ms 闪烁）

- 创建 `src/renderer/components/PanelToolbar.vue`：
  - 高度 40px
  - 左侧：[导入图片] 主按钮（32px 高、主色填充、白字、6px 圆角）
  - 右侧：[导出线稿 PNG] 次按钮（32px 高、透明底 + 主色边框，当前阶段 disabled）
  - 两个按钮均带对应 lucide 图标（`Upload`、`Download`，16px）
  - 主按钮 hover：上浮 1px（`transform: translateY(-1px)`）+ 加深背景色
  - 次按钮 hover（enabled 时）：主色淡底

**验证**：
1. 图片面板显示左右双栏布局
2. 空状态：虚线框 + 图标 + 提示文字
3. 拖拽图片到拖拽区 → 边框变蓝 + 背景淡蓝
4. 拖拽离开 → 恢复默认
5. 拖拽 `.txt` 文件 → 红色边框闪烁
6. 点击拖拽区 → 文件选择器打开
7. [导入图片] 按钮可点击
8. [导出线稿 PNG] 按钮为 disabled 灰色态

---

## 阶段 4：图片导入与 IPC 数据流

### 步骤 4.1 — 图片导入 Handler（Main Process）

- 创建 `src/main/image-import-handler.ts`：
  - 实现 `IMPORT_IMAGE` IPC handler
  - 流程：
    1. 接收文件路径
    2. 校验文件格式：后缀检查（png/jpg/jpeg/webp/bmp）+ 文件头 magic bytes 双重验证
    3. 用 `node:fs/promises` 的 `access` 确认文件可读
    4. 格式不支持或文件损坏 → 托盘通知用户具体原因，返回 `{ success: false, reason }`
    5. 图片极小（宽或高 < 100px）→ 允许导入但托盘通知"图片尺寸较小，效果可能不佳"
    6. 导入成功 → 读取文件为 Buffer → 存储到应用上下文
    7. 遵循设计文档 §7.3 的中断逻辑：
       - 若在 DRAWING → 立即 stopDraw
       - 若在 PREVIEWING → 销毁叠加窗口
       - 取消所有进行中的 Worker
       - 状态机转 NOT_READY
    8. 返回 `{ success: true }`

**验证**：
1. `npx tsc -p tsconfig.main.json --noEmit` 通过
2. 文件中无 `require()`、无 `module.exports`
3. 所有 `node:fs`、`node:path` 导入使用 `node:` 协议
4. 编写 `tests/unit/image-import-handler.test.ts`：
   - 传入合法 PNG 路径 → 返回 `{ success: true }`，Buffer 非空
   - 传入 `.txt` 文件路径 → 返回 `{ success: false }`
   - 传入不存在的路径 → 返回 `{ success: false }`
   - 模拟 DRAWING 状态导入 → 确认状态转为 NOT_READY
   - 模拟 PREVIEWING 状态导入 → 确认叠加窗口被销毁
5. 用 `npx tsx tests/unit/image-import-handler.test.ts` 执行，全部通过

---

### 步骤 4.2 — 图片面板：双图对比展示

- 创建 `src/renderer/components/ImageCompare.vue`：
  - 接收 props：`originalSrc`（string | null）、`lineArtSrc`（string | null）
  - 左右两栏各含一个 `ImageViewer`
  - 中间分隔线（1px `--color-surface-300`）

- 创建 `src/renderer/components/ImageViewer.vue`：
  - props：`src`（string | null）、`loading`（boolean）、`label`（string）
  - 有图时：图片自适应容器居中显示（`object-fit: contain`、`max-width: 100%`、`max-height: 100%`）
  - 图片缩放：鼠标滚轮 `transform: scale(zoomLevel)`，范围 0.1~2.0（10%~200%），步进 0.05
  - 图片加载策略：先加载 200px 缩略图（通过 IPC 请求 Main Process 用 sharp 生成），收到后立即显示；后台加载全分辨率图，加载完成后无缝替换（需确保两图完全相同才替换）
  - 无图时：显示空状态虚线框（与 ImageDropZone 空状态视觉一致）
  - 加载中时：显示脉冲骨架屏动画（CSS `@keyframes`，灰色块 + 光晕从左到右扫描）
  - 缩放通过 CSS `transform: scale()` GPU 加速，不重绘 Canvas
  - 当主窗口 `pipeline-progress` 更新时，`loading` 为 true → 骨架屏显示

**验证**：
1. 导入图片后，左侧显示原图（先缩略图后全分辨率）
2. 收到 `pipeline-complete` 后，右侧显示线稿图
3. 鼠标滚轮缩放原图 → CSS transform 变化，图片不溢出容器
4. 缩放至 200% 时不再继续放大
5. 缩放至 10% 时不再继续缩小
6. `loading=true` 时显示脉冲骨架屏动画
7. 无图时显示虚线边框空状态

---

### 步骤 4.3 — 状态指示灯组件完整实现

- 创建 `src/renderer/components/StatusIndicator.vue`：
  - 接收 prop：`status: StatusState`、`extraInfo: string`（可选附加信息）
  - 结构：`[● 8px圆点] [Lucide图标 16px] [标签 12px] | [附加信息 12px]`
  - 5 种状态的完整映射表（严格按设计文档 §4.7.1）：
    - NOT_READY：蓝色 `#60a5fa`、脉冲呼吸动画 2s、`CircleDashed`、标签"未就绪"、附加信息可为"等待导入图片"或"模型加载中…"
    - IDLE：绿色 `#34d399`、无动画、`CircleCheck`、标签"空闲"、附加信息"N 条路径就绪"
    - PREVIEWING：靛蓝紫 `#6366f1`、光晕扩散动画 3s、`Eye`、标签"预览中"、附加信息缩放比例如"1.0x"
    - DRAWING：琥珀色 `#fbbf24`、脉冲呼吸动画 1s、`PenLine`、标签"绘制中"、附加信息"路径 3/15"+"速度 500px/s"
    - ERROR：红色 `#f87171`、无动画（静态常亮）、`CircleX`、标签"错误"、附加信息为具体原因
  - 圆点 CSS `border-radius: 50%`、8×8px
  - 圆点与图标间距 6px、图标与标签间距 4px
  - `role="status"` + `aria-live="polite"`
  - 所有颜色通过根节点 `style` binding 直接设置 `color`，子元素用 `currentColor` 继承
  - 状态切换时颜色/图标/文字 250ms `ease-in-out` 过渡
  - 动画启停：150ms `ease-out` 淡入淡出，避免生硬闪烁

**验证**：
1. 组件在 5 种状态下分别渲染正确的颜色、图标、标签
2. CSS `@keyframes status-pulse` 和 `@keyframes status-glow` 已定义
3. NOT_READY 圆点有 2s 脉冲呼吸动画
4. PREVIEWING 圆点有 3s 光晕扩散（`box-shadow`）动画
5. ERROR 圆点无动画——确认 `animation: none`
6. 状态切换时所有元素有 250ms `transition` 平滑过渡
7. 屏幕阅读器可正确读出 `aria-live="polite"` 内容
8. 附加信息栏在无内容时留空不显示

---

### 步骤 4.4 — Toast 通知组件

- 创建 `src/renderer/components/ToastContainer.vue`：
  - 固定定位右上角（`position: fixed; top: 12px; right: 12px; z-index: 9999`）
  - 管理 Toast 队列：先进先出，最多同时显示 3 条
  - 监听 IPC `toast` 事件或通过 `provide/inject` 接收 Toast 触发

- 创建 `src/renderer/components/ToastItem.vue`：
  - props：`type`（`'success' | 'warning' | 'error' | 'info'`）、`message`（string）、`duration`（number，默认 3000）
  - 视觉：毛玻璃背景（`--glass-bg` + `backdrop-filter: blur(12px)`）、`--glass-border` 边框
  - 左侧 2px 竖条（类型色）
  - 入场动画：300ms `cubic-bezier(0.16,1,0.3,1)`，从右滑入 + 淡入
  - 出场：200ms 淡出
  - 到时间后自动触发出场 → 从队列移除

**验证**：
1. 手动触发 1 条 Toast → 右上角滑入 → 3 秒后自动消失
2. 连续触发 5 条 → 仅有最近 3 条可见
3. success Toast 左侧绿色竖条
4. error Toast 左侧红色竖条
5. 毛玻璃效果可见（背景透过模糊）

---

## 阶段 5：推理管线

### 步骤 5.1 — 模型文件部署

- 读取 `resources/models目录中的 `anime2sketch.onnx` 模型文件
- 在 `package.json` 中配置 `build.extraResources` 包含 `resources/models/*`

**验证**：
1. `resources/models/anime2sketch.onnx` 文件存在
2. 文件大小合理（非 0 字节）
3. `npx electron-builder --dir` 打包后 `resources/models/anime2sketch.onnx` 在产物中

---

### 步骤 5.2 — 创建推理 Worker

- 创建 `src/workers/inference/worker.ts`：
  - 使用 `node:worker_threads` 的 `parentPort` 接收主进程消息
  - 使用 `onnxruntime-node` 的 `InferenceSession` 加载模型
  - 执行 CPU 推理（`executionProvider: 'cpu'`）
  - 消息协议：
    - 接收：`{ type: 'infer', imageBuffer: ArrayBuffer }`
    - 发送：`{ type: 'result', lineArtBuffer: ArrayBuffer }`
    - 发送：`{ type: 'error', message: string }`
  - 预处理流程：
    1. 用 `sharp` 将图片缩放至 512×512（`fit: 'fill'`，不保持宽高比）
    2. 提取 RGB 三通道像素数据
    3. 归一化：`(pixel/255 - 0.5) / 0.5`，值域 [-1, 1]
    4. 组装为 NCHW 格式的 Float32Array，shape (1, 3, 512, 512)
  - 后处理流程：
    1. 取出输出张量（shape 1, 1, 512, 512）
    2. 反归一化：`(value + 1) / 2 * 255`，值域 [0, 255]
    3. 用 `sharp` 缩放至原始图片尺寸
    4. 输出为灰度 PNG Buffer
  - 推理超时 30s：使用 `AbortController` 或计时器，超时后 `parentPort.postMessage({ type: 'error', ... })`
  - 模型加载失败 → 发送 error
  - 所有导入使用 `node:` 协议，相对导入带 `.js` 后缀

**验证**：
1. `npx tsc -p tsconfig.worker.json --noEmit` 通过
2. 文件中无 `require()`、无 `__dirname`/`__filename`
3. `sharp` 导入为 `import sharp from 'sharp'`
4. 编写 `tests/unit/inference-worker.test.ts`：
   - 使用已知动漫风格测试图片（~200KB PNG）
   - 验证返回的 `lineArtBuffer` 为有效 PNG
   - 验证输出尺寸与输入尺寸一致（后处理中缩放回原尺寸）
   - 验证预处理张量 shape 为 `[1, 3, 512, 512]`
   - 验证后处理灰度值全部在 [0, 255] 范围内
   - 验证超时机制：传入极大图片（>50MB）→ 30s 后收到 error
5. 用 `npx tsx tests/unit/inference-worker.test.ts` 执行，全部通过

---

### 步骤 5.3 — Worker 管理器（Main Process 侧）

- 创建 `src/main/worker-manager.ts`：
  - 封装 Worker 生命周期管理：创建、通信、错误处理、清理
  - Worker 创建使用 `new Worker(new URL('../../workers/inference/worker.js', import.meta.url), { workerData })` 模式
  - `runInference(imageBuffer: Buffer): Promise<Buffer>` 方法：
    1. 创建推理 Worker
    2. 发送 `{ type: 'infer', imageBuffer }`（通过 `worker.postMessage`，Buffer 自动转为 ArrayBuffer 传输）
    3. 等待 Worker 回复 `{ type: 'result', lineArtBuffer }` → resolve
    4. 等待 Worker 回复 `{ type: 'error', message }` → reject
    5. 超时 30s → `worker.terminate()` + reject
    6. 完成后（无论成功失败）→ `worker.terminate()` 清理资源
  - 使用 `node:` 协议导入

**验证**：
1. `npx tsc -p tsconfig.main.json --noEmit` 通过
2. Worker 创建使用 `new URL(..., import.meta.url)` ——无 `__dirname`
3. 超时后 Promise reject 且 Worker 被 terminate
4. 异常时 Worker 被正确清理（无僵尸线程）

---

### 步骤 5.4 — 管线编排器

- 创建 `src/main/pipeline-orchestrator.ts`：
  - 接收应用上下文（状态机、配置）
  - `run(imageBuffer: Buffer): Promise<{ lineArtBuffer: Buffer; paths: DrawPath[]; boundingBox: BoundingBox }>` 方法
  - 编排流程：
    1. 推送 `pipeline-progress` → Renderer 显示"推理中…"（stage: 'inference', progress: 0）
    2. 调用 Worker 管理器 `runInference(imageBuffer)` → 获取 lineArtBuffer
    3. 推送 `pipeline-progress` → "路径提取中…"（stage: 'extraction', progress: 50）
    4. 推送 `pipeline-complete` IPC（lineArtBase64 + 路径摘要）→ Renderer 展示线稿
    5. 状态机转 IDLE
  - 推理失败 → 状态机转 ERROR → 推送 `app-error`（reason: 模型加载失败/推理超时等）
  - 所有 IPC 推送通过 `mainWindow.webContents.send`

**验证**：
1. `npx tsc -p tsconfig.main.json --noEmit` 通过
2. `pipeline-progress` 每个阶段都被推送（inference/extraction/complete）
3. 推理失败时状态机转为 ERROR
4. 推理成功时状态机转为 IDLE

---

## 阶段 6：路径提取

### 步骤 6.1 — 创建路径提取 Worker

- 创建 `src/workers/path-extraction/worker.ts`：
  - 使用 `node:worker_threads` 的 `parentPort`
  - 使用 `await import('@techstark/opencv-js')` 异步加载 WASM 版 OpenCV
  - WASM 加载失败 → `parentPort.postMessage({ type: 'error', message: '路径提取引擎加载失败' })`
  - 消息协议：
    - 接收：`{ type: 'extract', lineArtBuffer: ArrayBuffer }`
    - 发送：`{ type: 'result', paths: DrawPath[] }`
    - 发送：`{ type: 'error', message: string }`
  - 处理流程严格按设计文档 §12.3 的五步：
    1. 将灰度 PNG Buffer 解码为 OpenCV Mat
    2. `cv.threshold(gray, binary, 128, 255, cv.THRESH_BINARY)` 二值化
    3. `cv.bitwise_not(binary, inverted)` 反转——线条变白色前景
    4. `cv.findContours(inverted, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_NONE)` 像素级轮廓提取
    5. 遍历每条轮廓：
       - 过滤点数 < 3 的极小轮廓
       - `cv.approxPolyDP(contour, approx, 1.0, false)` 简化（epsilon=1.0，不强制闭合）
       - 提取 `{x, y}[]` 坐标序列
    6. 绘制顺序优化：按每条路径首点排序（Y 升序优先，Y 相同时 X 升序）
    7. 返回 `DrawPath[]`
  - 无有效轮廓（全部 < 3 点或 findContours 返回空）→ 发送 error："未检测到可绘制线条"
  - 所有导入使用 `node:` 协议
  - OpenCV Mat 使用完毕后调用 `.delete()` 释放内存

**验证**：
1. `npx tsc -p tsconfig.worker.json --noEmit` 通过
2. 文件中无 `require()`、无 `__dirname`/`__filename`
3. `@techstark/opencv-js` 导入为 `import cvReadyPromise from '@techstark/opencv-js'`
4. 编写 `tests/unit/path-extraction-worker.test.ts`：
   - 使用已知包含白色方块的二值图像（100×100 PNG）→ 验证至少返回 1 条轮廓
   - 使用全白图 → 验证返回 error "未检测到可绘制线条"
   - 使用全黑图 → 验证返回 error
   - 验证 approxPolyDP 简化后点数 ≤ 原始轮廓点数（epsilon=1.0 时有减少）
   - 验证输出路径数组已排序（首条路径首点 Y 坐标 ≤ 第二条首点 Y 坐标）
   - 验证所有路径至少包含 3 个点
   - 验证坐标值在图片尺寸范围内
5. 用 `npx tsx tests/unit/path-extraction-worker.test.ts` 执行，全部通过

---

### 步骤 6.2 — Worker 管理器扩展（路径提取）

- 在 `src/main/worker-manager.ts` 中添加：
  - `runPathExtraction(lineArtBuffer: Buffer): Promise<{ paths: DrawPath[] }>` 方法
  - 路径提取 Worker 的创建使用 `new URL('../../workers/path-extraction/worker.js', import.meta.url)`
  - 超时 60s（大图轮廓可能很多）
  - 完成后 terminate Worker

**验证**：
1. `npx tsc -p tsconfig.main.json --noEmit` 通过
2. 方法签名返回类型包含 `paths`
3. Worker 创建使用 `new URL(..., import.meta.url)` 模式

---

### 步骤 6.3 — 全局路径包围盒计算

- 创建 `src/shared/geometry-utils.ts`（Shared 层）：
  - `computeBoundingBox(paths: DrawPath[]): BoundingBox` 函数
  - 遍历所有路径的所有点，找出 minX、minY、maxX、maxY
  - 返回 `{ minX, minY, width: maxX-minX, height: maxY-minY }`
  - 空数组 → 返回 `{ minX: 0, minY: 0, width: 0, height: 0 }`

- 在管线编排器中：
  - 路径提取成功后 → 调用 `computeBoundingBox(paths)` → 存储结果

**验证**：
1. `npx tsc -p tsconfig.shared.json --noEmit` 通过
2. 编写 `tests/unit/geometry-utils.test.ts`：
   - `[{x:0,y:0}, {x:100,y:50}]` → `{ minX:0, minY:0, width:100, height:50 }`
   - 空数组 → `{ minX:0, minY:0, width:0, height:0 }`
3. 用 `npx tsx tests/unit/geometry-utils.test.ts` 执行，全部通过

---

### 步骤 6.4 — 管线编排器集成路径提取

- 更新 `src/main/pipeline-orchestrator.ts`：
  - 推理完成后自动启动路径提取
  - 路径提取完成后：
    1. 调用 `computeBoundingBox(paths)`
    2. 状态机转 IDLE
    3. 推送 `pipeline-complete` → Renderer（含 `lineArtBase64`、`pathCount`、`boundingBox`）
  - 路径提取失败 → 状态机转 ERROR → 推送 `app-error`
  - 无有效线条（findContours 返回空）→ 进入 ERROR（reason: "未检测到可绘制线条"）

**验证**：
1. `npx tsc -p tsconfig.main.json --noEmit` 通过
2. `pipeline-complete` 数据中包含 `{ lineArtBase64, pathCount, boundingBox }`
3. 无有效线条时状态为 ERROR，错误信息为"未检测到可绘制线条"
4. 编写 `tests/integration/pipeline-e2e.test.ts`：
   - 使用测试用动漫线稿风格图片
   - 完整流程：图片 Buffer → 推理 Worker → 路径提取 Worker → 返回 `DrawPath[]` + `BoundingBox`
   - 验证路径数量 > 0
   - 验证每条路径至少 3 个点
   - 验证 `boundingBox.width > 0` 且 `boundingBox.height > 0`
   - 验证路径坐标均在合理范围内
   - 模拟推理超时 → 验证返回 ERROR
5. 用 `npx tsx tests/integration/pipeline-e2e.test.ts` 执行，全部通过

---

## 阶段 7：预览叠加窗口

### 步骤 7.1 — 叠加窗口创建与销毁

- 创建 `src/main/preview-overlay.ts`：
  - `create(boundingBox: BoundingBox, opacity: number): BrowserWindow` 方法
  - `destroy()` 方法
  - 窗口属性严格遵循设计文档 §5.1：
    - `transparent: true`
    - `alwaysOnTop: true`
    - `frame: false`
    - `resizable: false`
    - `skipTaskbar: true`
    - `hasShadow: false`
    - 宽度 = boundingBox.width、高度 = boundingBox.height
    - 初始位置 = 主屏幕居中（`screen.getPrimaryDisplay().workArea` 计算）
    - `opacity` 初始为配置值
    - 创建后立即 `setIgnoreMouseEvents(true)`（鼠标穿透）
  - 窗口加载独立的 HTML 页面（叠加层渲染页面）
  - 创建 `src/renderer/overlay/index.html`：最小 HTML，含 `<canvas id="overlay-canvas">` 全屏
  - 创建 `src/renderer/overlay/main.ts`：单独 Vite 入口或直接 script，负责 Canvas 渲染
  - Vite 配置中添加 overlay 入口（或多页面构建）

**验证**：
1. `npx tsc -p tsconfig.main.json --noEmit` 通过
2. IDLE 状态下触发 preview → 透明置顶窗口出现于主屏幕中央
3. 窗口大小与 boundingBox 一致
4. 默认鼠标穿透（点击窗口内区域 → 点击落至下层应用）
5. 窗口无标题栏、无边框、无任务栏图标

---

### 步骤 7.2 — Canvas 路径渲染

- 在叠加窗口渲染逻辑中实现：
  - 接收 Main Process 发送的路径数据（通过 IPC 或 `window` 全局变量注入）
  - Canvas 尺寸设置为窗口客户区尺寸（`window.innerWidth × window.innerHeight`）
  - Canvas CSS 尺寸与物理像素尺寸适配 `devicePixelRatio`：
    - CSS width/height = 窗口尺寸
    - canvas.width/height = 窗口尺寸 × devicePixelRatio
    - ctx.scale(devicePixelRatio, devicePixelRatio)
  - 坐标系映射：
    - `scaleX = canvasCSSWidth / boundingBox.width`
    - `scaleY = canvasCSSHeight / boundingBox.height`
    - `canvasX = (point.x - boundingBox.minX) * scaleX`
    - `canvasY = (point.y - boundingBox.minY) * scaleY`
  - 渲染逐路径逐点 `ctx.lineTo`，每条路径一个 `ctx.beginPath()` + `ctx.stroke()`
  - 线宽 2px 物理像素（即 `ctx.lineWidth = 2`）
  - 描边颜色为配置的 `overlayLineColor`（默认 `#000000`）
  - 抗锯齿：`ctx.imageSmoothingEnabled = true`
  - 虚线边框：Canvas 最外边缘使用 `ctx.setLineDash([4, 4])` 绘制虚线矩形边框
  - 边框颜色与线条颜色共用 `overlayLineColor`
  - `requestAnimationFrame` 驱动渲染

**验证**：
1. 叠加窗口正确渲染所有路径线条
2. 虚线边框完整环绕窗口边缘（`[4,4]` 间隔）
3. `devicePixelRatio = 2` 时线条清晰不模糊
4. 边框在 Canvas 绘制区域内侧，不被裁切

---

### 步骤 7.3 — Ctrl 键交互：鼠标穿透切换

- 在叠加窗口渲染脚本中：
  - 监听全局 `keydown`/`keyup` 事件
  - Ctrl 键按下 → 通过 IPC 通知 Main Process 调用 `setIgnoreMouseEvents(false)`（恢复接收鼠标事件）
  - Ctrl 键松开 → 通过 IPC 通知 Main Process 调用 `setIgnoreMouseEvents(true)`（恢复鼠标穿透）
  - Main Process 侧：使用 `globalShortcut` 无法捕获 Ctrl 单键（需 Renderer 侧 `keydown`/`keyup`），或使用 `win.setIgnoreMouseEvents(false, { forward: true })` 的 forward 参数
  - Windows 上 Ctrl + setIgnoreMouseEvents 切换需提前 50ms 处理（在 keydown 中先设 ignore=false 再处理后续交互）

**验证**：
1. 默认状态：鼠标在叠加窗口上点击 → 事件穿透至下层窗口
2. 按住 Ctrl：鼠标在叠加窗口上点击 → 事件被窗口接收（不穿透）
3. 松开 Ctrl：恢复穿透

---

### 步骤 7.4 — Ctrl + 拖拽移动窗口

- 在叠加窗口渲染脚本中：
  - Ctrl 按下时 → 标记 `ctrlHeld = true`
  - `mousedown` 在窗口任意位置（非四角热区）→ 记录起始位置（`startX, startY`）和窗口当前位置
  - `mousemove` 且 `isDragging` → 计算偏移量 → 通过 IPC 通知 Main Process 用 `win.setPosition(newX, newY)` 移动窗口
  - `mouseup` → `isDragging = false`

**验证**：
1. 按住 Ctrl + 在窗口中央区域拖拽 → 窗口跟随鼠标移动
2. 松开 Ctrl 或 松开鼠标 → 停止移动
3. 窗口可被拖拽至任意屏幕

---

### 步骤 7.5 — 四角等比缩放

- 在叠加窗口渲染脚本中：
  - Ctrl 按下时 → 窗口四角渲染 8×8px 缩放手柄（自绘矩形，`--color-primary-500` 填充，半透明）
  - 鼠标进入四角热区（检测坐标在角部 ±12px 范围内）→ 修改 CSS `cursor` 为对角线箭头（`nw-resize`、`ne-resize` 等）
  - 拖拽热区 → 计算新窗口尺寸：
    - 锁定宽高比（`aspectRatio = boundingBox.width / boundingBox.height`）
    - 根据拖拽方向调整新尺寸，保持比例
  - 缩放范围：0.5x ~ 3.0x（相对于 boundingBox 原始尺寸）
  - 实时通过 IPC 通知 Main Process：
    - `win.setSize(newWidth, newHeight)`（用 `setBounds` 原子更新位置+尺寸更好）
    - 同步更新 Canvas 尺寸并重绘所有路径
  - 显示浮动尺寸标签（透明背景、白字，显示当前缩放比例如"1.5x"和像素尺寸如"960×540"）
  - `requestAnimationFrame` 帧节流（最大 60fps，实际限制为 vsync）
  - `mouseup` → 停止缩放 → 400ms `cubic-bezier(0.34,1.56,0.64,1)` 弹性回弹动画（微小回弹）

**验证**：
1. 按住 Ctrl → 四角出现 8×8px 蓝色填充方块（缩放手柄）
2. 光标移到四角 → 变为对角线箭头光标
3. 拖拽四角 → 窗口等比缩放（宽高比不变）
4. 缩放至 3.0x → 不再继续放大
5. 缩放至 0.5x → 不再继续缩小
6. 松开鼠标 → 轻微弹性回弹（肉眼可见 400ms spring 动画）
7. 松开 Ctrl → 四角手柄消失
8. 缩放过程中浮动尺寸标签显示

---

### 步骤 7.6 — 缩放比例同步到状态栏

- 缩放比例通过 IPC 通道 `OVERLAY_SCALE_CHANGED` 实时推送至 Renderer
- 数据：`{ scale: number, width: number, height: number }`
- 状态栏 PREVIEWING 状态的附加信息动态更新为当前缩放比例（如"1.5x"）
- 缩放比例缓存（startDraw 时使用）

**验证**：
1. 缩放叠加窗口 → 主窗口状态栏"预览中"附加信息同步更新为 "当前缩放比例 x"
2. 默认（无缩放时）附加信息为 "1.0x"

---

### 步骤 7.7 — 多显示器适配

- 叠加窗口初始位置在主屏幕中心（通过 `screen.getPrimaryDisplay()` 获取）
- 移动窗口时可跨屏
- 缩放时限制窗口不超过当前所在屏幕的工作区（`screen.getDisplayNearestPoint()` 获取当前屏幕）
- 窗口关闭时记录最后位置和尺寸，下次创建时恢复（如目标显示器已断开，回退主屏幕）

**验证**：
1. 多显示器环境 → 预览窗初始在主屏幕中央
2. Ctrl + 拖拽 → 窗口可跨屏至副屏
3. 在副屏缩放至该屏工作区边界 → 不再继续放大

---

## 阶段 8：绘制引擎

### 步骤 8.1 — nut.js Adapter 封装

- 创建 `src/main/adapters/nut-js-adapter.ts`：
  - AKD 项目中**唯一**使用 `createRequire` 的文件
  - 从 `node:module` 导入 `createRequire`
  - 通过 `createRequire(import.meta.url)` 获取 `require` 函数
  - 从 `@nut-tree-fork/nut-js` require 出 `mouse`、`keyboard`、`Button` 等
  - 重新导出为 ESM 命名导出：`export { mouse, keyboard, Button }`
  - 文件顶部用 JSDoc 注释标注"此文件为 CJS → ESM Adapter，是唯一使用 createRequire 的位置"

**验证**：
1. `npx tsc -p tsconfig.main.json --noEmit` 通过
2. `grep -r "createRequire" src/` 仅匹配此文件
3. `grep -r "require(@" src/` 除本文件外无其他匹配
4. 其他文件通过 `import { mouse } from '../adapters/nut-js-adapter.js'` 正常导入

---

### 步骤 8.2 — 绘制引擎核心实现

- 创建 `src/main/drawing-engine.ts`：
  - 接收依赖：状态机、配置存储
  - `start(paths: DrawPath[], boundingBox: BoundingBox, overlayRect: { x, y, width, height }): Promise<void>` 方法：
    1. 验证当前状态为 PREVIEWING
    2. 状态机转 DRAWING
    3. 捕获叠加窗口当前屏幕位置和尺寸（`overlayRect` 由调用方传入）
    4. 关闭叠加窗口（调用 `previewOverlay.destroy()`）
    5. 计算缩放因子：`scale = Math.max(overlayRect.width / boundingBox.width, overlayRect.height / boundingBox.height)`
    6. 按顺序消费路径队列（已在 Worker 中排序）
    7. 每条路径：鼠标跳到起点 → 按下按键 → 逐点移动 → 抬笔
    8. 注册 `stopFlag` 检查机制
    9. 全部路径完成后 → 状态机转 IDLE → 托盘通知"绘制完成"
  - `stop()` 方法：
    1. 设置 `stopFlag = true`
    2. 下一个步进循环检测到后立即 `mouse.releaseButton()`
    3. 清空路径队列
    4. 状态机转 IDLE
  - 坐标转换公式严格按设计文档 §9.2：
    - `screenX = overlayRect.x + (point.x - boundingBox.minX) * scale`
    - `screenY = overlayRect.y + (point.y - boundingBox.minY) * scale`
    - 坐标超出当前主屏幕范围 → 裁剪丢弃（不移动）
  - 异步绘制循环（设计文档 §9.4）：
    - 逐点移动鼠标（`mouse.setPosition(screenX, screenY)`）
    - 每步后 `await delay(stepDelay)`，`stepDelay = 1000 / drawSpeed` 毫秒
    - `delay` 为 `setTimeout` 封装的 Promise
    - 每步检查 `stopFlag`，若为 true 则 break 并抬笔
  - 路径间处理：
    - 抬笔 → `mouse.releaseButton(button)`
    - 移动到下一条路径起点 → `mouse.setPosition(nextStartX, nextStartY)`
    - 落笔 → `mouse.pressButton(button)`
  - 首条路径：跳到起点 → `mouse.pressButton(button)` → 开始逐点移动
  - 绘制过程中通过 IPC 推送 `DRAW_STATUS`（当前路径序号/总路径数、当前速度）

**验证**：
1. `npx tsc -p tsconfig.main.json --noEmit` 通过
2. `stopFlag` 在 `stop()` 调用后的下一个步进循环即检查生效
3. 坐标转换公式与设计文档 §9.2 一致
4. 步进延迟计算正确：`1000 / speed` ms
5. 仅 DRAWING 状态才能调用 `start()`

---

### 步骤 8.3 — 绘制参数校验

- `drawSpeed` 校验：
  - 从配置存储读取
  - < 100 → 钳制为 100
  - > 2000 → 钳制为 2000
  - 非数字 → 回退默认 500 + 托盘通知
- `mouseButton` 校验：
  - 仅接受 `'left'` 或 `'right'`
  - 其他值 → 回退 `'left'` + 托盘通知
- `overlayRect` 校验：
  - x/y/width/height 均 > 0
  - 非法 → 抛出异常

**验证**：
1. `drawSpeed = 50` → 被钳制为 100
2. `drawSpeed = 3000` → 被钳制为 2000
3. `drawSpeed = "abc"` → 回退为 500
4. `mouseButton = 'middle'` → 回退为 `'left'`

---

## 阶段 9：系统托盘

### 步骤 9.1 — 系统托盘创建与管理

- 创建 `src/main/tray-manager.ts`：
  - 应用启动时创建 `Tray`
  - 托盘图标路径：`resources/icons/tray/` 下的 5 个状态图标（当前阶段可使用纯色圆点 PNG）
  - 右键菜单结构（使用 `Menu.buildFromTemplate`）：
    - "打开主窗口"（label 粗体）→ click: `mainWindow.show()` + `mainWindow.focus()`
    - `{ type: 'separator' }`
    - 状态指示项（label 为当前状态中文名，enabled: false）
    - `{ type: 'separator' }`
    - "导出线稿 PNG" → 调用导出 handler（仅 IDLE 状态 enabled）
    - `{ type: 'separator' }`
    - "退出"（label 红色）→ 安全退出流程
  - 左键单击：`tray.on('click')` → 同"打开主窗口"
  - 监听状态机 `state-change` → 更新托盘图标 + 菜单状态文字
  - 应用退出时 `tray.destroy()`

**验证**：
1. 应用启动 → 系统托盘出现图标（初始为 NOT_READY 图标）
2. 右键菜单弹出，包含全部 6 个选项
3. 左键单击 → 主窗口显示并聚焦
4. 状态从 NOT_READY 变为 IDLE → 托盘图标切换
5. IDLE 状态下"导出线稿 PNG"可点击
6. 点击"退出" → 应用完全退出（非隐藏到托盘）

---

### 步骤 9.2 — 托盘状态图标

- 创建 `resources/icons/tray/` 目录
- 为 5 个状态创建对应图标（当前阶段可使用 16×16 纯色圆点 PNG）：
  - `not-ready.png` — 蓝色圆点 + 虚线环
  - `idle.png` — 绿色实心圆点
  - `previewing.png` — 靛蓝紫色圆点 + 外光晕
  - `drawing.png` — 琥珀色实心圆点
  - `error.png` — 红色实心圆点

**验证**：
1. 5 个图标文件存在且为有效 PNG
2. 尺寸均为 16×16（或 32×32 兼容 HiDPI）
3. 切换状态时托盘图标即时更新

---

## 阶段 10：快捷键管理器

### 步骤 10.1 — 快捷键管理器实现

- 创建 `src/main/shortcut-manager.ts`：
  - 接收依赖：状态机、配置存储
  - 监听状态机 `state-change` 事件
  - 每次状态变更：
    1. `globalShortcut.unregisterAll()`
    2. 读取当前配置中的热键键值
    3. 按状态注册对应热键（设计文档 §8.1 表）：
       - IDLE：注册 preview 热键 → 回调内触发进入 PREVIEWING
       - PREVIEWING：注册 preview（退出预览）+ startDraw 热键
       - DRAWING：注册 stopDraw 热键
       - NOT_READY：不注册任何热键
       - ERROR：不注册任何热键
  - 热键注册失败（已被占用）→ 托盘通知用户"热键 [键名] 已被占用"，不阻塞状态流转
  - 热键回调内部双重验证：`if (stateMachine.getState() !== expectedState) return`（防竞态）
  - 用户修改配置后 → 若当前状态已有注册 → 自动注销旧键 + 注册新键

**验证**：
1. IDLE 状态按 F5 → 系统进入 PREVIEWING（叠加窗口出现）
2. PREVIEWING 状态按 F6 → 系统进入 DRAWING
3. DRAWING 状态按 F7 → 绘制停止、回到 IDLE
4. NOT_READY 状态按 F5/F6/F7 → 无任何响应
5. ERROR 状态按 F5/F6/F7 → 无任何响应
6. 修改 preview 快捷键为 F9 → F9 触发预览、F5 不再触发
7. 编写 `tests/unit/shortcut-manager.test.ts`：
   - 模拟状态变更 → 验证注册的热键列表正确
   - 模拟配置变更 → 验证热键重新注册
   - 模拟热键注册失败 → 验证不抛异常、托盘通知
8. 用 `npx tsx tests/unit/shortcut-manager.test.ts` 执行，全部通过

---

## 阶段 11：错误处理与边界情况

### 步骤 11.1 — ERROR 状态进入逻辑

- 在 `src/main/state-machine.ts` 或独立的错误处理模块中：
  - 以下场景触发 `stateMachine.transition(StatusState.ERROR)`：
    1. ONNX 模型加载失败
    2. 推理超时（>30s）
    3. OpenCV WASM 加载失败
    4. 路径提取失败（Worker 异常）
    5. 无有效线条（findContours 返回空或全部轮廓 < 3 点）
  - ERROR 进入时立即执行的副作用（设计文档 §7.2）：
    1. `globalShortcut.unregisterAll()` — 全部热键注销
    2. 若当前为 DRAWING → 强制 `mouse.releaseButton()` + 清空队列 + `stopFlag = true`
    3. 若预览窗口存在 → `previewOverlay.destroy()`
    4. 终止所有进行中的 Worker
    5. 推送 IPC `APP_ERROR` → `app-state` → 托盘通知

**验证**：
1. ERRPR 进入后无热键可用
2. DRAWING 状态进入 ERROR → 鼠标强制抬笔
3. PREVIEWING 状态进入 ERROR → 叠加窗口被销毁
4. Worker 被 terminate（进程列表无残留 worker_threads）

---

### 步骤 11.2 — ERROR 覆盖层 UI

- 创建 `src/renderer/components/ErrorOverlay.vue`：
  - 覆盖图片面板内容区（`position: absolute`，铺满父容器）
  - 布局严格遵循设计文档 §4.7.2：
    - 垂直居中排列
    - `CircleX` 图标（lucide），56px，`--color-error` 色
    - 下方 16px：错误原因描述（14px，`--color-surface-800`，最多两行）
    - 下方 8px：建议操作说明（12px，`--color-surface-600`）
    - 下方 24px：[重试] 主按钮（32px 高、主色填充、`CircleDashed` 图标 + "重试"）
    - 下方 12px：[打开日志目录] 链接文字（12px，`--color-surface-500`，hover 变 `--color-primary-500`）
  - 背景：`--color-surface-100`，铺满
  - 入场动画：300ms `cubic-bezier(0.16,1,0.3,1)`，overlay fade-in + 内容区域 scale 0.95→1
  - 点击 [重试] → `window.electronAPI.retryFromError()`
  - 点击 [打开日志目录] → IPC 调用 `shell.openPath(logPath)`
  - [重试] 按钮支持 Enter/Space 键盘激活

**验证**：
1. ERROR 状态 → 图片面板内容区被错误覆盖层替换
2. 错误描述和建议文字与 IPC 收到的 ErrorInfo 一致
3. 点击 [重试] → 触发 IPC retry-from-error，覆盖层移除
4. [重试] 按钮可通过 Enter 键激活（`@keydown.enter`）
5. [打开日志目录] hover 后颜色变为 `--color-primary-500`
6. 错误覆盖层有入场动画

---

### 步骤 11.3 — ERROR 恢复流程

- Main Process `RETRY_FROM_ERROR` handler 实现（设计文档 §7.2）：
  1. 验证当前状态为 ERROR
  2. 状态机转 NOT_READY
  3. 清空当前图片 Buffer、DrawPath[]、BoundingBox
  4. 重新加载 ONNX 模型（异步）
  5. 加载成功 → 推送 `app-state` 更新 → UI 恢复（移除错误覆盖层、按钮恢复正常）
  6. 加载又失败 → 再次进入 ERROR（循环直到成功或用户退出）
  7. 推送 IPC 通知 Renderer 进度

**验证**：
1. ERROR 状态点击 [重试] → 状态变为 NOT_READY
2. 模型加载成功 → 保持 NOT_READY → 可正常导入图片
3. 模型加载又失败 → 重新进入 ERROR → 错误覆盖层再次显示（新错误原因）
4. 旧数据（Buffer/paths/boundingBox）被正确清空

---

### 步骤 11.4 — 应用退出保护

- 在 `src/main/index.ts` 中：
  - `app.on('before-quit')` 事件处理：
    1. 若状态为 DRAWING → 先调用 `drawingEngine.stop()`（抬笔）
    2. 等待 stop 完成（最多等待 2s）
    3. 然后 `app.quit()`
  - 多实例锁：`app.requestSingleInstanceLock()` → 获取失败 → `app.quit()`
  - `second-instance` 事件 → 激活已有主窗口

**验证**：
1. DRAWING 状态下关闭应用 → 鼠标抬笔后退出
2. 启动两个实例 → 第二个自动退出
3. 第二个实例退出时已有窗口被激活

---

## 阶段 12：设置面板

### 步骤 12.1 — SliderControl 通用组件

- 创建 `src/renderer/components/SliderControl.vue`：
  - props：`label`、`modelValue`（number）、`min`（number）、`max`（number）、`step`（number，默认 1）、`unit`（string，可选）
  - emit：`update:modelValue`
  - 视觉：
    - 轨道 4px 高，`--color-surface-400` 背景，`border-radius: 2px`
    - 已填充区域 `--color-primary-500`
    - 圆形滑块（thumb）：13px，白色填充 + `--color-primary-500` 2px 边框，`box-shadow`
    - 拖动时滑块放大至 18px（transition 100ms）
  - 数值显示：右侧等宽字体 13px
  - 使用 `<input type="range">` + CSS 自定义样式
  - 拖动过程中实时 emit 更新，释放鼠标时触发 IPC `update-settings`

**验证**：
1. 滑块初始值显示在中间位置
2. 拖动滑块 → 数值实时更新
3. 拖动时滑块放大，释放时恢复
4. `min`/`max` 边界正确钳制
5. `unit` 为 "px/s" 时显示 "500 px/s"

---

### 步骤 12.2 — 快捷键设置 UI

- 创建 `src/renderer/components/HotkeySettings.vue`：
  - 3 行 `HotkeyRow`：preview、startDraw、stopDraw
  - 从配置中读取当前键值（通过 preload API）

- 创建 `src/renderer/components/HotkeyRow.vue`：
  - props：`label`（string）、`keyValue`（string）、`defaultKey`（string）
  - 布局：标签（12px `--color-surface-700`）+ 键帽组 + [修改]次按钮 + [恢复默认]文字按钮
  - 键帽样式：`--color-surface-300` 背景，模拟键盘立体感（`box-shadow: 0 2px 0 --color-surface-400`），等宽字体 11px，padding 2px 8px，border-radius 4px

- 创建 `src/renderer/components/HotkeyCapture.vue`：
  - 全屏半透明遮罩（`--color-surface-0` 60% 透明度）
  - 中央弹窗：标题"按下新快捷键" + 按键名显示 + [确认] / [取消] 按钮
  - 监听 `keydown` 事件，捕获按键名（使用 `KeyboardEvent.key`）
  - 排除：仅修饰键（Ctrl/Alt/Shift/Meta 单独按下不捕获，需组合至少一个非修饰键）
  - Esc / 点击遮罩 → 取消 + 恢复原值
  - 确认 → 通过 IPC `update-settings` 保存 → 快捷键管理器自动重新注册
  - 冲突检测：Main Process 在 `update-settings` handler 中检测新键是否可注册 → 不可则返回错误 → UI 显示红色提示"此快捷键已被占用"

**验证**：
1. 点击 [修改] → 出现捕获遮罩
2. 按下 F9 → 显示 "F9"
3. 点击 [确认] → F9 保存为新预览键 → F9 可触发预览
4. 按 Esc → 恢复原 F5
5. [恢复默认] → 一键恢复 F5
6. 使用被其他应用占用的键 → 红色冲突提示

---

### 步骤 12.3 — 设置面板完整组装

- 更新 `src/renderer/components/SettingsPanel.vue`：
  - 3 个圆角卡片分组（`--color-surface-100` 背景，8px 圆角，1px `--color-surface-200` 边框）：
    - 卡片 1：快捷键设置 → `HotkeySettings`
    - 卡片 2：绘制参数 → 速度滑块（100~2000 px/s）+ 鼠标按键（RadioGroup，左/右）+ 透明度滑块（0.3~0.8）+ 线条颜色选取（ColorPicker，默认 `#000000`）
    - 卡片 3：关于 → 版本号 + 技术说明
  - 每张卡片有标题（14px，`--color-surface-800`，font-weight: 600）
  - 小组件：
    - `RadioGroup`：两个 radio button 水平排列，选中项主色边框
    - `ColorPicker`：使用 `<input type="color">` 原生取色器，旁边显示当前颜色值（等宽 12px）
  - 所有设置项修改时通过 `update-settings` IPC 即时持久化

**验证**：
1. 设置面板显示 3 个圆角卡片
2. 所有滑块和选项初始值与配置存储一致
3. 修改速度滑块 → IPC `update-settings` 被触发
4. 修改透明度 → `overlayOpacity` 配置更新 → 预览窗口透明度同步变化
5. 修改线条颜色 → 叠加窗口线条颜色实时更新
6. RadioGroup 切换左/右键 → 配置更新

---

## 阶段 13：导出线稿

### 步骤 13.1 — 导出线稿 PNG 功能

- Main Process `EXPORT_LINEART` handler 实现：
  1. 从上下文中获取当前线稿 Buffer
  2. 若 Buffer 不存在（NOT_READY 状态）→ 返回错误，Toast 通知"无线稿可导出"
  3. 弹出 `dialog.showSaveDialog`（`mainWindow` 为父窗口）：
     - `defaultPath: 'lineart.png'`
     - `filters: [{ name: 'PNG Image', extensions: ['png'] }]`
  4. 用户选择路径 → 使用 `sharp` 将线稿 Buffer 写为 PNG 到目标路径
  5. 保存成功 → Toast "线稿已导出"
  6. 保存失败 → 托盘通知错误信息
  7. 用户取消保存对话框 → 不做任何操作

**验证**：
1. IDLE 状态点击 [导出线稿 PNG] → 保存对话框出现
2. 选择路径保存 → 文件写入成功 → Toast 通知
3. 写入的 PNG 文件可打开且内容为线稿
4. NOT_READY 状态点击 → Toast "无线稿可导出"
5. 托盘"导出线稿 PNG"菜单项仅在 IDLE 时 enabled

---

## 阶段 14：打包与分发

### 步骤 14.1 — electron-builder 配置

- 在 `package.json` 中添加 `build` 字段：
  - `appId`：`"com.akd.app"`
  - `productName`：`"AKD"`
  - `directories.output`：`"release"`
  - `files`：`["dist/**/*", "resources/**/*"]`
  - `extraResources`：`[{ "from": "resources/models", "to": "models" }]`
  - `asar: true`
  - `asarUnpack`：`["node_modules/onnxruntime-node/**", "node_modules/sharp/**", "node_modules/@techstark/opencv-js/**"]`（原生模块不可打包进 asar）
  - Windows：`nsis` 目标，`oneClick: false`
  - macOS：`dmg` 目标
  - Linux：`AppImage` 目标

**验证**：
1. `npx electron-builder --dir` 成功产出未打包目录
2. 目录中 `resources/models/anime2sketch.onnx` 存在
3. `asar unpack` 目录中包含 onnxruntime-node 原生 `.node` 文件

---

### 步骤 14.2 — 完整打包验证

- 运行 `npx electron-builder` 进行完整打包
- 产出安装包 → 安装 → 启动

**验证**：
1. Windows NSIS 安装包生成成功
2. 安装后启动 → 主窗口出现 + 托盘出现
3. 模型文件位于安装目录 `resources/models/` 下
4. `config.json` 在可执行文件同级目录自动创建
5. 导入图片 → 推理 → 路径提取 → 预览 → 绘制全流程可行
6. 退出后托盘消失

---

## 阶段 15：测试套件（贯穿全阶段）

### 步骤 15.1 — 测试基础设施

- 安装 `vitest`（Renderer 侧）+ `tsx`（用于直接运行 node 侧测试）
- 创建 `tests/` 目录结构：
  - `tests/unit/` — 纯逻辑单元测试
  - `tests/integration/` — 多模块集成测试
  - `tests/e2e/` — 端到端测试（Playwright）
- `package.json` 添加脚本：
  - `test:unit` — `npx tsx --test tests/unit/**/*.test.ts`
  - `test:integration` — `npx tsx --test tests/integration/**/*.test.ts`
  - `test:e2e` — `npx playwright test`
  - `test:coverage` — 使用 `c8` 或 `v8` 覆盖率

**验证**：
1. `npm run test:unit` 可执行
2. 覆盖率工具可输出 HTML 报告

---

### 步骤 15.2 — ESM 合规检查脚本

- 创建 `scripts/check-esm.mjs`：
  - 使用正则扫描 `src/` 下所有 `.ts` 文件
  - 检查禁止项：
    - `require(` 调用（排除 adapter 文件）
    - `module.exports`
    - `__dirname`（排除 `const __dirname = fileURLToPath...` 模式）
    - `__filename`
    - `from 'fs'` / `from 'path'` / `from 'os'` 等缺少 `node:` 前缀的导入
  - 检查通过项：
    - 所有 Worker 创建使用 `new URL(..., import.meta.url)`
  - 输出 PASS/FAIL 报告
- 添加到 `package.json` 的 `test:lint` 或 pre-commit hook

**验证**：
1. `node scripts/check-esm.mjs` 在所有文件合规时返回退出码 0
2. 故意添加一行 `require('fs')` 后运行 → 退出码非 0 + 报告文件名 + 行号

---

## 附录 A：ESM 合规速查清单

以下检查项每次提交前全局 grep：

| 检查项 | grep 命令 | 预期结果 |
|--------|----------|---------|
| 无裸 require | `grep -rP "require\(" src/ \| grep -v adapters` | 空 |
| 无 module.exports | `grep -r "module.exports" src/` | 空 |
| 无 __dirname 直接使用 | `grep -rP "(?<!const )__dirname" src/` | 空 |
| 无 __filename | `grep -r "__filename" src/` | 空 |
| Node 内置模块带 node: | `grep -rP "from '(?=fs\|path\|os\|url\|crypto\|events\|util\|stream\|http\|child_process\|worker_threads)" src/` | 空 |
| 相对导入带 .js | `grep -rP "from '\.\.?/[^']*(?<!\.js|\.vue|\.css)';" src/main/ src/workers/ src/shared/` | 空 |
| Worker 创建模式 | `grep -r "new Worker(" src/ \| grep -v "new URL"` | 空 |

## 附录 B：关键设计决策速查

| 决策 | 结论 | 设计文档参考 |
|------|------|-------------|
| 模块系统 | 100% ESM，`"type": "module"` | §3.4 |
| Main/Worker 模块解析 | `NodeNext` + `nodenext` | §3.4.1 |
| Renderer 模块解析 | `bundler`（Vite） | §3.4.1 |
| Node 内置模块 | 强制 `node:` 协议 | §3.4.2 (A) |
| 相对导入后缀 | Main/Worker/Shared 强制 `.js`，Renderer 可选 | §3.4.2 (B) |
| CJS 依赖桥接 | 仅 `src/main/adapters/` 下 `createRequire` | §3.4.6 |
| 路径提取核心算法 | `findContours(RETR_LIST, CHAIN_APPROX_NONE)` 像素级轮廓追踪 | §12.3 步骤 2 |
| 轮廓简化 | `approxPolyDP`（epsilon=1.0 默认，开放路径模式） | §12.3 步骤 3 |
| 绘制顺序 | 首点 Y 升序，同 Y 按 X 升序 | §12.3 步骤 4 |
| 图像预处理（推理） | 512×512 fill，NCHW，[-1, 1] 归一化 | §11.2 |
| 图像后处理（推理） | 反归一化 + 缩放至原图尺寸，保留完整灰度 | §11.4 |
| 绘制坐标转换 | 叠加窗口屏幕位置 + 尺寸缩放因子 | §9.2 |
| 绘制异步循环 | 逐点 `await delay(1/speed)` + 每步检查 `stopFlag` | §9.4 |
| 字体方案 | `@fontsource` npm 自托管，无外部 CDN，中文系统回退 | §4.14.2 |
| 配置持久化 | `electron-store` v11 ESM，便携化落盘 | §10.1 |
| 叠加窗性能策略 | `requestAnimationFrame` 帧节流 + Canvas 渲染 + 纯透明（不 blur）| §5.3 |
| 状态灯无障碍 | 颜色 + 图标 + 文字三重表达 + `aria-live="polite"` | §4.7.1 |
| ERROR 状态红灯 | 静态常亮，不闪烁（光敏性癫痫风险） | §4.7.1 |