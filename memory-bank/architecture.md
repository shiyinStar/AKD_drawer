# AKD 项目架构

**最后更新**: 2026-05-13 (阶段 14 完成)

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
│   │   ├── tray-manager.ts         # 系统托盘管理器（阶段 9 新增）
│   │   ├── shortcut-manager.ts     # 快捷键管理器（阶段 10 新增）
│   │   ├── error-handler.ts         # 集中化错误处理（阶段 11 新增）
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
│   │   │   ├── ErrorOverlay.vue       # ERROR 覆盖层（阶段 11 新增）
│   │   │   ├── SettingsPanel.vue      # 设置面板（阶段 12 重写）
│   │   │   ├── SliderControl.vue      # 通用范围滑块（阶段 12 新增）
│   │   │   ├── HotkeySettings.vue     # 快捷键设置分组（阶段 12 新增）
│   │   │   ├── HotkeyRow.vue          # 单行快捷键（阶段 12 新增）
│   │   │   ├── HotkeyCapture.vue      # 按键捕获弹窗（阶段 12 新增）
│   │   │   └── FirstRunTips.vue       # 首次启动提示（阶段 12 新增）
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
    │       └── shortcut-manager.test.ts   # 快捷键管理器 13 个单元测试（阶段 10 新增）
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
设置面板（阶段 12 重写）— 3 张圆角卡片：
- **卡片 1 — 快捷键**：嵌入 `HotkeySettings`（4 行配置）
- **卡片 2 — 绘制参数**：速度滑块 100~2000 px/s + 鼠标左右键 RadioGroup + 透明度滑块 0.3~0.8 + 线条颜色 `<input type="color">`
- **卡片 3 — 关于**：版本号 + 技术栈 + 引擎说明
- `onMounted` 通过 `getSettings()` IPC 读取配置并填充本地 `settings` ref
- 所有修改通过 `updateSettings()` IPC 即时持久化到 `configStore`，`configStore.onDidChange` 自动触发快捷键重注册和叠加层实时更新

### src/renderer/components/SliderControl.vue
通用范围滑块组件（阶段 12 新增）：
- Props：`label`、`modelValue`、`min`、`max`、`step`、`unit`
- CSS `--fill-pct` 自定义属性驱动渐变填充（已走比例 → 主色，未走 → `--color-surface-400`）
- 设置面板中复用 3 次

### src/renderer/components/HotkeyRow.vue
单行快捷键设置（阶段 12 新增）：
- 键帽渲染：`keyValue.split('+')` 拆分组合键 → 逐个 `<span class="keycap">`（`--color-surface-300` 背景 + `box-shadow: 0 2px 0 --color-surface-400` 立体感）
- [修改] 按钮 → 打开 `HotkeyCapture`、[恢复默认] 按钮 → emit 默认键值

### src/renderer/components/HotkeyCapture.vue
按键捕获弹窗（阶段 12 新增）：
- `window.addEventListener('keydown', onKeyDown, true)` capture 阶段拦截
- 构建组合键字符串：Ctrl/Shift/Alt/Meta + 非修饰键大写化
- 排除纯修饰键，Esc 取消，Enter 确认

### src/renderer/components/HotkeySettings.vue
快捷键设置分组容器（阶段 12 新增）：
- 4 行 `HotkeyRow`：预览（F5）/ 开始绘制（F6）/ 停止绘制（F7）/ 预览穿透（Ctrl+Shift+F9）
- 接收当前 `hotkeys` 对象 prop，emit `update(key, value)` 向上冒泡

### src/renderer/components/FirstRunTips.vue
首次启动快捷键速查（阶段 12 新增）：
- 全屏毛玻璃遮罩（`z-index: 10001`）+ 居中卡片，显示 4 个快捷键键帽 + 功能描述
- `onMounted` 通过 `getSettings()` 读取实际配置的快捷键值
- "知道了"按钮 → emit `dismiss` → App.vue 调用 `updateSettings({ hasSeenShortcutTips: true })` 持久化
- 标志位 `hasSeenShortcutTips: boolean` 存储于 `configStore`（schema 默认 `false`）

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
叠加窗口管理 — 阶段 7 新增 / 阶段 10 重构：
- `createOverlay({ paths, boundingBox, lineColor, opacity })` — 创建透明置顶无框叠加窗口
  - 初始尺寸 = boundingBox.size，主屏幕居中
  - 加载 `dist/renderer/overlay/index.html`（dev 模式走 Vite dev server）
  - 500ms 定时器强制 `setAlwaysOnTop(true, 'screen-saver')`
  - 默认进入交互模式（可直接拖拽/缩放）
