# AKD 项目架构

**最后更新**: 2026-05-12 (阶段 9 完成)

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
│   ├── build-workers.mjs     # esbuild: Workers → dist/workers/
│   └── generate-tray-icons.ts # 一次性脚本：生成托盘图标 PNG（阶段 9 新增）
├── resources/
│   ├── models/               # ONNX 模型文件
│   └── icons/
│       └── tray/              # 托盘状态图标（5 个 PNG，阶段 9 新增）
├── src/
│   ├── main/
│   │   ├── index.ts          # Electron 主进程入口
│   │   ├── app-context.ts         # 依赖注入容器
│   │   ├── ipc-handlers.ts        # IPC 通信层
│   │   ├── image-import-handler.ts # 图片导入与校验
│   │   ├── state-machine.ts       # 全局状态机
│   │   ├── config-store.ts        # 配置存储
│   │   ├── worker-manager.ts       # Worker 生命周期管理
│   │   ├── pipeline-orchestrator.ts # 管线编排器
│   │   ├── preview-overlay.ts       # 叠加窗口管理 + 全局快捷键
│   │   ├── drawing-engine.ts       # 绘制引擎（阶段 8 新增）
│   ├── tray-manager.ts         # 系统托盘管理器（阶段 9 新增）
│   │   └── adapters/
│   │       └── nut-js-adapter.ts   # CJS→ESM 桥接（阶段 8 新增）
│   ├── preload/
│   │   ├── index.ts          # 主窗口 contextBridge preload
│   │   └── overlay.ts        # 叠加窗口 contextBridge preload
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
│   │   │   ├── ImagePanel.vue      # 图片面板（拖拽区 ↔ 双图对比）
│   │   │   ├── ImageDropZone.vue   # 拖拽导入区 + 文件选择器
│   │   │   ├── ImageCompare.vue    # 原图/线稿双栏对比容器
│   │   │   ├── ImageViewer.vue     # 可缩放拖拽的图片查看器
│   │   │   ├── PanelToolbar.vue    # 面板工具栏（导入/导出按钮）
│   │   │   ├── StatusIndicator.vue # 5 状态指示灯（颜色+图标+动画+ARIA）
│   │   │   ├── ToastContainer.vue  # Toast 通知容器（右下角固定）
│   │   │   ├── ToastItem.vue       # 单条 Toast（毛玻璃+类型色条）
│   │   │   └── SettingsPanel.vue   # 设置面板（占位）
│   │   └── overlay/
│   │       ├── index.html       # 叠加层 HTML 入口（Canvas + 缩放标签）
│   │       └── main.ts          # 叠加层逻辑（Canvas 渲染 + 交互切换）
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
    ├── unit/
    │   ├── state-machine.test.ts        # 状态机 15 个单元测试
    │   ├── config-store.test.ts         # 配置存储 8 个单元测试
    │   ├── image-import-handler.test.ts # 图片导入 15 个单元测试
    │   ├── inference-worker.test.ts     # 推理 Worker 6 个单元测试
    │   ├── geometry-utils.test.ts       # 几何工具 3 个单元测试
    │   ├── path-extraction-worker.test.ts # 路径提取 Worker 7 个单元测试
    │   └── drawing-engine.test.ts       # 绘制引擎 13 个单元测试（阶段 8 新增）
    └── integration/
        └── pipeline-e2e.test.ts         # 管线端到端 5 个集成测试
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
开发模式编排脚本（`npm run dev` → `npx tsx scripts/dev.ts`）— 阶段 4 更新：
- **启动前** `execSync('node scripts/build-main.mjs')` 构建 Main Process + Preload，确保主进程改动即时生效
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

### scripts/generate-tray-icons.ts
一次性托盘图标生成脚本 — 阶段 9 新增：
- 使用 `sharp` 从内嵌 SVG 模板生成 5 个 32×32 PNG 文件
- 输出到 `resources/icons/tray/`（自动创建目录）
- 5 种图标设计：`solid`（纯色圆）、`dashed-ring`（虚线环+圆点）、`glow`（外光晕+圆点）、`cross`（淡底+圆点）
- 手动执行：`npx tsx scripts/generate-tray-icons.ts`
- 不纳入 CI/CD 或 pre-commit hook——仅在图标设计变更时手动运行

### src/shared/types.ts
**所有层共享的类型定义中心**，零业务逻辑:
- `StatusState` 枚举 — 全局状态机的 5 个状态
- `Point` / `DrawPath` / `BoundingBox` — 路径与几何数据结构
- `AppConfig` — 配置存储结构
- `PipelineProgress` / `ErrorInfo` — IPC 通信数据结构
- `IPC_CHANNELS` — 16 个 IPC 通道名常量（as const），含 3 个窗口控制 + 3 个阶段 4 新增（SHOW_TOAST/GET_IMAGE_DATA/OPEN_FILE_DIALOG）
- `ToastMessage` 接口 — 阶段 4 新增：`type`（4 种语义）、`message`、`duration?`

### src/main/index.ts
Electron 主进程入口。`app.whenReady()` → `createAppContext()` → `createMainWindow()` → `registerIpcHandlers()`:
- 创建 `AppContext`（DI 容器，持有状态机 + 配置存储 + 主窗口引用）
- `createMainWindow()` 创建 960×680 BrowserWindow（`frame: false` 无框窗口，`minWidth: 720` / `minHeight: 480` 最小尺寸限制）
- CSP 通过 `session.defaultSession.webRequest.onHeadersReceived` 设置：`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' data:` — 阶段 4 新增 `img-src data:` 以允许渲染进程显示 data URL 图片
- `show: false` + `ready-to-show` → `win.show()` 避免白屏
- 开发模式 `loadURL(http://localhost:5173)`，生产模式 `loadFile(dist/renderer/index.html)`
- `window-all-closed` 不执行 `app.quit()`（为系统托盘保留进程）
- `registerIpcHandlers()` 注册所有 IPC handler，传入 `getState` + `getMainWindow` 依赖

