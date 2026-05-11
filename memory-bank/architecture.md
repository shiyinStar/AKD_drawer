# AKD 项目架构

**最后更新**: 2026-05-11 (阶段 3 完成 + bug 修复)

---

## 目录结构

```
AKD_final/
├── package.json              # 项目清单: ESM, 依赖, scripts
├── tsconfig.json             # TypeScript 根配置 (project references)
├── tsconfig.main.json        # Main Process + Preload 编译配置
├── tsconfig.worker.json      # Worker Threads 编译配置
├── tsconfig.renderer.json    # Renderer (Vue/Vite) 编译配置
├── tsconfig.shared.json      # 共享类型编译配置
├── vite.config.ts            # Vite 构建配置 (Renderer)
├── .gitignore                # Git 忽略规则
├── README.md                 # 项目说明
├── scripts/
│   ├── dev.ts                # 开发编排：spawn Vite → 轮询就绪 → spawn Electron
│   ├── build-main.mjs        # esbuild: Main Process + Preload → dist/main/
│   └── build-workers.mjs     # esbuild: Workers → dist/workers/
├── src/
│   ├── main/
│   │   ├── index.ts          # Electron 主进程入口
│   │   ├── app-context.ts    # 依赖注入容器
│   │   ├── ipc-handlers.ts   # IPC 通信层
│   │   ├── state-machine.ts  # 全局状态机
│   │   └── config-store.ts   # 配置存储
│   ├── preload/
│   │   └── index.ts          # contextBridge preload 脚本
│   ├── shared/
│   │   └── types.ts          # 核心类型、枚举、IPC 通道常量
│   ├── renderer/
│   │   ├── env.d.ts          # .vue 模块声明 + window.electronAPI 全局类型
│   │   ├── index.html        # Vite 入口 HTML
│   │   ├── main.ts           # Vue 应用入口
│   │   ├── App.vue           # 根组件（四区域完整布局）
│   │   ├── components/
│   │   │   ├── TitleBar.vue      # 自定义标题栏（32px，窗口控制按钮）
│   │   │   ├── SideNav.vue       # 左侧导航栏（48px，图标式垂直导航）
│   │   │   ├── NavItem.vue       # 导航项（48×48px，激活态蓝色竖条）
│   │   │   ├── ContentRouter.vue # 内容路由（动态组件 + 淡入淡出过渡）
│   │   │   ├── StatusBar.vue     # 底部状态栏（28px，slot 占位）
│   │   │   ├── ImagePanel.vue    # 图片面板（左右双栏 + 底部工具栏）
│   │   │   ├── ImageDropZone.vue # 拖拽导入区（虚线边框 + 格式校验）
│   │   │   ├── PanelToolbar.vue  # 面板工具栏（导入/导出按钮）
│   │   │   └── SettingsPanel.vue # 设置面板（占位）
│   │   └── styles/
│   │       ├── global.css    # CSS reset + 暗色主题 + 滚动条样式
│   │       ├── tokens.css    # 全局设计 Token（颜色/间距/圆角/动画）
│   │       └── typography.css # 排版工具类
│   └── workers/
│       ├── inference/
│       │   └── worker.ts     # [占位] ONNX 推理 Worker
│       └── path-extraction/
│           └── worker.ts     # [占位] OpenCV 路径提取 Worker
├── dist/                     # 构建产物 (git ignored)
│   ├── main/                 # esbuild 输出
│   ├── workers/              # esbuild 输出
│   └── renderer/             # Vite 输出
├── node_modules/             # 依赖 (git ignored)
├── memory-bank/              # 设计文档与进度跟踪
│   ├── akd-design.md         # 完整设计规格
│   ├── AKD-Implementation-Plan.md  # 实施计划
│   ├── architecture.md       # 本文件
│   └── progress.md           # 开发进度
└── tests/
    └── unit/
        ├── state-machine.test.ts    # 状态机 15 个单元测试
        └── config-store.test.ts     # 配置存储 8 个单元测试
```

## 文件职责说明

### package.json
项目根清单。关键字段:
- `"type": "module"` — 全局 ESM 模式，`.js` 文件默认作为 ES Module 解析
- `"private": true` — 防止意外发布
- scripts: `dev` (Vite + Electron 编排)、`build` (esbuild + Vite)、`start` (生产启动)

### TypeScript 配置 (5 个文件)