- `destroyOverlay()` — 销毁窗口 + 清理定时器
- `getOverlayWindow()` — 获取叠加窗口引用
- `toggleOverlayInteractive()` — 切换交互/穿透模式（阶段 10 新增，由快捷键管理器调用；原 `registerOverlayShortcut`/`unregisterOverlayShortcut` 已移除）
- 全局快捷键 `Ctrl+Shift+F9` 已从本文件移除，统一由 `shortcut-manager.ts` 管理

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

### src/main/shortcut-manager.ts
快捷键管理器 — 阶段 10 新增：
- `createShortcutManager(deps)` 工厂函数，接收 `stateMachine`/`configStore`/`getMainWindow`/`globalShortcut` + 5 个动作回调（`onPreviewToggle`/`onStartDraw`/`onStopDraw`/`onToggleOverlay`）
- **状态-热键映射**：
  - NOT_READY / ERROR：无热键
  - IDLE：`preview`（进入预览）
  - PREVIEWING：`preview`（退出预览）+ `startDraw` + `toggleOverlay`
  - DRAWING：`stopDraw`
- **状态变更监听**：`stateMachine.onStateChange` → `setImmediate(() => refresh())` 延迟重新注册（防止同一物理按键事件中同步重注册导致重复触发）
- **配置变更监听**：`configStore.onDidChange('hotkeys')` → 自动 `refresh()`
- **回调安全包装**：`safeCallback(expectedState, cb)` → 执行前二次验证 `stateMachine.getState() === expectedState`（防竞态）
- **注册失败处理**：捕获异常 → Toast 通知"热键 [键名] 已被占用"，不阻塞状态流转
- **DI 设计**：`globalShortcut` 通过 `ShortcutManagerDeps.globalShortcut` 注入（`Pick<Electron.GlobalShortcut, 'register' | 'unregisterAll'>`），测试时传入 mock
- 导出纯函数 `getHotkeysForState(state, config)` 供测试：返回指定状态下应注册的热键列表
- 返回 `{ refresh, destroy }` — `destroy()` 调用 `globalShortcut.unregisterAll()`
- 5 个动作回调由 `src/main/index.ts` 提供：`previewToggle`（IDLE→enterPreview / PREVIEWING→exitPreview）、`startDraw`（从 context + overlay bounds → drawingEngine.start）、`stopDraw`（drawingEngine.stop）、`toggleOverlay`（preview-overlay.toggleOverlayInteractive）

### src/main/error-handler.ts
集中化 ERROR 状态进入逻辑 — 阶段 11 新增：
- `createErrorHandler({ stateMachine, getMainWindow })` 工厂函数，返回 `{ enterError }`
- **`enterError(errorInfo)`** — 统一的 ERROR 状态入口：
  1. 防重入检查（已在 ERROR 则跳过）
  2. `stateMachine.transition(ERROR)` — 触发所有状态变更监听器（shortcut-manager 注销热键、叠加窗口销毁）
  3. 推送 3 条 IPC：`APP_ERROR`（错误详情）、`APP_STATE`（ERROR）、`SHOW_TOAST`（错误原因）
- 被 `pipeline-orchestrator.ts` 和 `drawing-engine.ts` 在 catch 块中调用，替代原有的内联 `transition + IPC send` 重复代码
- **设计原则**：仅负责状态迁移和 IPC 推送，不直接操作窗口/按键/Worker。窗口销毁由 `index.ts` 的 `state-change` 监听器处理；Worker 在各自 Promise 内自行 terminate

### src/renderer/components/ErrorOverlay.vue
ERROR 覆盖层 UI — 阶段 11 新增：
- 绝对定位覆盖图片面板内容区，`--color-surface-100` 背景
- **布局**：垂直居中，`CircleX` 图标 56px（`--color-error`）→ 错误描述 14px → 建议操作 12px → [重试] 主按钮 → [打开日志目录] 链接
- **[重试] 按钮**：主按钮规格（32px、主色填充、`CircleDashed` 图标），支持 click / Enter / Space 激活
- **[打开日志目录]**：12px 次要链接，hover 变 `--color-primary-500`
- **入场动画**：300ms `cubic-bezier(0.16,1,0.3,1)`，覆盖层 fade-in + 内容 scale 0.95→1
- 通过 `emit('retry')` 和 `emit('openLog', logPath)` 向父组件通知用户操作

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
- **快捷键 `setImmediate` 延迟**：状态变更触发的热键重注册使用 `setImmediate` 延迟。直接同步重注册会导致同一物理按键事件触发新旧两个回调（例：PREVIEWING 下按 F5 → exitPreview → 同步 register(F5, IDLE 回调) → 立即触发 enterPreview）。`setImmediate` 确保当前事件完全结束再重注册。
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