### src/main/app-context.ts
依赖注入容器 — 持有核心单例和运行时数据：
- `stateMachine: StateMachine` — 全局状态机实例
- `configStore: ConfigStore` — 配置存储实例（由 `createAppContext` 创建，cwd 指向 `dirname(process.execPath)`）
- `mainWindow: BrowserWindow | null` — 主窗口引用（初始 null，窗口创建后赋值）
- `imageBuffer: Buffer | null` — 当前导入的图片 Buffer（内存中，供推理/路径提取 Worker 消费）— 阶段 4 新增
- `imagePath: string | null` — 当前导入的图片完整路径 — 阶段 4 新增
- `lineArtBuffer: Buffer | null` — 推理产出的线稿 PNG Buffer（供 UI 展示和路径提取 Worker 消费）— 阶段 5 新增
- `lineArtBase64: string | null` — 线稿 base64 编码字符串（供 IPC 传输到渲染进程）— 阶段 5 新增
- `createAppContext()` 工厂函数负责组装，禁止模块间全局 import 互相引用

### src/main/ipc-handlers.ts
IPC 通信层 — 集中注册所有 `ipcMain.handle` 处理器（11 个 handler）：
- `APP_STATE` → 返回当前状态机状态
- `IMPORT_IMAGE(filePath)` → 调用 `handleImportImage` 校验 + 读取 + 存储；成功后推送 `SHOW_TOAST` + `APP_STATE` — 阶段 4 实现
- `GET_IMAGE_DATA` → 从 context 读取 imageBuffer 并返回 base64 data URL — 阶段 4 新增
- `OPEN_FILE_DIALOG` → 调用 `dialog.showOpenDialog` 弹出原生文件选择器 — 阶段 4 新增
- `RETRY_FROM_ERROR()` → 占位
- `UPDATE_SETTINGS(partialSettings)` → 占位
- `export-lineart()` → 占位
- `WINDOW_MINIMIZE` → `BrowserWindow.minimize()`
- `WINDOW_MAXIMIZE` → `isMaximized()` toggle
- `WINDOW_CLOSE` → `BrowserWindow.hide()`
- 通过 `IpcHandlerDeps` 接口接收依赖：`getState` + `getMainWindow` + `getContext` — 阶段 4 新增 `getContext`

### src/main/image-import-handler.ts
图片导入与文件校验模块 — 负责接收文件路径、验证文件合法性、读取 Buffer 并存入 AppContext：
- `handleImportImage(filePath, ctx): Promise<ImportResult>` 异步函数，按顺序执行：`access`（文件存在检查）→ `readFile` → `validateFormat`（扩展名 + magic bytes）→ 写入 `ctx.imageBuffer`/`ctx.imagePath` → 返回 `{ success, dataUrl, fileName }`
- `acceptedExtensions` 白名单：`.png` / `.jpg` / `.jpeg` / `.webp` / `.bmp`
- `magicBytes` 签名表：PNG（8 字节头）、JPEG（3 字节）、BMP（2 字节）；WebP 使用独立函数 `checkWebpMagic` 校验 RIFF+WEBP 头
- MIME 映射：根据扩展名生成 `data:image/xxx;base64,...` 格式的 data URL
- 校验失败时返回 `{ success: false, reason: string }`，不修改 context 中已有数据
- 与 `ipc-handlers.ts` 的解耦：handler 文件仅负责注册 IPC 通道，实际导入逻辑委托给本模块

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
- Toast 通知：`onToast`(on) — 阶段 4 新增
- 数据获取：`getImageData`(invoke) — 阶段 4 新增
- 文件对话框：`openFileDialog`(invoke) — 阶段 4 新增
- 共 15 个方法，全部使用 `ipcRenderer.invoke`/`on` Promise 模式
- 从 `../shared/types.js` 导入 `IPC_CHANNELS`、`ToastMessage` 类型

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

管理 4 项全局状态（阶段 4 扩展）：
- `activePanel` — 侧栏导航切换
- `appStatus` + `statusExtra` — 状态指示灯驱动（IPC `onAppStateChange` + `getAppState`）
- `toasts` — Toast 队列管理（IPC `onToast`），上限 3 条，自动移除

模块顶层挂载 `__akdDebug` 调试接口（`setStatus` / `toast`），DevTools 控制台可手动触发状态切换或弹出 Toast。根元素 `data-theme="dark"` 切换全局主题。

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
图片面板（单页应用核心内容区）— 阶段 4 重构：
- `hasImage` ref 驱动布局切换（`v-if`/`v-else`）
- **未导入**：整块 `ImageDropZone` 铺满内容区，通过 `ref` + `nextTick` 在按钮点击后自动弹出文件选择器
- **已导入**：`ImageCompare` 双图对比（左侧原图 + 右侧线稿），各含独立 `ImageViewer`
- 状态管理：`originalSrc`、`lineArtSrc`、`isProcessing` 三个 ref
- 顶部 `PanelToolbar`，"导入图片"按钮触发 `onImportClick`：重置状态 → `await nextTick()` → `dropZoneRef.openFilePicker()`
- 后续阶段：placeholder 将替换为 `ImageViewer` 组件展示实际图片