| 文件 | 目标层 | 关键差异 |
|------|--------|---------|
| tsconfig.json | 根 | `references` 引用其余 4 个，自身不编译 |
| tsconfig.main.json | Main + Preload | `NodeNext` + `nodenext`，运行于 Node.js |
| tsconfig.worker.json | Workers | 同 Main，`worker_threads` 为 Node API |
| tsconfig.renderer.json | Vue 前端 | `ESNext` + `bundler`，Vite 打包 |
| tsconfig.shared.json | 跨层共享 | `NodeNext` + `nodenext`，被 Main/Worker 消费 |

**为什么分 4 个子配置而非一个?** Main/Worker 和 Renderer 的模块系统不同。Node.js 需要 `NodeNext` + `.js` 后缀，而 Vite 使用 `bundler` 解析器可省略后缀。共享层被 Main/Worker 消费，必须与消费方兼容。

### vite.config.ts
Vite 构建 Renderer:
- `root: 'src/renderer'` — HTML 入口路径
- `base: './'` — 相对路径，适配 Electron file:// 加载
- `build.modulePreload: false` — Electron 渲染进程不需要 modulepreload polyfill

### scripts/dev.ts
开发模式编排脚本（`npm run dev` → `npx tsx scripts/dev.ts`）：
- `spawn('npx', ['vite'])` 启动 Vite dev server（stdio: inherit）
- HTTP 轮询 `http://localhost:5173`（每 300ms，最长 30s）等待就绪
- Vite 就绪后 `spawn('npx', ['electron', '.'])` 并设置 `VITE_DEV_SERVER_URL` 环境变量
- Electron 退出时 kill Vite，反之亦然

### scripts/build-main.mjs
esbuild 构建 Main Process 和 Preload。关键配置:
- `format: 'esm'` — 输出 ESM
- `external` 列表包含 `electron`、`onnxruntime-node` 等原生模块（不打包）
- 所有 `node:*` 内置模块列为 external

### scripts/build-workers.mjs
esbuild 构建两个 Worker。除不需要 external `electron` 外，与 build-main.mjs 配置一致。

### src/shared/types.ts
**所有层共享的类型定义中心**，零业务逻辑:
- `StatusState` 枚举 — 全局状态机的 5 个状态
- `Point` / `DrawPath` / `BoundingBox` — 路径与几何数据结构
- `AppConfig` — 配置存储结构
- `PipelineProgress` / `ErrorInfo` — IPC 通信数据结构
- `IPC_CHANNELS` — 13 个 IPC 通道名常量（as const），含 3 个窗口控制通道（WINDOW_MINIMIZE/MAXIMIZE/CLOSE）

### src/main/index.ts
Electron 主进程入口。`app.whenReady()` → `createAppContext()` → `createMainWindow()` → `registerIpcHandlers()`:
- 创建 `AppContext`（DI 容器，持有状态机 + 配置存储 + 主窗口引用）
- `createMainWindow()` 创建 960×680 BrowserWindow（`frame: false` 无框窗口，`minWidth: 720` / `minHeight: 480` 最小尺寸限制）
- CSP 通过 `session.defaultSession.webRequest.onHeadersReceived` 设置
- `show: false` + `ready-to-show` → `win.show()` 避免白屏
- 开发模式 `loadURL(http://localhost:5173)`，生产模式 `loadFile(dist/renderer/index.html)`
- `window-all-closed` 不执行 `app.quit()`（为系统托盘保留进程）
- `registerIpcHandlers()` 注册所有 IPC handler，传入 `getState` + `getMainWindow` 依赖

### src/main/app-context.ts
依赖注入容器 — 持有三个核心单例的引用：
- `stateMachine: StateMachine` — 全局状态机实例
- `configStore: ConfigStore` — 配置存储实例（由 `createAppContext` 创建，cwd 指向 `dirname(process.execPath)`）
- `mainWindow: BrowserWindow | null` — 主窗口引用（初始 null，窗口创建后赋值）
- `createAppContext()` 工厂函数负责组装，禁止模块间全局 import 互相引用