## 快捷键管理器架构洞察（阶段 10）

### 状态-热键映射与生命周期

快捷键管理器的核心设计原则：**监听状态机变更 → 全量注销 → 按当前状态重新注册**。

| 状态 | 注册热键 | 动作 |
|------|---------|------|
| NOT_READY | 无 | — |
| IDLE | preview（默认 F5） | 进入预览 |
| PREVIEWING | preview + startDraw（F6）+ toggleOverlay（Ctrl+Shift+F9） | 退出预览 / 开始绘制 / 切换穿透 |
| DRAWING | stopDraw（F7） | 停止绘制并抬笔 |
| ERROR | 无 | — |

`configStore.onDidChange('hotkeys')` 触发时同样全量重注册。用户修改快捷键设置（阶段 12）后即时生效。

### `setImmediate` 延迟重注册

状态变更回调中 `refresh()` 通过 `setImmediate` 延迟执行。原因：预览切换（F5）在 `previewToggle` 中同步触发 `exitPreview` → `transition(IDLE)` → 快捷键管理器 `state-change` 监听器同步调用 `refresh()` → `unregisterAll` + `register(F5, IDLE 回调)`。若 F5 键仍物理按下，Electron `globalShortcut.register` 会立即触发新注册的 IDLE 回调 → `enterPreview` 再次打开叠加窗口，形成"关不掉预览"的 bug。

`setImmediate` 确保当前按键事件完全处理完毕后（回调返回、事件循环进入下一 tick）才执行重注册。

### `safeCallback` 双重状态校验

所有动作回调通过 `safeCallback(expectedState, cb)` 包装。执行前调用 `stateMachine.getState() === expectedState` 二次验证。即使重注册瞬间状态已变更，旧回调也不会误触发。

### `globalShortcut` DI 注入

`globalShortcut` 通过 `ShortcutManagerDeps` 注入（类型 `Pick<Electron.GlobalShortcut, 'register' | 'unregisterAll'>`），而非模块顶层 import。测试时传入 mock 对象即可覆盖全部场景（注册成功/失败/异常），无需 Electron 运行环境。

### configStore.hotkeys 新增字段

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `hotkeys.preview` | `'F5'` | 进入/退出预览 |
| `hotkeys.startDraw` | `'F6'` | 开始绘制 |
| `hotkeys.stopDraw` | `'F7'` | 停止绘制 |
| `hotkeys.toggleOverlay` | `'CommandOrControl+Shift+F9'` | 切换叠加层穿透模式 |

`toggleOverlay` 从 `preview-overlay.ts` 硬编码常量改为可配置项，与其他热键同等对待。

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

绘制循环采用 `async/await` + 精度感知延迟模式：

```
for each path:
  起点落笔 → 记录 prevPt
  for each point (j ≥ 1):
    setPosition(pt)
    distance = sqrt((pt.x - prevPt.x)² + (pt.y - prevPt.y)²)
    await delay((distance / speed) × 1000)
    if stopFlag: break
    prevPt = pt
  抬笔
```

- 每步延迟基于**相邻点的实际屏幕像素距离**动态计算：`pointDelay = (distance / speed) × 1000` ms，确保 `speed` 语义精确为"屏幕像素/秒"
- 相邻点距离 ≈ `scale × 骨架像素间距`。当 scale > 1 时自动增加延迟、scale < 1 时减少延迟，绘制速度与叠加窗口缩放大小解耦
- 每步检查 `stopFlag`，确保 `stop()` 调用后尽速响应（通常在下一次步进即生效）

### 精度感知 `delay()` 函数

原 `delay(ms)` 使用朴素 `setTimeout`，在 Node.js 中最小有效延迟约 1ms，导致 speed > 1000 时 `stepDelay < 1ms` 被钳位，高速段完全失效。当前实现分两档：

| 延迟范围 | 策略 | 精度 |
|----------|------|------|
| ≥ 1.5ms | `setTimeout(ms - 1)` 粗等待 → `performance.now()` 自旋补足剩余 | ~0.1ms |
| < 1.5ms | 纯 `performance.now()` 自旋等待 | ~0.01ms |

**设计理由**：
- `setTimeout` 保持事件循环响应性（不长时间阻塞），自旋仅用于最后 ~1ms 补足精度
- 亚毫秒延迟总时长极短（单次 ≤ 1.5ms），纯自旋对事件循环影响可忽略
- 对 speed=2000（`pointDelay ≈ 0.5ms/px`）和 speed=100（`pointDelay = 10ms/px`）均能精确生效