### src/renderer/components/ImageDropZone.vue
图片拖拽导入区 — 阶段 4 重构：
- 空状态：`2px dashed --color-surface-500` 边框 + ImagePlus 48px 图标 + 提示文字
- `dragover`：`e.dataTransfer.types.includes('Files')` 判断 → 蓝框
- `drop`：通过 `file.name` 校验扩展名 → 不支持格式红色边框 300ms 闪烁 → 先尝试 `file.path` 走主进程 IPC `importImage`；若 `path` 不可用（Electron sandbox）则 fallback 到 `FileReader.readAsDataURL()`
- 点击 → `<input type="file">` → `FileReader` 读取文件内容为 data URL → emit
- `defineExpose({ openFilePicker })` 暴露方法供父组件通过 ref 调用
- emit 数据格式：`{ filePath: string; dataUrl?: string }`

### src/renderer/components/PanelToolbar.vue
图片面板顶部工具栏（40px 固定高，`border-bottom` 分隔线）：
- props：`hasImage: boolean` — 控制导出按钮 disabled 态
- emits：`import` — 点击导入按钮时通知父组件重置为拖拽区
- 左侧 [导入图片] 主按钮：`--color-primary-500` 填充 + hover 上浮 1px，Download 图标
- 右侧 [导出线稿 PNG] 次按钮：透明 + 主色边框，`hasImage` 为 false 时 disabled（灰色态，`cursor: not-allowed`），Upload 图标

### src/renderer/components/ImageCompare.vue
双图对比容器 — 阶段 4 新增。左右两栏（`flex: 1`），中间 1px `--color-surface-300` 分隔线。Props：`originalSrc`、`lineArtSrc`、`loading`。各栏嵌入一个 `ImageViewer` 实例。

### src/renderer/components/ImageViewer.vue
图片查看器 — 阶段 4 新增。支持三种状态切换：
- **加载中**：骨架屏（3 条灰色横条 + shimmer 从左到右扫描动画）
- **空状态**：Image 图标 32px + 文字标签
- **图片显示**：`<img>` 标签，`object-fit: contain` 自适应居中
- **滚轮缩放**：10%~200%（`CSS transform: scale()`，步进 0.05），GPU 加速
- **拖拽平移**：缩放 > 1x 时按住鼠标拖拽（`translate`，移动量按缩放比修正使手感与缩放级别无关）。缩放回到 ≤ 1x 时平移自动归零。光标 `grab` / `grabbing`
- 右下角缩放比例指示器（等宽字体，仅缩放 ≠ 1x 时显示）

### src/renderer/components/StatusIndicator.vue
状态指示灯 — 阶段 4 新增。5 状态完整映射（NOT_READY / IDLE / PREVIEWING / DRAWING / ERROR）：
- 结构：`[● 8px圆点] [Lucide图标 16px] [标签 12px] | [附加信息 12px]`
- 圆点动画：`status-pulse`（NOT_READY 2s / DRAWING 1s）、`status-glow`（PREVIEWING 3s）、IDLE 和 ERROR 静态
- 颜色通过根节点 `style` binding 直接设置，子元素使用 `currentColor` 继承 — 单点切换全链响应
- 无障碍：`role="status"` + `aria-live`（ERROR 为 `assertive`，其余 `polite`）
- 使用 Props 驱动而非依赖全局状态，可在任意上下文中复用

### src/renderer/components/ToastItem.vue
单条 Toast 通知 — 阶段 4 新增。Props：`id`、`type`（success/warning/error/info）、`message`、`duration`。4 种类型对应不同 Lucide 图标（Check/AlertTriangle/X/Info）和语义色。结构：左侧 2px 类型色竖条 + 图标 + 文字。毛玻璃背景（`backdrop-filter: blur(12px)`）。入场动画 300ms 右滑入，`onMounted` 定时器到期后触发出场动画并 emit `remove`。

### src/renderer/components/ToastContainer.vue
Toast 容器 — 阶段 4 新增。固定定位右下角（`bottom: 12px; right: 12px`），`z-index: 9999`。接收 `toasts` 数组 prop，通过 `TransitionGroup` 渲染列表。`pointer-events: none` 允许穿透，子项恢复 `auto`。`aria-live="polite"`。

### src/renderer/components/SettingsPanel.vue
设置面板占位组件，仅显示居中 "设置" 文字（`--color-surface-500`）。阶段 12 将替换为完整设置表单。

### src/workers/inference/worker.ts
ONNX Runtime 推理 Worker — 阶段 5 实现：
- 通过 `workerData.modelPath` 接收模型路径，`InferenceSession.create()` 加载模型（CPU 推理，会话缓存复用）
- 预处理：`sharp` resize 512×512 fill → `.removeAlpha()` 确保 3 通道 RGB → raw 像素 → NCHW Float32Array 归一化 `[-1, 1]`
- 推理：构造 `ort.Tensor('float32', chwData, [1, 3, 512, 512])` → `session.run({ input: tensor })`
- 后处理：输出张量反归一化 → Uint8Array `[0, 255]` → `sharp` 缩放回原始尺寸（从 metadata 自动检测）→ PNG Buffer
- 30s 超时保护 + 错误消息回传