### src/main/ipc-handlers.ts
IPC 通信层 — 集中注册所有 `ipcMain.handle` 处理器（8 个 handler）：
- `APP_STATE` → 返回当前状态机状态
- `IMPORT_IMAGE(filePath)` → 占位（返回 `{ success: false }`）
- `RETRY_FROM_ERROR()` → 占位
- `UPDATE_SETTINGS(partialSettings)` → 占位
- `export-lineart()` → 占位
- `WINDOW_MINIMIZE` → 调用 `BrowserWindow.minimize()` — 阶段 3 新增
- `WINDOW_MAXIMIZE` → 调用 `BrowserWindow.isMaximized()` 判断后 toggle — 阶段 3 新增
- `WINDOW_CLOSE` → 调用 `BrowserWindow.hide()`（隐藏到托盘，不退出） — 阶段 3 新增
- 通过 `IpcHandlerDeps` 接口接收依赖：`getState` + `getMainWindow`
- 后续阶段将逐步替换占位实现为真实业务逻辑

### src/main/state-machine.ts
全局状态机 — AKD 的核心控制中枢：
- `InvalidTransitionError` — 自定义异常，非法状态转移时抛出
- `StateMachine` 类：`getState()`、`transition(newState)`、`onStateChange(listener)`、`removeStateChangeListener(listener)`
- `transition()` 校验转移合法性（白名单 `VALID_TRANSITIONS`），非法转移抛异常且**状态不改变**
- 基于 `EventEmitter`（`node:events`）发布 `state-change` 事件，事件参数 `{ from, to }`
- 导出单例 `stateMachine`
- 5 状态转移规则：NOT_READY→IDLE/ERROR, IDLE→PREVIEWING/NOT_READY/ERROR, PREVIEWING→DRAWING/IDLE/NOT_READY/ERROR, DRAWING→IDLE/NOT_READY/ERROR, ERROR→NOT_READY

### src/main/config-store.ts
配置持久化存储 — 基于 `electron-store` v11 原生 ESM：
- Schema 含全部 6 项默认值：hotkeys（preview/startDraw/stopDraw）、drawSpeed（500）、mouseButton（'left'）、overlayOpacity（0.6）、overlayLineColor（'#000000'）
- `get(key)` / `set(key, value)` / `getAll()` / `reset(key)` / `onDidChange(key, callback)`
- 构造函数接收 `cwd` 选项（测试时传临时目录，生产时 `createAppContext` 传入 `dirname(process.execPath)` 便携化部署）
- 不再导出模块级单例，由 `createAppContext` 负责初始化

### src/preload/index.ts
contextBridge preload 脚本。通过 `exposeInMainWorld` 向渲染进程注入 `window.electronAPI`，提供 12 个方法：
- 状态监听：`getAppState`(invoke)、`onAppStateChange`(on)、`onDrawStatus`(on)、`onAppError`(on)
- 管线监听：`onPipelineProgress`(on)
- 用户操作：`importImage`(invoke)、`retryFromError`(invoke)、`updateSettings`(invoke)、`exportLineArt`(invoke)
- 窗口控制：`windowMinimize`(invoke)、`windowMaximize`(invoke)、`windowClose`(invoke) — 阶段 3 新增
- 全部使用 `ipcRenderer.invoke`/`on` Promise 模式，禁止 `sendSync`
- 从 `../shared/types.js` 导入 `IPC_CHANNELS` 常量

### src/renderer/env.d.ts
TypeScript 环境声明文件：
- `*.vue` 模块声明（`DefineComponent` 类型）
- `window.electronAPI` 全局接口（`ElectronAPI`），12 个方法签名与 preload 完全对应（含 3 个窗口控制方法）
- 被 `tsconfig.renderer.json` 的 `include` 自动拾取

### src/renderer/App.vue
Vue 3 根组件。完整四区域布局（从上到下）：
- **TitleBar**（32px）— 自定义标题栏，窗口拖拽 + 控制按钮
- **SideNav**（48px）+ **ContentRouter**（flex-grow）— 左侧导航 + 内容区
- **StatusBar**（28px）— 底部状态栏

管理 `activePanel` 响应式状态（`'image'` | `'settings'`），通过 props/emit 传递给子组件。根元素 `data-theme="dark"` 切换全局主题 CSS 变量。Flexbox 纵向布局，`overflow: hidden` 防止滚动条。

### src/renderer/index.html
Vite 构建的 HTML 入口。`<meta charset="UTF-8">`、`lang="zh-CN"`、`<div id="app">`、`<script type="module" src="./main.ts">`。