### nut-js 开销自校准与冗余跳过

`mouse.setPosition()` 每次调用有 nut-js 固定开销（CJS 桥接 + 原生 addon 边界，实测约 0.2~0.5ms）。高速时这个开销占比极大：speed=2000 → `pointDelay=0.5ms`，若 nut-js 耗时 0.4ms，实际每步 0.9ms，有效速度仅约 1100 px/s（仅为设定值的 55%）。

解决方案分两层：

| 层 | 机制 | 效果 |
|----|------|------|
| 距离为零跳过 | `distance === 0` 时跳过 `setPosition` + `delay`，直接 `continue` | 消除 scale < 1 时的无效调用 |
| 开销自校准 | `t0 = performance.now()` → `await setPosition()` → `overhead = performance.now() - t0` → `delay(max(0, pointDelay - overhead))` | 自动补偿 nut-js 耗时，高速段恢复至设定值 |
| **末点零延迟** | `j < physicalPts.length - 1` 时才执行 `delay()`，末点画完立即抬笔 | 每路径省一次 delay，笔画切换更利落 |
| **坐标预计算** | 每条路径进入内循环前 `path.map(toScreen)` + `.map(toPhysical)` 一次性算出全部坐标 | `toScreen`/`toPhysical` 从 O(N) 次调用降为路径数次 `map`，热循环中仅做数组索引 |

```
实际每步 = nut-js耗时 + max(0, targetDelay - nut-js耗时)
         = max(nut-js耗时, targetDelay)

当 targetDelay ≥ nut-js耗时 → 实际 = targetDelay（精确达标）
当 targetDelay < nut-js耗时 → 实际 = nut-js耗时（硬件极限，不额外延迟）
```

**设计理由**：自校准方案无需硬编码 nut-js 耗时常量（不同 OS/CPU 差异大），运行时自动适配。`performance.now()` 精度 ~0.001ms，测量开销可忽略。

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

## 错误处理架构洞察（阶段 11）

### 集中化 ERROR 进入 vs 分散副作用

阶段 11 引入了 `error-handler.ts` 作为 ERROR 状态的统一入口，但副作用（热键注销、窗口销毁、Worker 终止）分散在各模块的 state-change 监听器中：

```
enterError(errorInfo)
  → stateMachine.transition(ERROR)
    → shortcut-manager: state-change 监听 → refresh() → unregisterAll()
    → index.ts: PREVIEWING→non-PREVIEWING 监听 → destroyOverlay()
  → IPC: APP_ERROR + APP_STATE + SHOW_TOAST
```

**为什么不由 error-handler 直接处理所有副作用？** 遵循单一职责原则。error-handler 只负责状态迁移和 IPC 推送。热键管理、窗口销毁、Worker 终止分别由各自的模块通过监听 `state-change` 事件响应，避免 error-handler 依赖过多模块（循环依赖风险）。

### ERROR 恢复流程

```
用户点击 [重试]
  → IPC RETRY_FROM_ERROR
  → 验证当前状态为 ERROR
  → 清空 context 全部缓存（imageBuffer/paths/boundingBox 等）
  → transition(NOT_READY)
  → IPC: APP_STATE(NOT_READY) + Toast "已重置"
  → UI: ErrorOverlay 消失，恢复 ImageDropZone
  → 用户重新导入图片 → 新管线启动
```

**注意**：当前实现不重新预加载模型（模型在推理 Worker 内部按需加载），重启应用时托盘提示"模型加载中"的逻辑暂未实现。

### 单实例锁与退出保护

```
app.requestSingleInstanceLock()
  ├── 成功 → 注册 second-instance 事件（激活已有窗口）
  └── 失败 → app.quit()

app.on('before-quit')
  → if DRAWING: event.preventDefault()
    → drawingEngine.stop() 抬笔
    → setTimeout(2000) → app.quit()
```

- 单实例锁在 `app.whenReady()` **之前**执行，确保第二个实例尽早退出
- `before-quit` 中 DRAWING 状态延迟 2s 退出，给予 `stop()` 时间在当前步进循环中检测 `stopFlag` 并抬笔

### ErrorOverlay 与父组件通信（props 透传，非 provide/inject）

ErrorOverlay 通过**标准 Vue props 透传**接收状态：