### src/workers/path-extraction/worker.ts
路径提取 Worker — 阶段 6~7：
- **OpenCV 依赖**：`@dalongrong/opencv-wasm`（v4.8.1，CJS），通过 `createRequire(import.meta.url)` 同步加载
- **预处理**（OpenCV）：`GaussianBlur(3,3)` 降噪 → `THRESH_BINARY_INV | THRESH_OTSU` 自适应阈值 → `MORPH_CLOSE(2,2)` 闭合断线
- **骨架化**（纯 TypeScript）：Zhang-Suen 迭代细化算法，将白色线条区域缩减为 1px 宽中心线骨架
- **路径追踪**（纯 TypeScript）：从端点出发沿骨架走，在交叉点分叉，生成单线路径；孤立闭合环单独处理
- 过滤 < 3 点的路径，按首点 Y 升序排序
- 所有 `cv.Mat` 使用完毕调用 `.delete()` 释放 WASM 内存
- **⚠ 算法演进**：阶段 6 使用 `findContours`（轮廓描边）→ 阶段 7 替换为骨架化 + 追踪（单线中心线），解决了粗线变双线的问题

### src/main/preview-overlay.ts
叠加窗口管理 + 全局快捷键 — 阶段 7 新增：
- `createOverlay({ paths, boundingBox, lineColor, opacity })` — 创建透明置顶无框叠加窗口
  - 初始尺寸 = boundingBox.size，主屏幕居中
  - 加载 `dist/renderer/overlay/index.html`（dev 模式走 Vite dev server）
  - 500ms 定时器强制 `setAlwaysOnTop(true, 'screen-saver')`
  - 默认进入交互模式（可直接拖拽/缩放）
- `destroyOverlay()` — 销毁窗口 + 清理定时器 + 注销全局快捷键
- `getOverlayWindow()` — 获取叠加窗口引用
- 全局快捷键：`Ctrl+Shift+F9` 切换交互/穿透模式（`registerOverlayShortcut`/`unregisterOverlayShortcut`）
- 交互模式：`setIgnoreMouseEvents(false)` + 发送 `overlay-set-interactive: true` → 渲染侧显示手柄
- 穿透模式：`setIgnoreMouseEvents(true)` + 发送 `overlay-set-interactive: false` → 隐藏手柄
- **⚠ 阶段 10 提醒**：`Ctrl+Shift+F9` 需在快捷键管理器中实现为可配置项

### src/main/drawing-engine.ts
绘制引擎核心 — 阶段 8 新增：
- `createDrawingEngine({ stateMachine, configStore, getMainWindow, destroyOverlay })` 工厂函数，返回 `{ start, stop, isActive }`
- **`start(paths, boundingBox, overlayRect)`** — 启动绘制：
  1. 验证状态为 PREVIEWING → 否则抛异常
  2. 验证 `overlayRect` 尺寸 > 0
  3. 从 `configStore` 读取 `drawSpeed`（经 `clampSpeed` 钳制 100~2000）和 `mouseButton`（`toButton` 映射 left→LEFT, right→RIGHT）
  4. 计算缩放因子 `scale = max(overlayRect.width/boundingBox.width, overlayRect.height/boundingBox.height)`
  5. 状态机转 DRAWING → 推送 IPC `APP_STATE`
  6. 调用 `destroyOverlay()` 关闭叠加窗口
  7. 异步绘制循环：逐路径 → 跳到起点落笔 → 逐点 `mouse.setPosition()` + `await delay(1000/speed)` → 抬笔
  8. 每步检查 `stopFlag`，路径间推送 `DRAW_STATUS` IPC
  9. 全部完成 → 转 IDLE + Toast "绘制完成"
  10. 异常 → 强制抬笔 → 转 ERROR
- **`stop()`** — 设置 `stopFlag = true`，绘制循环在下一个步进点检测到后抬笔 + 转 IDLE
- **`isActive()`** — 返回当前是否正在绘制中
- 导出纯函数供测试：`clampSpeed`（速度钳制）、`toScreen`（坐标转换）、`toButton`（按键映射）
- 坐标转换公式严格按设计文档 §9.2：`screenXY = overlayRect.origin + (point - boundingBox.min) × scale`
- `stopFlag` 机制确保 `stop()` 调用后尽速响应，不等待当前路径完成
- **注意**：引擎不直接访问叠加窗口。`overlayRect` 由调用方在调用 `start()` 前通过 `getOverlayWindow()?.getBounds()` 捕获

### src/main/tray-manager.ts
系统托盘管理器 — 阶段 9 新增：
- `createTrayManager(deps)` 工厂函数，返回 `{ destroy }`
- 应用启动时创建 `Tray` 实例，初始图标为 NOT_READY 状态
- **右键菜单**（`Menu.buildFromTemplate`）：
  - "打开主窗口" → `mainWindow.show()` + `mainWindow.focus()`
  - 状态指示项（`状态: 未就绪`/`空闲`/`预览中`/`绘制中`/`错误`，disabled 只读，随状态机实时更新）
  - "导出线稿 PNG"（仅 IDLE 状态 + `lineArtBuffer` 非空时 enabled）→ 调用 `deps.exportLineArt()`
  - "退出" → 调用 `deps.requestQuit()` 安全退出（DRAWING 状态先抬笔）
- **左键单击**：同"打开主窗口"（Windows/Linux 直接触发）
- 监听 `stateMachine.onStateChange` → `updateTray()`：更新托盘图标、tooltip（`AKD - 状态名`）、重建右键菜单
- `destroy()` 方法调用 `tray.destroy()` 清理
- 依赖通过 `TrayManagerDeps` 接口注入：`getMainWindow`/`getContext`/`stateMachine`/`iconDir`/`exportLineArt`/`requestQuit`
- 图标通过 `nativeImage.createFromPath()` 加载，resize 至 16×16
- 5 状态图标映射：`ICON_MAP` + `STATE_LABELS` 两个 Record
- 菜单随状态动态重建（`buildMenu()`），`hasLineArt = state === IDLE && ctx.lineArtBuffer !== null`

