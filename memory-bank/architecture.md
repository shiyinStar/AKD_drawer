# AKD 项目架构

**最后更新**: 2026-05-11 (阶段 4 完成)

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
│   │   ├── app-context.ts         # 依赖注入容器
│   │   ├── ipc-handlers.ts        # IPC 通信层
│   │   ├── image-import-handler.ts # 图片导入与校验
│   │   ├── state-machine.ts       # 全局状态机
│   │   └── config-store.ts        # 配置存储
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
│   │   │   ├── ImagePanel.vue      # 图片面板（拖拽区 ↔ 双图对比）
│   │   │   ├── ImageDropZone.vue   # 拖拽导入区 + 文件选择器
│   │   │   ├── ImageCompare.vue    # 原图/线稿双栏对比容器
│   │   │   ├── ImageViewer.vue     # 可缩放拖拽的图片查看器
│   │   │   ├── PanelToolbar.vue    # 面板工具栏（导入/导出按钮）
│   │   │   ├── StatusIndicator.vue # 5 状态指示灯（颜色+图标+动画+ARIA）
│   │   │   ├── ToastContainer.vue  # Toast 通知容器（右下角固定）
│   │   │   ├── ToastItem.vue       # 单条 Toast（毛玻璃+类型色条）
│   │   │   └── SettingsPanel.vue   # 设置面板（占位）
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
- `width: number` / `height: number` — 图片尺寸（预留，暂未填充）— 阶段 4 新增
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

### src/workers/inference/worker.ts (占位)
ONNX Runtime 推理 Worker。后续将: 加载 anime2sketch.onnx 模型、图片预处理/推理/后处理。

### src/workers/path-extraction/worker.ts (占位)
OpenCV.js 路径提取 Worker。后续将: 二值化 + findContours + approxPolyDP + 排序。

## 已知问题

- **Node.js v24 + `.mjs` 类型注解**：Node.js v24 对 `.mjs` 文件不做 TypeScript 类型剥离，`(data: Buffer)` 等语法导致 `SyntaxError: Unexpected token ':'`。解决：使用 `.ts` 扩展名 + `tsx` 运行（`npx tsx scripts/dev.ts`），纯 JS 的 `.mjs` 仍可直接 `node` 运行（如 `build-main.mjs`、`build-workers.mjs`）。
- **`session.defaultSession` 是静态成员**：不能通过 `win.webContents.session.defaultSession`（实例）访问，必须通过 `import { session } from 'electron'; session.defaultSession` 静态访问。
- **Electron sandbox 下 `File.path` 不可用**：渲染进程沙箱（`sandbox: true`，Electron 20+ 默认开启）中 `<input type="file">` 选择的文件无 `path` 属性。阶段 4 通过 `FileReader.readAsDataURL()` 在渲染进程直接读取文件内容绕过此限制。
- **CSP 阻止 data: URL 图片**：`default-src 'self'` 不包含 `data:` 协议，通过 IPC 传递的 base64 data URL 被浏览器阻止渲染。解决：显式添加 `img-src 'self' data:`。

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