```
App.vue: :appStatus="appStatus" :errorInfo="errorInfo"
  → ContentRouter.vue: defineProps + v-bind 透传给动态组件
    → ImagePanel.vue: defineProps<{ appStatus, errorInfo }>
      → ErrorOverlay.vue: props: { error: ErrorInfo }
```

**为什么是 props 而非 provide/inject？** 初始实现使用 provide/inject 避免 prop drilling。实测发现 `<KeepAlive>` 缓存组件中，inject 返回的 Ref 在模板绑定中存在响应性边界情况——状态变更后 `v-if` 条件不触发重新渲染。改为 props 后响应性链路完全确定。

**ImagePanel 前端状态重置**：`watch(() => props.appStatus)` 检测 `ERROR → NOT_READY`（用户点击重试后），自动清除 `hasImage`/`originalSrc`/`lineArtSrc`/`isProcessing` 四个前端 ref，还原为空拖拽区。与主进程 `RETRY_FROM_ERROR` 的 Buffer 清空构成前后端双重重置。

## 设置面板架构洞察（阶段 12）

### SettingsPanel 组件树与数据流

```
SettingsPanel.vue
  ├── HotkeySettings.vue
  │     └── HotkeyRow.vue (×4)
  │           └── HotkeyCapture.vue (条件渲染)
  ├── SliderControl.vue (×3: 速度/透明度 + 颜色)
  └── 内联 radio-group / color-picker
```

**数据流**：
1. `onMounted` → `getSettings()` IPC → `configStore.getAll()` → 填充本地 `settings` ref
2. 用户修改 → 立即写入本地 ref + 调用 `updateSettings({ [key]: value })` IPC → `configStore.set()`
3. `configStore.onDidChange` 自动通知快捷键管理器（hotkeys 变更）和叠加窗口（opacity/lineColor 变更）

### SliderControl.vue
通用范围滑块组件（`src/renderer/components/SliderControl.vue`）：
- Props：`label`、`modelValue`（number）、`min`、`max`、`step`（默认 1）、`unit`（可选）
- Emit：`update:modelValue`（v-model 协议）
- 视觉：CSS `--fill-pct` 自定义属性驱动渐变填充，13px 白底主色边框圆形滑块，拖动放大至 18px
- 设置面板中复用 3 次（速度/透明度 + 颜色取值）

### HotkeyRow.vue
单行快捷键设置组件（`src/renderer/components/HotkeyRow.vue`）：
- Props：`label`（中文名）、`keyValue`（当前键值，如 `'Ctrl+Shift+F9'`）、`defaultKey`（默认键值）
- Emit：`update`（新键值字符串）
- 键帽渲染：`keyValue.split('+')` 拆分组合键 → 逐个 `<span class="keycap">` 渲染
- 键帽样式：`--color-surface-300` 背景 + `box-shadow: 0 2px 0 --color-surface-400` 模拟立体感
- [修改] 按钮 → 打开 `HotkeyCapture` 覆盖层
- [恢复默认] 按钮 → emit 默认键值

### HotkeyCapture.vue
全屏按键捕获弹窗（`src/renderer/components/HotkeyCapture.vue`）：
- Props：`visible`、`currentKey`
- Emit：`close`、`confirm(key)`
- 捕获逻辑：`window.addEventListener('keydown', onKeyDown, true)` （capture 阶段）
- 组合键构建：Ctrl/Shift/Alt/Meta 修饰键 → 拼接非修饰键（`e.key` 大写化）
- 排除纯修饰键（单独按 Ctrl/Shift/Alt/Meta 不捕获）
- Esc → emit('close')、Enter → emit('confirm')

### HotkeySettings.vue
快捷键设置分组容器（`src/renderer/components/HotkeySettings.vue`）：
- Props：`hotkeys: { preview, startDraw, stopDraw, toggleOverlay }`
- Emit：`update(key, value)`
- 4 行 HotkeyRow：进入/退出预览（F5）、开始绘制（F6）、停止绘制（F7）、预览/穿透（Ctrl+Shift+F9）
- 默认值 Record：`{ preview: 'F5', startDraw: 'F6', stopDraw: 'F7', toggleOverlay: 'Ctrl+Shift+F9' }`

## 主题系统架构洞察（阶段 12）

### 主题切换数据流

```
SideNav.vue: 点击 Moon/Sun 按钮
  → emit('toggle-theme')
    → App.vue: toggleTheme()
      → theme.value = 'dark' ↔ 'light'
      → :data-theme="theme" 绑定更新
        → 浏览器重新解析所有 var(--color-*) 为 [data-theme="light"] 对应值
        → CSS 零开销全站换色
```