### src/main/adapters/nut-js-adapter.ts
CJS → ESM Adapter — 阶段 8 新增：
- **Main Process 中唯一使用 `createRequire` 的文件**（与 Worker 中的 `createRequire` 用途不同）
- 从 `@nut-tree-fork/nut-js`（CJS）require 出 `mouse`、`Button`
- 重新导出为 ESM 命名导出，带类型标注（`mouse` 标注 `setPosition`/`pressButton`/`releaseButton` 方法签名，`Button` 标注 LEFT/MIDDLE/RIGHT 枚举）
- 其他文件通过 `import { mouse, Button } from '../adapters/nut-js-adapter.js'` 正常 ESM 导入
- 文件顶部 JSDoc 明确标注"此文件为 AKD 项目中唯一使用 createRequire 的位置"
- 遵循设计文档 §3.4.6 的 CJS 隔离策略

### src/renderer/overlay/index.html
叠加层独立 HTML 页面 — 阶段 7 新增：
- 最小页面结构：`<canvas>` + 缩放标签 `<div>`
- Vite 多页面构建的第二个入口（与主窗口 `index.html` 并列）

### src/renderer/overlay/main.ts
叠加层 Canvas 渲染与交互逻辑 — 阶段 7 新增：
- Canvas 2D 路径渲染：devicePixelRatio 适配、坐标映射、线宽 2px、虚线边框 `[4,4]`
- 交互模式切换：`onSetInteractive` IPC → 显示/隐藏四角缩放手柄（8×8px 蓝色方块）
- 拖拽移动：绝对坐标计算（`winStart + delta`），避免累积漂移
- 四角等比缩放：锁定宽高比，0.5x~3.0x，nw/sw 角自动调整 X、nw/ne 角自动调整 Y
- 浮动缩放标签："1.5x 960×540"（半透明黑底白字）
- 缩放变更通过 `sendScaleChanged` IPC 实时同步到主窗口状态栏

### src/preload/overlay.ts
叠加层 contextBridge preload — 阶段 7 新增：
- 暴露 `window.overlayAPI`：`onInit`、`onSetInteractive`、`setBounds`、`sendScaleChanged`
- 必须编译为 CJS（`.cjs`），与主窗口 preload 相同的构建策略
- 由 `scripts/build-main.mjs` 第三个 esbuild 构建产出

### src/shared/geometry-utils.ts
几何工具函数 — 阶段 6 新增：
- `computeBoundingBox(paths: DrawPath[]): BoundingBox` — 计算所有路径点的全局最小外接矩形
- 空数组 → 返回零值包围盒 `{ minX:0, minY:0, width:0, height:0 }`
- 由 `pipeline-orchestrator.ts` 在路径提取完成后调用，结果存入 `AppContext.boundingBox`

### src/main/worker-manager.ts
Worker 生命周期管理器 — 阶段 5~6：
- `runInference(modelPath, imageBuffer): Promise<Buffer>` — 推理 Worker 封装（30s 超时）
- `runPathExtraction(lineArtBuffer): Promise<{ paths: DrawPath[] }>` — 路径提取 Worker 封装（60s 超时）— 阶段 6 新增
- 两方法均遵循：创建 Worker（`new URL('../../workers/.../worker.js', import.meta.url)`）→ `postMessage`（Buffer 通过 Transferable 零拷贝传递）→ 等待结果 → `terminate`
- 超时自动 `worker.terminate()` + reject，error / messageerror 事件兜底

### src/main/pipeline-orchestrator.ts
管线编排器 — 阶段 5~6：
- `createPipelineOrchestrator({ modelPath, getContext, getMainWindow, stateMachine })` 工厂函数
- `run(imageBuffer)` 编排完整二阶段管线：
  1. **推理阶段**：推送 `pipeline-progress(inference, 0)` → `runInference()` → 存储 `lineArtBuffer`/`lineArtBase64` → 推送 `pipeline-progress(inference, 100)`
  2. **路径提取阶段**（阶段 6 新增）：推送 `pipeline-progress(extraction, 50)` → `runPathExtraction()` → `computeBoundingBox()` → 存储 `paths`/`boundingBox` → 推送 `pipeline-progress(extraction, 100)`
  3. 推送 `pipeline-complete`（含实际 `pathCount` + `boundingBox`）
  4. 状态机转 `IDLE` → 推送 `APP_STATE` + 成功 Toast（显示路径数量）
- 推理或路径提取失败 → 状态机转 `ERROR` → 推送 `APP_ERROR`（路径提取错误含针对性建议）
- 在 `IMPORT_IMAGE` 成功后通过 `IpcHandlerDeps.runPipeline` 回调自动触发

### 叠加层交互模式（阶段 7 最终方案）

叠加层有三种交互控制方式，按优先级排列：

| 方式 | 触发 | 说明 |
|------|------|------|
| 默认进入 | `createOverlay` → `did-finish-load` → `setOverlayInteractive(true)` | 进入预览即交互模式，可直接拖拽/缩放 |
| 全局快捷键 | `Ctrl+Shift+F9` | 切换交互/穿透模式，任何窗口都能触发 |
| 退出预览 | `destroyOverlay` | 自动注销快捷键，清理定时器 |

**为什么需要全局快捷键？** Electron 中键盘事件只能送达焦点窗口。叠加窗口通过 `setIgnoreMouseEvents(true)` 让鼠标穿透到下层软件，但也使得点击无法让叠加窗口重新获得焦点 → 键盘事件不再送达 → Ctrl 检测失效。全局快捷键通过 `globalShortcut.register` 在 Main Process 侧注册，不依赖任何窗口的焦点状态。

