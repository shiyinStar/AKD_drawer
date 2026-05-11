# AKD 项目架构

**最后更新**: 2026-05-11

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
│   │   └── index.ts          # Electron 主进程入口
│   ├── preload/
│   │   └── index.ts          # contextBridge preload 脚本
│   ├── shared/
│   │   └── types.ts          # 核心类型、枚举、IPC 通道常量
│   ├── renderer/
│   │   ├── env.d.ts          # .vue 模块声明 + window.electronAPI 全局类型
│   │   ├── index.html        # Vite 入口 HTML
│   │   ├── main.ts           # Vue 应用入口
│   │   ├── App.vue           # 根组件（最小实现，显示 "AKD"）
│   │   └── styles/
│   │       └── global.css    # CSS reset + 暗色背景 + 字体族
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
└── memory-bank/              # 设计文档与进度跟踪
    ├── akd-design.md         # 完整设计规格
    ├── AKD-Implementation-Plan.md  # 实施计划
    ├── architecture.md       # 本文件
    └── progress.md           # 开发进度
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
- `IPC_CHANNELS` — 10 个 IPC 通道名常量（as const）

### src/main/index.ts
Electron 主进程入口。`app.whenReady()` → `createMainWindow()` 创建 960×680 BrowserWindow：
- CSP 通过 `session.defaultSession.webRequest.onHeadersReceived` 设置
- `show: false` + `ready-to-show` → `win.show()` 避免白屏
- 开发模式 `loadURL(http://localhost:5173)`，生产模式 `loadFile(dist/renderer/index.html)`
- `window-all-closed` 不执行 `app.quit()`（为系统托盘保留进程）

### src/preload/index.ts
contextBridge preload 脚本。通过 `exposeInMainWorld` 向渲染进程注入 `window.electronAPI`，提供 9 个方法：
- 状态监听：`getAppState`(invoke)、`onAppStateChange`(on)、`onDrawStatus`(on)、`onAppError`(on)
- 管线监听：`onPipelineProgress`(on)
- 用户操作：`importImage`(invoke)、`retryFromError`(invoke)、`updateSettings`(invoke)、`exportLineArt`(invoke)
- 全部使用 `ipcRenderer.invoke`/`on` Promise 模式，禁止 `sendSync`
- 从 `../shared/types.js` 导入 `IPC_CHANNELS` 常量

### src/renderer/env.d.ts
TypeScript 环境声明文件：
- `*.vue` 模块声明（`DefineComponent` 类型）
- `window.electronAPI` 全局接口（`ElectronAPI`），与 preload 暴露的方法签名一一对应
- 被 `tsconfig.renderer.json` 的 `include` 自动拾取

### src/renderer/App.vue
Vue 3 根组件。当前最小实现：单个 `<div>AKD</div>`。阶段 3 将扩展为完整的 TitleBar + SideNav + ContentRouter + StatusBar 布局。

### src/renderer/index.html
Vite 构建的 HTML 入口。`<meta charset="UTF-8">`、`lang="zh-CN"`、`<div id="app">`、`<script type="module" src="./main.ts">`。

### src/renderer/main.ts
Vue 应用入口点：
- 导入 `@fontsource/inter` 3 个字重（400/500/600）
- 导入 `@fontsource/jetbrains-mono` 2 个字重（400/500）
- 导入 `./styles/global.css`（CSS reset + 暗色主题基础）
- `createApp(App).mount('#app')` 挂载根组件

### src/renderer/styles/global.css
全局基础样式：`box-sizing: border-box`、body 暗色背景 `#0a0a0f`、Inter + 微软雅黑 + 苹方字体链、`overflow: hidden`。

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

各模块通过 `AppContext` 接收依赖，禁止全局 import 单例:
- `stateMachine` — 全局状态机单例
- `configStore` — 配置存储单例
- `mainWindow` — 主 BrowserWindow 引用

这个模式将在阶段 2 步骤 2.4 实现。