**关键设计决策**：主题状态仅存在于渲染进程（`App.vue` 的 `ref`），不持久化。原因是：用户通常偏好与 OS 主题一致，每次启动默认深色即可。如需持久化，可加入 `configStore`。

### 阴影 Token 系统

```
:root {
  --shadow-card:         none;    // 深色底阴影不可见
  --shadow-dropdown:     none;
  --shadow-modal:        none;
  --shadow-button-hover: none;
}

[data-theme="light"] {
  --shadow-card:         0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-dropdown:     0 4px 16px rgba(0,0,0,0.10);
  --shadow-modal:        0 8px 32px rgba(0,0,0,0.12);
  --shadow-button-hover: 0 2px 8px rgba(92,95,239,0.25);
}
```

| Token | 使用场景 | 文件 |
|-------|---------|------|
| `--shadow-card` | 设置面板卡片 | SettingsPanel.vue |
| `--shadow-modal` | 按键捕获弹窗、首次启动提示 | HotkeyCapture.vue、FirstRunTips.vue |
| `--shadow-dropdown` | Toast 通知 | ToastItem.vue |
| `--shadow-button-hover` | 主色填充按钮 hover 态 | PanelToolbar、ErrorOverlay、FirstRunTips、HotkeyCapture |

### 面板背景三层显式设置

阶段 12 发现：面板背景不能依赖 CSS 继承链（`body → app-layout → ...`），必须在以下层级各自显式设置 `background: var(--color-surface-0)`：

| 层 | 文件 | 原因 |
|----|------|------|
| ContentRouter | ContentRouter.vue | `<Transition mode="out-in">` 间隙可见，依赖继承会闪现 |
| ImagePanel | ImagePanel.vue | 图片面板内容区独立于 ContentRouter 的 flex 布局 |
| SettingsPanel | SettingsPanel.vue | 设置面板独立于 ContentRouter 的 flex 布局 |

## 叠加层设置实时同步洞察（阶段 12）

### 架构

```
SettingsPanel: updateSettings({ overlayOpacity: 0.5 })
  → IPC UPDATE_SETTINGS
    → configStore.set('overlayOpacity', 0.5)
      → configStore.onDidChange('overlayOpacity') 触发
        → index.ts 监听器: getOverlayWindow()?.setOpacity(0.5)
      → configStore.onDidChange('overlayLineColor') 触发
        → index.ts 监听器: overlay.webContents.send('overlay-line-color', '#333')
          → overlay/main.ts: lineColor = '#333'; render()
```

**为什么在 `index.ts` 中而非 `ipc-handlers.ts` 中处理？** IPC handler 只负责数据持久化，不持有窗口引用。`index.ts` 是唯一同时持有 `configStore` 和 `getOverlayWindow` 的模块。复用 `configStore.onDidChange` 模式（与快捷键管理器的 hotkeys 重注册一致），解耦设置写入和副作用触发。

## 首次启动提示洞察（阶段 12）

### FirstRunTips.vue
- `src/renderer/components/FirstRunTips.vue`：全屏半透明遮罩（`z-index: 10001`）+ 居中卡片
- `onMounted` 中通过 `getSettings()` 读取当前配置的快捷键值（非硬编码默认值）
- 点击"知道了" → emit `dismiss` → App.vue 调用 `updateSettings({ hasSeenShortcutTips: true })` 持久化
- 标志位 `hasSeenShortcutTips` 存储在 `configStore`（`config.json`），重启后不再显示

### GET_SETTINGS IPC 通道
- 方向：Renderer → Main（invoke）
- 类型：`src/shared/types.ts` → `IPC_CHANNELS.GET_SETTINGS: 'get-settings'`
- Handler：`ipcMain.handle` → `deps.configStore.getAll()` → 返回完整 `AppConfig`
- 使用场景：SettingsPanel 初始化、FirstRunTips 读取快捷键值

## 导出线稿架构洞察（阶段 13）

### exportLineArt 调用路径

`exportLineArt()` 在 `src/main/index.ts` 中定义为 `app.whenReady()` 闭包内的异步函数，同时供两处调用：

| 触发路径 | 调用链 | 通知机制（成功） | 通知机制（失败） |
|---------|--------|-----------------|-----------------|
| IPC handler (`export-lineart`) | `PanelToolbar` 导出按钮 → `ipcMain.handle` → `deps.exportLineArt()` | Toast "线稿已导出" | `Notification` 系统托盘通知 |
| 托盘菜单 ("导出线稿 PNG") | `MenuItem.click` → `deps.exportLineArt()` | Toast "线稿已导出" | `Notification` 系统托盘通知 |