**为什么每 500ms 重新置顶？** 部分绘图软件会覆盖 `alwaysOnTop` 的层级，需要在 Main Process 侧定时器重新 assert `setAlwaysOnTop(true, 'screen-saver')`。

### 路径提取：Zhang-Suen 骨架化替代 findContours（阶段 7）

阶段 6 使用 `findContours(RETR_LIST, CHAIN_APPROX_NONE)` 从二值图中提取轮廓。它的本质是追踪白色区域的**外边界**——对于宽度 > 1px 的线条，轮廓围绕线条外围走一圈，导致一条粗线产生两条轮廓路径（双线问题）。

阶段 7 替换为：
1. OpenCV 预处理（GaussianBlur → Otsu 阈值 → Morph Close）
2. 纯 TypeScript Zhang-Suen 迭代细化（将白色区域缩减到 1px 中心线）
3. 骨架追踪（从端点沿骨架走，交叉点分叉）

**为什么用纯 TypeScript 而非 OpenCV？** OpenCV 的骨架化功能在 `ximgproc` 模块中，`@dalongrong/opencv-wasm` 精简构建不含此模块。Zhang-Suen 是经典算法，实现简洁，性能可接受（每轮迭代 O(W×H)）。

**分辨率注意事项**：路径提取在原始图片分辨率下进行。大图的 Zhang-Suen 迭代次数多，路径点数密集。叠加层 Canvas 渲染时坐标经过包围盒比例映射，视觉上缩放即可。

## 已知问题

- **Node.js v24 + `.mjs` 类型注解**：Node.js v24 对 `.mjs` 文件不做 TypeScript 类型剥离。解决：使用 `.ts` + `tsx` 运行，纯 JS 的 `.mjs` 用 `node` 运行。
- **`Ctrl+Shift+F9` 当前硬编码**：切换叠加层穿透模式的快捷键在 `preview-overlay.ts` 中写死。阶段 10 需改为从 configStore 读取，并纳入快捷键管理器统一管理。仅在预览状态注册。
- **路径提取在大图上性能**：Zhang-Suen 骨架化在原始图片分辨率下运行。未来可考虑在路径提取前加入缩放（如 max 1024px）。
- **`session.defaultSession` 是静态成员**：不能通过 `win.webContents.session.defaultSession` 访问，必须 `import { session } from 'electron'; session.defaultSession`。
- **Preload 必须 `.cjs` 扩展名**：`"type": "module"` 导致 Electron 将 `.js` 以 ESM 解析，preload 中 `require('electron')` 失败。解决：`build-main.mjs` 将 preload 单独构建为 CJS + `.cjs`。
- **Worker 非打包模式**：esbuild `bundle: true` 将 CJS 依赖包裹在 `__require()` 中，与 ESM Worker 不兼容。解决：`build-workers.mjs` 改为 `bundle: false`。
- **Emscripten WASM 在 worker_threads 中不兼容**：`@techstark/opencv-js` 在 Worker 中 `onRuntimeInitialized` 永不触发。解决：替换为 `@dalongrong/opencv-wasm`。
- **Electron 沙箱须关闭**：`sandbox: true` 导致 `File.path` 为 `undefined`。解决：`sandbox: false`。
- **`session.defaultSession` 是静态成员**：不能通过 `win.webContents.session.defaultSession`（实例）访问，必须通过 `import { session } from 'electron'; session.defaultSession` 静态访问。
- **Electron sandbox 下 `File.path` 不可用**：渲染进程沙箱（`sandbox: true`，Electron 20+ 默认开启）中 `<input type="file">` 选择的文件无 `path` 属性。阶段 4 通过 `FileReader.readAsDataURL()` 在渲染进程直接读取文件内容绕过此限制。
- **CSP 阻止 data: URL 图片**：`default-src 'self'` 不包含 `data:` 协议，通过 IPC 传递的 base64 data URL 被浏览器阻止渲染。解决：显式添加 `img-src 'self' data:`。
- **Preload 必须 `.cjs` 扩展名**：`package.json` 的 `"type": "module"` 导致 Electron 将 `.js` 文件以 ESM 解析，preload 中 `require('electron')` 抛出 `SyntaxError: Cannot use import statement outside a module`。解决：`build-main.mjs` 将 preload 单独构建为 CJS 格式 + `.cjs` 扩展名，绕过 type 声明。
- **Worker 非打包模式**：esbuild `bundle: true` 将 CJS 依赖包裹在 `__require()` 中，`require` 在 ESM Worker 中不可用。解决：`build-workers.mjs` 改为 `bundle: false`，保留原生 `import` 语句由 Node.js 解析。
- **Emscripten WASM 在 worker_threads 中不兼容**：`@techstark/opencv-js`（Emscripten 构建，CDN 加载 WASM）在 `worker_threads` 中 `onRuntimeInitialized` 永不触发，导步 `await import()` + `onRuntimeInitialized` 回调模式均永久挂起。解决：替换为 `@dalongrong/opencv-wasm`（本地 `.wasm` 文件 + 同步 `require()` 加载），并在 Worker 内使用 `createRequire(import.meta.url)` 桥接 CJS 包。
- **Electron 沙箱须关闭**：默认 `sandbox: true` 导致 `<input type="file">` 的 `File.path` 始终为 `undefined`。解决：`webPreferences` 设置 `sandbox: false`。

## 模块系统约束