### src/renderer/main.ts
Vue 应用入口点：
- 导入 `@fontsource/inter` 3 个字重（400/500/600）
- 导入 `@fontsource/jetbrains-mono` 2 个字重（400/500）
- 导入 `./styles/global.css`（CSS reset + 暗色主题基础）
- `createApp(App).mount('#app')` 挂载根组件

### src/renderer/styles/global.css
全局基础样式。通过 `@import` 引入 tokens.css 和 typography.css，所有颜色/字体使用 CSS 变量（`var(--color-*)` / `var(--font-ui)`）替代硬编码值。包含暗色滚动条样式（宽度 6px、thumb `--color-surface-400`）和选中文本高亮。

### src/renderer/styles/tokens.css
全局设计 Token 定义文件——AKD 视觉系统的"唯一数据源"：
- **颜色系统**：主色（靛蓝紫 500/600）、暗色表面 9 阶（0→900 由深至浅）、语义色 4 种、毛玻璃色
- **排版**：`--font-ui`（Inter + 微软雅黑 + 苹方链）、`--font-mono`（JetBrains Mono + Cascadia Code + Consolas 链）
- **间距**：4px 基准 7 级等比（`--space-1` 至 `--space-7` = 4/8/12/16/24/32/48）
- **圆角**：4 级（`--radius-1` 至 `--radius-4` = 4/6/8/12）
- **动画**：4 级时长（fast 150ms / normal 250ms / slow 300ms / spring 400ms）+ 4 种缓动函数
- **亮色主题**：`[data-theme="light"]` 下表面色 9 阶反向（0=浅、900=深）
- **关键帧**：`@keyframes status-pulse`（2s 脉冲呼吸）、`@keyframes status-glow`（3s 光晕扩散）

### src/renderer/styles/typography.css
排版工具类：`.text-body`（13px）、`.text-caption`（11px）、`.text-mono`（等宽 13px）、`.text-heading`（16px semibold）。

### src/renderer/components/TitleBar.vue
自定义标题栏组件（32px 固定高）：
- `-webkit-app-region: drag` 使窗口可通过拖拽标题栏移动，按钮区域 `no-drag`
- 左侧 "AKD" 标签（12px `--color-surface-600`）
- 右侧三个窗口控制按钮（lucide 图标 16px，stroke-width 1.5）：Minus（最小化）、Square（最大化）、X（关闭）
- 关闭按钮 hover 变 `--color-error`（红色），双击标题栏切换最大化/还原
- 通过 `window.electronAPI.windowMinimize/Maximize/Close()` 与主进程通信

### src/renderer/components/SideNav.vue
左侧导航栏（48px 固定宽，flex-shrink: 0）：
- 顶部区域：图片面板（Image 图标）→ 设置面板（Settings 图标），垂直排列
- 底部固定：关于（Info 图标）
- 接收 `activePanel` prop + emit `update:activePanel`，实现 v-model 双向绑定
- 每个导航项为 `NavItem` 子组件

### src/renderer/components/NavItem.vue
导航项按钮（48×48px 点击区域）：
- props：`icon`（Component 引用）、`label`（tooltip 文字）、`active`（boolean）
- 图标 20×20px，`currentColor` 继承，stroke-width 1.5
- 激活态：左侧 2px `--color-primary-500` 竖条 + 图标同色
- 非激活 hover：图标变 `--color-surface-700`

### src/renderer/components/ContentRouter.vue
内容区路由组件：
- 根据 `activePanel` prop 动态渲染（`<component :is="...">`）
- `'image'` → `ImagePanel`、`'settings'` → `SettingsPanel`
- `<Transition name="panel" mode="out-in">` 250ms `ease-in-out` 淡入淡出

### src/renderer/components/StatusBar.vue
底部状态栏（28px 固定高，flex-shrink: 0）：
- `--color-surface-100` 背景 + 顶部 1px 边框
- 左右两个具名 slot：`indicator`（状态指示灯占位）、`tasks`（后台任务占位）

### src/renderer/components/ImagePanel.vue
图片面板（单页应用核心内容区）：
- `hasImage` ref 驱动布局切换（`v-if`/`v-else`）
- **未导入**：整块 `ImageDropZone` 铺满内容区（单一完整矩形），无分隔线
- **已导入**：左右双栏（flex: 1），中间 1px `--color-surface-300` 分隔线，各显示 placeholder（"原图"/"线稿"标签 + Image 图标，`--color-surface-400`）
- 监听 `@file-selected` 事件设置 `hasImage = true`
- 底部 `PanelToolbar`，`@import` 事件重置 `hasImage = false` 重新导入
- 后续阶段：placeholder 将替换为 `ImageViewer` 组件展示实际图片