### 为什么保存失败用 Notification 而非 Toast

保存成功 → Toast：用户此时通常盯着应用窗口，Toast 滑入即可感知。

保存失败 → `Notification`：用户可能在点击保存后切换到文件管理器或其他应用。Toast 仅渲染在主窗口中，用户离开窗口则无法看到。系统 `Notification`（`new Notification({ title, body }).show()`）通过 OS 原生通知中心推送，无论用户当前在哪个应用都能看到。

### 未提取为独立模块的理由

`exportLineArt()` 仅 30 行，逻辑为线性流程（检查 Buffer → 弹对话框 → 写文件 → 通知）。提取为独立 handler 文件（如 `export-lineart-handler.ts`）需要注入 4 个依赖（`lineArtBuffer` getter、`showSaveDialog`、`writeFile`、`showNotification`），DI 开销远大于函数本身。KISS 原则决定保留在 `index.ts` 闭包内。

## 打包与分发架构洞察（阶段 14）

### electron-builder 配置架构

```
package.json → "build" 字段
  ├── appId: "com.akd.app"           # 应用唯一标识
  ├── productName: "AKD"             # 显示名称
  ├── directories.output: "release"  # 构建产物输出目录
  ├── files: ["dist/**/*", "resources/**/*"]  # 打包包含文件
  ├── asar: true                     # 源码归档为 app.asar
  ├── asarUnpack: [...]              # 原生模块排除（不可压缩进 asar）
  ├── extraResources: [...]          # 外部资源文件（asar 外，直接路径访问）
  ├── win: { target: "nsis" }       # Windows → NSIS 安装器
  ├── mac: { target: "dmg" }        # macOS → DMG 磁盘映像
  └── linux: { target: "AppImage" } # Linux → AppImage 便携包
```

### asarUnpack 原则

以下类型的 node_modules 必须排除于 asar 归档：