```
100% ESM（零 CommonJS）

强制规则:
├── Node 内置模块 → import ... from 'node:xxx'
├── 相对导入 (Main/Worker/Shared) → 必须带 .js 后缀
├── 相对导入 (Renderer) → 可省略后缀 (Vite bundler 自动解析)
├── __dirname/__filename → import.meta.url + fileURLToPath
├── Worker 创建 → new Worker(new URL('...', import.meta.url))
├── CJS 依赖 (Main Process) → src/main/adapters/ 下 createRequire 桥接 (如 nut-js)
├── CJS 依赖 (Worker) → Worker 文件内直接 createRequire(import.meta.url) (如 opencv-wasm)
├── Preload 构建 → 必须 .cjs 扩展名（CJS 格式），不可用 ESM
└── Worker 构建 → bundle: false，保留 import 语句由 Node.js 原生 CJS→ESM 互操作
```

## 关键架构洞察

### 图片导入双路径

AKD 支持两种图片导入方式，分别对应不同的数据流：

| 路径 | 触发方式 | 数据流 | 使用场景 |
|------|---------|--------|---------|
| 文件路径导入 | 拖拽（有 `file.path`）或未来对话框 | IPC `importImage(filePath)` → `handleImportImage` 读磁盘 → Buffer → 管线 | Electron 非沙箱、拖拽 |
| Base64 导入 | 点击选文件、拖拽（无 path） | FileReader → data URL → IPC `importImage(dataUrl)` → `handleImportImageFromBase64` 解码 → Buffer → 管线 | Electron 沙箱、文件选择器 |

两种路径在 `ipc-handlers.ts` 的 `IMPORT_IMAGE` handler 中自动路由：`input.startsWith('data:')` 判断前缀。

### IPC 监听器三层同步规则

新增一个从 Main→Renderer 的 IPC 事件需要修改**恰好 3 个文件**：

| 层 | 文件 | 操作 |
|----|------|------|
| 桥接层 | `src/preload/index.ts` | `contextBridge.exposeInMainWorld` 新增方法，调用 `ipcRenderer.on(CHANNEL, callback)` |
| 类型层 | `src/renderer/env.d.ts` | `ElectronAPI` 接口新增方法签名 |
| 消费层 | Vue 组件 | `onMounted` 中调用 `window.electronAPI.onXxx(callback)` |

如果消费层在 `ImagePanel.vue` 等 `<KeepAlive>` 缓存的组件中，监听器在 `onMounted` 注册一次即可，无需在 `onUnmounted` 清理（`KeepAlive` 不会销毁组件）。

### 构建系统分离

| 构件 | 格式 | 扩展名 | 原因 |
|------|------|--------|------|
| Main Process | ESM | `.js` | Node.js 以 ESM 加载主进程入口 |
| Preload | CJS | `.cjs` | 绕过 `"type": "module"`，Electron preload 需要 CJS |
| Workers | ESM | `.js` | `worker_threads` 加载，Node.js 原生 CJS→ESM 互操作 |
| Renderer | ESM | `.js` | Vite 打包，浏览器 ESM |

### ESM Worker 中加载 CJS 包（OpenCV 桥接模式）

路径提取 Worker 需要 OpenCV，但 Node.js 兼容的 OpenCV 包（`@dalongrong/opencv-wasm`）仅提供 CJS 入口。Worker 本身是 ESM 文件，无法直接 `import` CJS 包。

**解决模式**——在 Worker 内部使用 `createRequire` 创建隔离的 CJS 加载器：

```typescript
import { createRequire } from 'node:module'

// 基于当前 Worker 文件的 URL 创建 require 函数
// 使得 CJS 包中的 __dirname 和相对路径正确解析
const require = createRequire(import.meta.url)

// 同步加载 CJS 包（~75ms），直接获取 cv 对象
const { cv } = require('@dalongrong/opencv-wasm')
```

**关键要点**：
- `createRequire(import.meta.url)` 创建的 `require` 函数具有完整 CJS 环境（`__dirname`、`require.resolve` 等），CJS 包内部的文件系统访问正常运作
- 此模式适用于所有仅提供 CJS 入口的依赖，比 `import()` 异步加载更可靠（后者在 CJS 包的 WASM 初始化存在竞态）
- 与 Main Process 的 `src/main/adapters/` 桥接层不同，Worker 中直接在文件内使用 `createRequire`，无需单独 Adapter 文件
- esbuild 配置 `bundle: false` + `format: 'esm'` 保留原生 `import` 语句，`createRequire` 在运行时由 Node.js 解析，构建无需额外处理

### OpenCV 包选择：`@techstark/opencv-js` vs `@dalongrong/opencv-wasm`

| 维度 | `@techstark/opencv-js` | `@dalongrong/opencv-wasm` |
|------|------------------------|---------------------------|
| OpenCV 版本 | 4.12.0 | 4.8.1 |
| WASM 来源 | CDN 动态加载 | 本地 `.wasm` 文件 |
| 加载方式 | 异步 `import()` + 等待 `onRuntimeInitialized` | 同步 `require()`，立即可用 |
| `worker_threads` 兼容 | ❌ `onRuntimeInitialized` 永不触发 | ✅ 同步加载，稳定运行 |
| 模块包含 | 全功能（含 `imgcodecs`） | 精简（无 `imgcodecs`，需 `sharp` 辅助解码） |
| 加载耗时 | N/A（不可用） | ~75ms |
| 选择 | 初始选择，因 Worker 不兼容放弃 | 最终方案 |

**教训**：Emscripten 编译的 WASM 包在 `worker_threads` 环境下的兼容性与构建配置强相关。优先选择明确标注支持 Node.js 且附带本地 WASM 文件的包。