### src/renderer/components/ImageDropZone.vue
图片拖拽导入区：
- 空状态：`2px dashed --color-surface-500` 边框 + ImagePlus 48px 图标 + 提示文字
- `dragover`：`e.dataTransfer.types.includes('Files')` 判断是否为文件拖拽 → 蓝框（浏览器安全限制下 dragover 无法读取文件名，故无法在此阶段校验扩展名）
- `drop`：通过 `file.name` 校验扩展名（.png/.jpg/.jpeg/.webp/.bmp）→ 不支持格式红色边框 300ms 闪烁
- 校验通过后：获取 `file.path`（Electron 特性）→ `window.electronAPI.importImage()` + `emit('file-selected', filePath)` 通知父组件
- 点击 → 触发隐藏 `<input type="file">` 打开系统文件选择器
- `defineEmits` 暴露 `file-selected` 事件供父组件 `ImagePanel` 监听以切换布局

### src/renderer/components/PanelToolbar.vue
图片面板顶部工具栏（40px 固定高，`border-bottom` 分隔线）：
- props：`hasImage: boolean` — 控制导出按钮 disabled 态
- emits：`import` — 点击导入按钮时通知父组件重置为拖拽区
- 左侧 [导入图片] 主按钮：`--color-primary-500` 填充 + hover 上浮 1px，Download 图标
- 右侧 [导出线稿 PNG] 次按钮：透明 + 主色边框，`hasImage` 为 false 时 disabled（灰色态，`cursor: not-allowed`），Upload 图标

### src/renderer/components/SettingsPanel.vue
设置面板占位组件，仅显示居中 "设置" 文字（`--color-surface-500`）。阶段 12 将替换为完整设置表单。

### src/workers/inference/worker.ts (占位)
ONNX Runtime 推理 Worker。后续将: 加载 anime2sketch.onnx 模型、图片预处理/推理/后处理。

### src/workers/path-extraction/worker.ts (占位)
OpenCV.js 路径提取 Worker。后续将: 二值化 + findContours + approxPolyDP + 排序。

## 已知问题

- **Node.js v24 + `.mjs` 类型注解**：Node.js v24 对 `.mjs` 文件不做 TypeScript 类型剥离，`(data: Buffer)` 等语法导致 `SyntaxError: Unexpected token ':'`。解决：使用 `.ts` 扩展名 + `tsx` 运行（`npx tsx scripts/dev.ts`），纯 JS 的 `.mjs` 仍可直接 `node` 运行（如 `build-main.mjs`、`build-workers.mjs`）。
- **`session.defaultSession` 是静态成员**：不能通过 `win.webContents.session.defaultSession`（实例）访问，必须通过 `import { session } from 'electron'; session.defaultSession` 静态访问。

## 模块系统约束

```
100% ESM（零 CommonJS）

强制规则:
├── Node 内置模块 → import ... from 'node:xxx'
├── 相对导入 (Main/Worker/Shared) → 必须带 .js 后缀
├── 相对导入 (Renderer) → 可省略后缀 (Vite bundler 自动解析)
├── __dirname/__filename → import.meta.url + fileURLToPath
├── Worker 创建 → new Worker(new URL('...', import.meta.url))
└── CJS 依赖 (仅 nut-js) → src/main/adapters/ 下 createRequire 桥接
```

## 依赖注入架构

已实现。`createAppContext()` 工厂函数在 `src/main/index.ts` 的 `app.whenReady()` 中调用，组装三个核心依赖：
- `stateMachine` — 全局状态机单例（`StateMachine` 实例）
- `configStore` — 配置存储单例（`ConfigStore` 实例，cwd 指向 `dirname(process.execPath)`）
- `mainWindow` — 主 BrowserWindow 引用（初始为 null，窗口创建后赋值）

各模块通过 `IpcHandlerDeps` 等接口接收依赖，禁止模块间直接 import 全局单例。`registerIpcHandlers()` 接收 `{ getState, getMainWindow }` 两个 getter 函数。