| 类型 | 原因 | 示例 |
|------|------|------|
| Node-API 原生 `.node` 模块 | 从 asar 中无法 `dlopen()` | `onnxruntime-node`、`sharp` |
| 包含 `.wasm` 文件的包 | WASM 通过 `fs.readFileSync` 加载 | `@dalongrong/opencv-wasm`（opencv.wasm 8.5MB） |
| 包含平台二进制文件的包 | 子进程 exec 需要 | `clipboardy`（fallbacks/*.exe） |

### extraResources 原则

运行时需要通过文件路径直接访问的资源必须放在 asar 外：

| 资源 | 路径（prod） | 用途 |
|------|-------------|------|
| ONNX 模型 | `process.resourcesPath/models/` | 推理 Worker 加载 anime2sketch.onnx |
| 托盘图标 | `process.resourcesPath/icons/tray/` | 托盘 5 状态图标（PNG） |
| 应用图标 | `process.resourcesPath/icons/icon.png` | 操作系统显示（快捷方式/任务栏） |

### electron 依赖位置

`electron` 必须在 `devDependencies` 中（而非 `dependencies`）：
- **原因**：electron-builder 在打包时自行下载并嵌入指定版本的 Electron 二进制。若 electron 在 dependencies 中，electron-builder 会报错退出
- **开发时**：`npm run dev` 通过 `npx electron .` 仍可正常使用 devDependencies 中的 electron

### 平台构建目标

| 平台 | 格式 | 扩展名 | 说明 |
|------|------|--------|------|
| Windows | NSIS | `.exe` | 安装向导，`oneClick: false` |
| macOS | DMG | `.dmg` | 拖拽安装磁盘映像 |
| Linux | AppImage | `.AppImage` | 免安装便携包 |

### postinstall 脚本

`"postinstall": "electron-builder install-app-deps"` 确保每次 `npm install` 后：
1. 使用 `@electron/rebuild` 重新编译原生模块
2. 针对当前 `electron` 版本的 Node.js ABI（而非系统 Node.js）
3. 避免 `NODE_MODULE_VERSION` 不匹配导致的运行时崩溃

### 安装器体积分析（761MB）

| 组件 | 大小 | 说明 |
|------|------|------|
| Electron 42.0.1 运行时 | ~227MB | Chromium + Node.js |
| anime2sketch.onnx.data | 218MB | ONNX 模型权重文件 |
| app.asar | ~498MB | 包含 node_modules 依赖 |
| 其他资源 | ~18MB | 图标、字体、许可证 |

后续优化方向：模型量化（ONNX FP16/INT8）、asar 压缩、Windows 便携版（免安装 zip）。

## 绘制引擎 DPI 坐标系统洞察（阶段 14）

### Electron DIP vs nut-js 物理像素

AKD 的绘制坐标转换涉及**三个坐标空间**，这是阶段 14 白屏后暴露的第二个关键 Bug：

```
原图坐标系 (path points, px)
    → toScreen(): (point - boundingBox.min) × scale + overlayRect.origin
    → 屏幕 DIP 坐标（Electron 窗口 API 返回值）
        → toPhysical(): dip × scaleFactor
        → 屏幕物理像素（nut-js SetCursorPos 参数）
```

| 坐标空间 | 来源 | 使用方 | 单位 |
|---------|------|--------|------|
| 原图坐标 | 路径提取 Worker (`DrawPath[]`) | `toScreen()` 输入 | 图片像素 |
| 屏幕 DIP | `BrowserWindow.getBounds()` / `screen.*` API | `toScreen()` 输出、窗口定位 | 设备无关像素 |
| 屏幕物理 | `screen.getDisplayNearestPoint().scaleFactor` | `mouse.setPosition()` 参数 | 物理像素 |

**为什么需要 DIP→物理转换？** Electron 所有窗口/屏幕 API 返回 DIP（设备无关像素），但 nut-js 底层在 Windows 上调用 Win32 `SetCursorPos()`，该 API 接受物理像素。若显示器缩放 150%，DIP 值 (500, 300) 对应的物理坐标是 (750, 450)。直接传 DIP 值给 nut-js 会导致绘制位置向屏幕左上角偏移，偏移量随距离正比放大。

### 修复方案

```typescript
// OverlayRect 新增字段
interface OverlayRect {
  x: number; y: number; width: number; height: number
  scaleFactor: number  // ← 阶段 14 新增
}

// index.ts startDraw() 中获取 DPI 缩放因子
const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y })
drawingEngine.start(paths, boundingBox, {
  ...bounds,
  scaleFactor: display.scaleFactor,
})

// drawing-engine.ts 中 DIP→物理转换
function toPhysical(dip: { x: number; y: number }) {
  return {
    x: Math.round(dip.x * overlayRect.scaleFactor),
    y: Math.round(dip.y * overlayRect.scaleFactor),
  }
}
// 所有 mouse.setPosition() 调用包装 toPhysical()
```

**设计考量**：`scaleFactor` 通过 `OverlayRect` 传入而非由引擎内部计算，原因是：
1. `drawing-engine.ts` 不直接依赖 `electron` 的 `screen` 模块（保持可测试性）
2. 测试环境传 `scaleFactor: 1`，无需 mock Electron API
3. 调用方（`index.ts`）已持有 `screen` 导入，职责自然

## loadFile 路径解析陷阱（阶段 14）

### 问题

`src/main/index.ts` 被 esbuild 编译到 `dist/main/main/index.js`，其 `__dirname` 为 `dist/main/main/`。生产模式下 `loadFile()` 的路径解析容易多写一层 `dist/`：

```
错误: join(__dirname, '../../dist/renderer/index.html')
     → dist/main/main/  +  ../../dist/renderer/index.html
     → dist/dist/renderer/index.html  ← 文件不存在！

正确: join(__dirname, '../../renderer/index.html')
     → dist/main/main/  +  ../../renderer/index.html
     → dist/renderer/index.html  ← 文件存在
```

**教训**：esbuild 输出的目录结构中，`../../` 已回到项目 `dist/` 根目录。任何以 `dist/` 开头的后续路径段都是多余的。这条规则同样适用于 `preview-overlay.ts`（叠加窗口加载）和 `resolveModelPath()` / `resolveIconDir()`（已正确）。

## 绘制速度精度洞察（阶段 14）

### setTimeout 最小粒度问题

`setTimeout` 在 Node.js 中的最小有效延迟约 1ms（受事件循环调度精度限制）。当 `drawSpeed > 1000` 时，`stepDelay = 1000/speed < 1ms` 被钳位至 ~1ms，导致高速段速度无法进一步提升。

此外，原始实现假设相邻路径点间隔恰好 1 屏幕像素（`stepDelay = 1000/speed`），但实际屏幕距离随 `scale` 缩放因子变化。例如放大 2x 预览时，相邻点间距也是 2 倍，固定延迟会导致高缩放比时绘制速度变慢。

**修复方向**（待验证）：
1. `delay()` 改为精度感知版本——≥1.5ms 用 `setTimeout` + 自旋补足亚毫秒余量，<1.5ms 纯自旋等待
2. 逐点延迟基于实际像素距离：`pointDelay = (distance(prev, curr) / speed) * 1000`