## ⚠ 阶段 10 待办：`Ctrl+Shift+F9` 可配置化

当前 `Ctrl+Shift+F9` 在 `preview-overlay.ts` 中硬编码为 `TOGGLE_SHORTCUT` 常量。阶段 10（快捷键管理器）需要：
- 在 `config-store.ts` 的 schema 中新增 `hotkeys.toggleOverlay` 配置项（默认 `'Ctrl+Shift+F9'`）
- 快捷键管理器监听 `state-change` → PREVIEWING 状态注册该键 → 退出 PREVIEWING 注销
- `createOverlay` 改为接收快捷键参数（或从 configStore 读取）而非硬编码常量
- `globalShortcut.register` 改为通过快捷键管理器统一管理

## 依赖注入架构

已实现。`createAppContext()` 工厂函数在 `src/main/index.ts` 的 `app.whenReady()` 中调用，组装核心依赖：
- `stateMachine` — 全局状态机单例（`StateMachine` 实例）
- `configStore` — 配置存储单例（`ConfigStore` 实例，cwd 指向 `dirname(process.execPath)`）
- `mainWindow` — 主 BrowserWindow 引用（初始为 null，窗口创建后赋值）

各模块通过 `IpcHandlerDeps` 等接口接收依赖，禁止模块间直接 import 全局单例。`registerIpcHandlers()` 接收 `{ getState, getMainWindow, getContext, runPipeline, enterPreview, exitPreview, drawingEngine }` 七个 getter/回调。

## 绘制引擎架构洞察（阶段 8）

### 坐标转换链路

绘制引擎的坐标转换经过以下链路：

```
原图坐标系 (path point)
  → toScreen(): (point - boundingBox.min) × scale + overlayRect.origin
  → 屏幕绝对坐标 (mouse.setPosition)
```

- `scale = max(overlayRect.width / boundingBox.width, overlayRect.height / boundingBox.height)` — 等比缩放取较大维度
- `overlayRect` 在 `start()` 调用前由调用方通过 `getOverlayWindow()?.getBounds()` 捕获，包含 `{ x, y, width, height }`
- 引擎不直接引用叠加窗口（避免在销毁窗口后访问已失效的引用）

### 异步绘制循环与 stopFlag

绘制循环采用 `async/await` + `setTimeout` 异步模式：

```
for each path:
  起点落笔 → for each point: setPosition → await delay(stepDelay) → if stopFlag: break → 抬笔
```

- `stepDelay = 1000 / drawSpeed` 毫秒 — 速度越快、延迟越短
- 每步检查 `stopFlag`，确保 `stop()` 调用后尽速响应（通常在下一次步进即生效）
- `stop()` 被调用后，在当前路径的剩余点被跳过（抬笔），然后状态机转 IDLE

### CJS Adapter 隔离模式（Main Process 侧）

Main Process 中 `createRequire` 仅限于 `src/main/adapters/nut-js-adapter.ts`：

| 文件 | createRequire | 用途 |
|------|--------------|------|
| `src/main/adapters/nut-js-adapter.ts` | ✅ 唯一使用 | 桥接 `@nut-tree-fork/nut-js`（CJS） |
| 其他 `src/main/**/*.ts` | ❌ 禁止 | 通过 ESM import 从 adapter 导入 |

与 Worker 中的 OpenCV 桥接不同（Worker 在文件内直接使用 `createRequire`），Main Process 遵循更严格的隔离策略——Adapter 文件单独存在，业务代码零 CJS 互操作。

## 系统托盘架构洞察（阶段 9）

### 托盘生命周期

```
app.whenReady()
  → createTrayManager(deps)    // 创建 Tray，初始 NOT_READY 图标
  → tray.setContextMenu(...)   // 初始右键菜单
  → stateMachine.onStateChange // 监听状态变更 → updateTray()
  → tray.on('click')           // 左键单击 → 打开主窗口

app.on('quit') → trayManager.destroy()
```

### 菜单动态更新

托盘菜单不是静态的——`state-change` 事件触发时调用 `updateTray()` 重建整个菜单：

- **状态文字**：`状态: ${STATE_LABELS[state]}` — 5 种中文状态名
- **导出 enabled 态**：`state === IDLE && lineArtBuffer !== null` — 两个条件都满足才可选
- **menu rebuild**：`Menu.buildFromTemplate()` 每次重建，不存在原地修改已有 MenuItem 的 API

### 导出线稿统一入口

`exportLineArt()` 函数在 `src/main/index.ts` 中定义，同时供两处使用：

| 触发路径 | 调用链 |
|---------|--------|
| IPC handler (`export-lineart`) | `ipcMain.handle` → `deps.exportLineArt()` |
| 托盘菜单 ("导出线稿 PNG") | `MenuItem.click` → `deps.exportLineArt()` |

原 IPC handler 中的 40 行导出逻辑被替换为 1 行委托调用，消除了代码重复。

### 安全退出流程

```
托盘"退出" → deps.requestQuit()
  → if state === DRAWING: drawingEngine.stop() // 先抬笔
  → app.quit()
```

`app.on('window-all-closed')` 不退出（保留系统托盘），仅通过"退出"菜单项主动退出。

### 图标路径解析（两种模式）

| 模式 | 路径 |
|------|------|
| dev | `__dirname/../../../resources/icons/tray/`（从 dist/main/main 回退到项目根） |
| prod | `process.resourcesPath/icons/tray/`（electron-builder extraResources） |

`package.json` 的 `extraResources` 新增 `{ "from": "resources/icons", "to": "icons" }`，确保打包后图标文件位于 asar 外可直接路径访问。
