# AKD 开发进度

**最后更新**: 2026-05-12 (阶段 12 完成)

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

## 阶段 2：核心基础设施 ✅ 完成

### 步骤 2.1 — IPC 通信层 ✅
- `src/main/ipc-handlers.ts`：集中注册 5 个 `ipcMain.handle` 处理器
  - `APP_STATE` — 返回当前状态机状态
  - `IMPORT_IMAGE` — 占位（返回 `{ success: false }`）
  - `RETRY_FROM_ERROR` — 占位
  - `UPDATE_SETTINGS` — 占位
  - `export-lineart` — 占位
- 通过 `IpcHandlerDeps` 接口接收依赖（`getState`）

### 步骤 2.2 — 全局状态机 ✅
- `src/main/state-machine.ts`：五状态流转引擎
  - `InvalidTransitionError` 自定义异常类
  - `StateMachine` 类：`getState()`、`transition()`、`onStateChange()`、`removeStateChangeListener()`
  - 合法转移白名单（`VALID_TRANSITIONS`）
  - 非法转移抛出 `InvalidTransitionError`，状态不被修改
  - 基于 `EventEmitter`（`node:events`）发布 `state-change` 事件
  - 导出单例 `stateMachine`
- `tests/unit/state-machine.test.ts`：**15 个测试全部通过**
  - 覆盖：合法转移 ×5、非法转移 ×2、ERROR 多路径转入 ×4、事件验证、状态不变保护

### 步骤 2.3 — 配置存储 ✅
- `src/main/config-store.ts`：基于 `electron-store` v11 原生 ESM
  - Schema 含全部 6 项默认值（hotkeys 3 子项、drawSpeed、mouseButton、overlayOpacity、overlayLineColor）
  - `get()`、`set()`、`getAll()`、`reset()`、`onDidChange()` 方法
  - 构造函数接收 `cwd` 选项（测试时传入临时目录，生产时使用 `dirname(process.execPath)`）
- `tests/unit/config-store.test.ts`：**8 个测试全部通过**
  - 使用 `mkdtempSync` 创建临时目录，`after` 钩子自动清理

### 步骤 2.4 — 应用上下文 ✅
- `src/main/app-context.ts`：DI 容器
  - `AppContext` 接口：持有 `stateMachine`、`configStore`、`mainWindow`
  - `createAppContext()` 工厂函数：创建 `ConfigStore`（传入 `process.execPath` 目录），组装上下文
- `src/main/index.ts` 更新：
  - `app.whenReady()` 中：`createAppContext()` → `createMainWindow()` → `ctx.mainWindow = win` → `registerIpcHandlers()`

### 遇到的问题
- `electron-store`（底层 `conf`）在 Electron 外运行时需要 `cwd` 或 `projectName`。将 `ConfigStore` 改为构造函数接收 `cwd` 参数，移除模块级单例，由 `createAppContext` 负责创建。

### 验证汇总
| 检查项 | 结果 |
|--------|------|
| `npx tsc -p tsconfig.main.json --noEmit` | 通过 |
| `node scripts/build-main.mjs` | 构建成功 |
| `npx tsx --test tests/unit/state-machine.test.ts` | 15/15 通过 |
| `npx tsx --test tests/unit/config-store.test.ts` | 8/8 通过 |
| 源码 `require()` 检查 | 0 匹配 |
| Node 内置模块 `node:` 协议 | 全部合规 |

## 阶段 3：渲染进程 UI 骨架 ✅ 完成

### 步骤 3.1 — 全局 CSS 变量与主题 ✅
- `src/renderer/styles/tokens.css`：完整 CSS 自定义属性系统
  - 颜色：主色（靛蓝紫）、暗色表面 9 阶、语义色、叠加层色、毛玻璃色
  - 排版：`--font-ui`（Inter + 微软雅黑 + 苹方）、`--font-mono`（JetBrains Mono + Cascadia Code + Consolas）
  - 间距：4px 基准 7 级等比（4/8/12/16/24/32/48）
  - 圆角：4/6/8/12px
  - 动画：4 种缓动函数 + 4 级时长
  - `[data-theme="light"]` 亮色主题颜色反转
  - `@keyframes status-pulse`（NOT_READY 2s / DRAWING 1s）、`@keyframes status-glow`（PREVIEWING 3s）
- `src/renderer/styles/typography.css`：工具类 `.text-body`/`.text-caption`/`.text-mono`/`.text-heading`
- `src/renderer/styles/global.css` 更新：
  - `@import` tokens.css 和 typography.css
  - 所有硬编码颜色/字体替换为 CSS 变量
  - 添加暗色滚动条样式、选中文本高亮

### 步骤 3.2 — 自定义标题栏 + 窗口控制 IPC ✅
- `src/renderer/components/TitleBar.vue`：
  - 高度 32px，`-webkit-app-region: drag` 可拖拽
  - 左侧 "AKD" 标签（12px），右侧三个窗口控制按钮
  - 按钮使用 lucide-vue-next 图标：Minus / Square / X（16px, stroke-width 1.5）
  - 关闭按钮 hover 红色背景，双击标题栏切换最大化
- 新增 3 个 IPC 通道（`WINDOW_MINIMIZE`/`WINDOW_MAXIMIZE`/`WINDOW_CLOSE`）到 `types.ts`
- 更新 `preload/index.ts`：暴露 `windowMinimize`/`windowMaximize`/`windowClose`
- 更新 `env.d.ts`：添加对应 TypeScript 类型
- 更新 `ipc-handlers.ts`：新增 `getMainWindow` 依赖 + 3 个 handler
- 更新 `main/index.ts`：窗口 `frame: false`（无框窗口）+ `minWidth: 720`/`minHeight: 480`

### 步骤 3.3 — 左侧导航栏 ✅
- `src/renderer/components/NavItem.vue`：48×48px 按钮，20×20px 图标
  - 激活态：左侧 2px 主色竖条 + 图标变主色
  - hover 态：图标颜色变亮
  - title 属性 tooltip
- `src/renderer/components/SideNav.vue`：
  - 固定 48px 宽，上下分区（顶部 Image/Settings，底部 Info）
  - 接收 `activePanel` prop + emit `update:activePanel`

### 步骤 3.4 — 状态栏 ✅
- `src/renderer/components/StatusBar.vue`：28px 高，flex-shrink: 0
  - 左侧 slot `indicator`（状态指示灯占位）
  - 右侧 slot `tasks`（后台任务占位）

### 步骤 3.5 — App.vue 整体布局 ✅
- 完整四区域布局：`TitleBar`(32px) → `SideNav`(48px) + `ContentRouter`(flex) → `StatusBar`(28px)
- `activePanel` 状态管理（`ref<string>`，默认 `'image'`）
- `data-theme="dark"` 绑定
- Flexbox 纵向布局，内容区横向

### 步骤 3.6 — 内容路由切换 ✅
- `src/renderer/components/ContentRouter.vue`：
  - 基于 `activePanel` prop 动态渲染 `<component :is="...">`
  - `image` → ImagePanel, `settings` → SettingsPanel
  - `<Transition name="panel">` 250ms 淡入淡出
- `src/renderer/components/SettingsPanel.vue`：占位组件，显示 "设置"

### 步骤 3.7 — 图片面板：空状态与拖拽区 ✅
- `src/renderer/components/ImagePanel.vue`：
  - `hasImage` ref 驱动布局切换
  - **未导入图片**：整块 `ImageDropZone` 铺满内容区（单一完整矩形区域）
  - **已导入图片**：左右双栏，各显示 placeholder（"原图"/"线稿" + Image 图标）
  - 工具栏"导入图片"按钮 → 重置 `hasImage = false` → 切回整块拖拽区重新导入
- `src/renderer/components/ImageDropZone.vue`：
  - 虚线边框 + ImagePlus 48px 图标 + 提示文字
  - `dragover` → 仅判断 `types.includes('Files')`，文件拖拽统一蓝色边框（浏览器安全限制，dragover 时拿不到文件名）
  - `drop` → 通过 `file.name` 校验扩展名，不合法才显示红色边框 300ms 闪烁
  - 校验通过后调用 `window.electronAPI.importImage()` + `emit('file-selected', filePath)`
  - 隐藏 `<input type="file">` 支持点击选文件
- `src/renderer/components/PanelToolbar.vue`：40px 高，**位于内容区顶部**（border-bottom 分隔线）
  - `hasImage` prop 控制导出按钮 disabled 态（无图片时灰色不可点击）
  - `import` emit 通知父组件触发重新导入
  - [导入图片] 主按钮（主色填充、hover 上浮 1px，Download 图标）
  - [导出线稿 PNG] 次按钮（Upload 图标）

### 阶段 3 Bug 修复记录
| 问题 | 原因 | 修复 |
|------|------|------|
| 拖拽任何格式都蓝框，不支持格式不红框 | `onDragOver` 用 `item.type`（MIME 如 `image/png`）匹配 `isValidFile()`（检查扩展名如 `.png`），永久不匹配；`types.every()` 逻辑也写反了 | 改为 `types.includes('Files')` 仅判断是否文件拖拽；扩展名校验移至 `drop` 事件中用 `file.name` 判断 |
| 导入前后布局不变 | 未实现 | `ImagePanel` 加 `hasImage` 状态驱动 `v-if`/`v-else` 切换整块拖拽区 ↔ 双栏布局 |
| 窗口可无限缩小至 1px | `main/index.ts` 中 `minWidth`/`minHeight` 未设上（之前编辑被后续编辑覆盖） | 补充 `minWidth: 720`、`minHeight: 480`、`frame: false` 到 BrowserWindow 构造参数 |

### UI 调整记录
| 调整 | 说明 |
|------|------|
| 工具栏移至顶部 | `PanelToolbar` 从内容区底部移到顶部，边框从 `border-top` 改为 `border-bottom` |
| 按钮图标互换 | 导入按钮改用 Download 图标，导出按钮改用 Upload 图标 |

### 验证汇总
| 检查项 | 结果 |
|--------|------|
| `npx tsc -p tsconfig.main.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.shared.json --noEmit` | 通过 |
| `npx vite build` | 构建成功，1523 模块 |
| `node scripts/build-main.mjs` | 构建成功 |
| `npx tsx --test tests/unit/state-machine.test.ts` | 15/15 通过 |
| `npx tsx --test tests/unit/config-store.test.ts` | 8/8 通过 |
| 源码 `require()` 检查 | 0 匹配 |

## 阶段 4：图片导入与 IPC 数据流 ✅ 完成

### 步骤 4.1 — 图片导入 Handler（Main Process） ✅
- `src/main/image-import-handler.ts`：文件校验 + 图片导入核心逻辑
  - 扩展名白名单（.png/.jpg/.jpeg/.webp/.bmp）+ magic bytes 双重校验
  - WebP 独立校验：RIFF 头 + WEBP 标识
  - `handleImportImage(filePath, ctx)` → `access` → `readFile` → `validateFormat` → 存储 `ctx.imageBuffer`/`ctx.imagePath` → 返回 `{ success, dataUrl, fileName }`
- `src/main/app-context.ts` 扩展：`AppContext` 新增 `imageBuffer: Buffer | null`、`imagePath: string | null`、`width: number`、`height: number`
- `src/main/ipc-handlers.ts` 更新：
  - `IMPORT_IMAGE` handler 改为调用 `handleImportImage`，成功后推送 `SHOW_TOAST` 和 `APP_STATE`
  - 新增 `GET_IMAGE_DATA` handler、`OPEN_FILE_DIALOG` handler
  - `IpcHandlerDeps` 新增 `getContext`
- `src/main/index.ts`：`registerIpcHandlers` 传入 `getContext`；CSP 新增 `img-src 'self' data:`
- `src/shared/types.ts`：新增 `SHOW_TOAST`、`GET_IMAGE_DATA`、`OPEN_FILE_DIALOG` 通道 + `ToastMessage` 接口
- `src/preload/index.ts`：新增 `onToast`、`getImageData`、`openFileDialog`
- `src/renderer/env.d.ts`：对应类型声明
- **测试**：`tests/unit/image-import-handler.test.ts` — 8 用例（合法 PNG/JPG、不存在文件、不支持扩展名、magic bytes 失败、失败不污染 context）

### 步骤 4.2 — 图片面板：双图对比展示 ✅
- `src/renderer/components/ImageViewer.vue`：可缩放拖拽的图片查看器
  - 滚轮缩放 10%~200%（`CSS transform: scale()`）
  - 缩放 > 1x 后按住鼠标拖拽平移（`translate`，移动量按缩放比修正）
  - 三种状态：骨架屏（shimmer）→ 空状态 → 图片显示
  - 光标：grab/grabbing，右下角缩放比例指示器
- `src/renderer/components/ImageCompare.vue`：左右双栏布局 + 中间分隔线
- `src/renderer/components/ImagePanel.vue` 重构：`v-if` 切换拖拽区 ↔ 双图对比；`nextTick` + `openFilePicker()` 实现按钮一键导入
- `src/renderer/components/ImageDropZone.vue` 重构：
  - 文件选择器 → `<input type="file">` → `FileReader.readAsDataURL()` 在渲染进程读取
  - 拖拽 → `file.path`（如可用）→ IPC 导入；不可用则 fallback 到 `FileReader`
  - `defineExpose({ openFilePicker })` 供父组件调用
- `scripts/dev.ts`：启动 Vite 前自动 `execSync('node scripts/build-main.mjs')`

### 步骤 4.3 — 状态指示灯组件完整实现 ✅
- `src/renderer/components/StatusIndicator.vue`：5 状态完整映射
  - 结构：`[● 8px圆点] [Lucide图标 16px] [标签 12px] | [附加信息 12px]`
  - 动画：pulse（NOT_READY 2s / DRAWING 1s）、glow（PREVIEWING 3s）、none（IDLE/ERROR）
  - 颜色通过根节点 style binding 驱动，子元素 `currentColor` 继承
  - `role="status"` + `aria-live` 无障碍
- `src/renderer/App.vue`：`appStatus` + `statusExtra` ref，IPC 监听状态变更

### 步骤 4.4 — Toast 通知组件 ✅
- `src/renderer/components/ToastItem.vue`：单条 Toast，毛玻璃 + 左侧类型色条 + 滑入/淡出动画
- `src/renderer/components/ToastContainer.vue`：右下角固定定位，`TransitionGroup`，队列上限 3
- `src/renderer/App.vue`：`toasts` ref 队列管理 + IPC `onToast` 监听
- 调试 API：`__akdDebug.setStatus(state, extra?)` / `__akdDebug.toast(type, message)`

### 阶段 4 Bug 修复记录
| 问题 | 原因 | 修复 |
|------|------|------|
| 导入图片后原图不显示 | CSP `default-src 'self'` 不包含 `data:` 协议 | 添加 `img-src 'self' data:` |
| `npm run dev` 主进程改动不生效 | `dev.ts` 未构建 Main Process | 启动 Vite 前自动 `build-main.mjs` |
| 按钮"导入图片"无效 | `onImportClick` 只重置状态未触发文件选择器 | `nextTick` + `dropZoneRef.openFilePicker()` |
| 文件选择器选文件后无反应 | Electron sandbox 下 `File.path` 为 `undefined` | `FileReader.readAsDataURL()` 渲染进程读取 |
| 原对话框方案无法呼出 | `dialog.showOpenDialog` 在无框窗口下异常 | 回退 `<input type="file">` + `FileReader` |

### UI 调整记录
| 调整 | 说明 |
|------|------|
| Toast 位置 | 右上角 → 右下角（`bottom: 12px`） |
| 图片平移 | 缩放 > 1x 后支持按住拖拽平移 |

### 验证汇总
| 检查项 | 结果 |
|--------|------|
| `npx tsc -p tsconfig.main.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.shared.json --noEmit` | 通过 |
| `node scripts/build-main.mjs` | 构建成功 |
| `npx vite build` | 构建成功 |
| `npx tsx --test tests/unit/state-machine.test.ts` | 15/15 通过 |
| `npx tsx --test tests/unit/config-store.test.ts` | 8/8 通过 |
| `npx tsx --test tests/unit/image-import-handler.test.ts` | 8/8 通过 |
| 源码 `require()` 检查 | 0 匹配 |

## 阶段 5：推理管线 ✅ 完成

### 步骤 5.1 — 模型文件部署配置 ✅
- `package.json` 添加 `build` 字段：`appId: com.akd.app`、`extraResources` 含 `resources/models`、`asarUnpack` 含 onnxruntime-node/sharp/opencv-js

### 步骤 5.2 — 推理 Worker ✅
- `src/workers/inference/worker.ts` 完整实现：
  - 使用 `onnxruntime-node` 加载 `anime2sketch.onnx` 模型（CPU 推理）
  - 预处理：sharp resize 512×512 fill → `.removeAlpha()` → RGB raw → NCHW Float32Array 归一化 [-1,1]
  - 后处理：反归一化 → Uint8Array [0,255] → sharp 缩放回原始尺寸 → PNG Buffer
  - 消息协议：接收 `{ type: 'infer', imageBuffer }` → 发送 `{ type: 'result', lineArtBuffer }` 或 `{ type: 'error', message }`
  - 30s 超时保护
  - 模型路径通过 `workerData.modelPath` 传入
  - 原始图片尺寸通过 sharp metadata 自动检测

### 步骤 5.3 — Worker 管理器 ✅
- `src/main/worker-manager.ts` 创建：
  - `runInference(modelPath, imageBuffer): Promise<Buffer>` 方法
  - 封装 Worker 生命周期：创建 → postMessage → 等待结果 → terminate
  - 30s 超时 → `worker.terminate()` + reject
  - error/messageerror 事件处理 + 清理

### 步骤 5.4 — 管线编排器 ✅
- `src/main/pipeline-orchestrator.ts` 创建：
  - `createPipelineOrchestrator(deps)` 工厂函数
  - `run(imageBuffer)` 方法：推送 pipeline-progress → 调用 runInference → 存储 lineArtBuffer/lineArtBase64 到 context → 推送 pipeline-complete → 状态转 IDLE → 推送 Toast
  - 推理失败 → 状态转 ERROR → 推送 app-error + Toast 错误通知
- `src/shared/types.ts`：新增 `PipelineCompleteData` 接口（lineArtBase64, pathCount, boundingBox）
- `src/main/app-context.ts`：新增 `lineArtBuffer: Buffer | null`、`lineArtBase64: string | null`
- `src/main/ipc-handlers.ts`：`IpcHandlerDeps` 新增 `runPipeline` 回调；`IMPORT_IMAGE` handler 成功后触发管线
- `src/main/index.ts`：新增 `resolveModelPath()` 函数（区分 dev/prod 路径）；创建 pipeline orchestrator 并传入 `registerIpcHandlers`
- `scripts/dev.ts`：启动前自动构建 Workers

### 验证汇总
| 检查项 | 结果 |
|--------|------|
| `npx tsc -p tsconfig.main.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.shared.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.worker.json --noEmit` | 通过 |
| `node scripts/build-main.mjs` | 构建成功 |
| `node scripts/build-workers.mjs` | 构建成功 |
| `npx vite build` | 构建成功，1538 模块 |
| `npx tsx --test tests/unit/state-machine.test.ts` | 15/15 通过 |
| `npx tsx --test tests/unit/config-store.test.ts` | 8/8 通过 |
| `npx tsx --test tests/unit/image-import-handler.test.ts` | 8/8 通过 |
| `npx tsx --test tests/unit/inference-worker.test.ts` | 6/6 通过 |
| 源码 `require()` 检查 | 0 匹配 |

### 阶段 5 Bug 修复记录
| 问题 | 原因 | 修复 |
|------|------|------|
| Worker 测试 `Dynamic require of "node:util"` | esbuild `bundle: true` 将 CJS 依赖包裹在 `__require()` 中，与 ESM Worker 不兼容 | `build-workers.mjs` 改为 `bundle: false`，Node.js 原生处理 CJS→ESM 互操作 |

## 阶段 5 集成修复记录

以下问题在阶段 5 完成后通过实际运行发现并修复：

### Bug 1：线稿提取完成但渲染进程不显示
- **原因**：`preload/index.ts` 缺少 `onPipelineComplete` 方法，渲染进程无法接收 `pipeline-complete` 事件
- **修复**：preload 新增 `onPipelineComplete` → `env.d.ts` 新增类型 → `ImagePanel.vue` `onMounted` 注册监听，设置 `lineArtSrc`

### Bug 2：导入图片后推理管线未触发
- **原因**：Electron 沙箱模式下 `file.path` 为 `undefined`，`onFileChange` 全部走 `FileReader.readAsDataURL()` 在渲染进程读取，数据从未到达主进程
- **修复**：
  - `image-import-handler.ts`：新增 `handleImportImageFromBase64(dataUrl, ctx)` 同步函数，从 data URL 解码 Buffer 并校验格式
  - `ipc-handlers.ts`：`IMPORT_IMAGE` handler 检测输入前缀：`data:` → base64 导入，否则 → 文件路径导入
  - `ImageDropZone.vue`：`readAndEmit` 中 FileReader 完成后调用 `window.electronAPI.importImage(dataUrl)` 发送数据到主进程
  - 新增 7 个单元测试覆盖 base64 导入路径（tests 从 8→15）

### Bug 3：状态栏在提取线稿时仍显示"等待导入图片"
- **原因**：`App.vue` 中 `NOT_READY` 状态固定映射到"等待导入图片"，未区分"尚未导入"和"正在推理"
- **修复**：新增 `isPipelineRunning` ref，监听 `onPipelineProgress` 事件：progress < 100 → `isPipelineRunning = true`，`NOT_READY` 状态下显示"等待线稿提取"

### Bug 4：preload 脚本加载失败 `SyntaxError: Cannot use import statement outside a module`
- **原因**：`package.json` `"type": "module"` 导致 Electron 将 preload 的 `.js` 文件以 ESM 解析，但 preload 使用 `require('electron')`（CJS）
- **修复**：
  - `scripts/build-main.mjs`：拆分为两个独立构建，Main Process → ESM `.js`，Preload → CJS `.cjs`
  - `src/main/index.ts`：`webPreferences.preload` 路径改为 `index.cjs`，新增 `sandbox: false`

### Bug 5：切换面板后图片状态丢失
- **原因**：`ContentRouter.vue` 使用 `:key="activePanel"` 配合 `<Transition>`，切换面板时组件被销毁重建
- **修复**：包裹 `<KeepAlive>` 缓存组件实例，切换时保留 `originalSrc` / `lineArtSrc` / `hasImage`

### Bug 6：导出线稿按钮始终禁用
- **原因**：按钮 `:disabled="!hasImage"` 仅在导入后启用，但线稿可能尚未提取完成；且按钮无点击事件
- **修复**：
  - `PanelToolbar.vue`：新增 `hasLineArt` prop + `export` emit，按钮改为 `:disabled="!hasLineArt"`
  - `ImagePanel.vue`：新增 `hasLineArt` computed（`lineArtSrc !== null`） + `onExportClick` 调用 IPC
  - `ipc-handlers.ts`：实现 `export-lineart` handler（检查 buffer → 保存对话框 → `writeFile` → Toast）

### Bug 7：按钮和导航项缺少按下微交互
- **原因**：`.btn` 和 `.nav-item` 仅有 `:hover` 样式，无 `:active` 按下反馈
- **修复**：
  - `PanelToolbar.vue`：主按钮 `:active: scale(0.97)`；次按钮新增 `:hover: translateY(-1px)` + `:active: scale(0.97)`
  - `NavItem.vue`：新增 `transform` 过渡 + `:active: scale(0.92)`

### 新增测试
| 文件 | 用例 | 说明 |
|------|------|------|
| `tests/unit/inference-worker.test.ts` | 6 | Worker 启动、PNG 验证、尺寸一致、多尺寸、全黑边界、错误路径 |
| `tests/unit/image-import-handler.test.ts` | +7 | base64 导入：合法/非法/不支持格式/空数据/校验失败/不覆盖 |

### 构建系统变更
| 文件 | 变更 |
|------|------|
| `scripts/build-main.mjs` | 拆分为两个构建：Main (ESM→`.js`) + Preload (CJS→`.cjs`) |
| `scripts/build-workers.mjs` | `bundle: false`（非打包模式，保留原生 import） |
| `scripts/dev.ts` | 启动前自动构建 Workers |

## 阶段 6：路径提取 ✅ 完成

### 步骤 6.1 — 路径提取 Worker ✅
- `src/workers/path-extraction/worker.ts` 完整实现：
  - **OpenCV 依赖**：使用 `@dalongrong/opencv-wasm`（v4.8.1），通过 `createRequire` 以 CJS 模式同步加载（~75ms），本地 `.wasm` 文件无需 CDN
  - **PNG 解码**：使用 `sharp` 将 PNG Buffer 解码为 raw 灰度像素 → `cv.matFromArray()` 构建 Mat（因 `@dalongrong/opencv-wasm` 不含 `cv.imdecode`）
  - 消息协议：接收 `{ type: 'extract', lineArtBuffer }` → 发送 `{ type: 'result', paths }` 或 `{ type: 'error', message }`
  - 五步处理流程：
    1. `sharp` 解码 PNG → raw 灰度 Uint8Array → `cv.matFromArray(height, width, CV_8UC1, Array.from(grayData))`
    2. `cv.threshold(gray, binary, 128, 255, cv.THRESH_BINARY)` 二值化
    3. `cv.bitwise_not(binary, inverted)` 反转 — 线条变白色前景
    4. `cv.findContours(inverted, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_NONE)` 像素级轮廓提取
    5. 遍历每条轮廓：过滤 < 3 点 → `cv.approxPolyDP(contour, approx, 1.0, false)` 简化 → 提取 `{x, y}[]`
  - 绘制顺序优化：按首点 Y 升序，Y 相同时 X 升序
  - 无有效轮廓 → 发送 error："未检测到可绘制线条"
  - 所有 Mat 使用完毕调用 `.delete()` 释放内存

### 步骤 6.2 — Worker 管理器扩展 ✅
- `src/main/worker-manager.ts` 新增：
  - `runPathExtraction(lineArtBuffer: Buffer): Promise<{ paths: DrawPath[] }>` 方法
  - 路径提取 Worker 创建使用 `new URL('../../workers/path-extraction/worker.js', import.meta.url)`
  - 超时 60s（大图轮廓可能很多）
  - 完成后 terminate Worker
  - error / messageerror 事件兜底清理

### 步骤 6.3 — 全局路径包围盒计算 ✅
- `src/shared/geometry-utils.ts` 创建：
  - `computeBoundingBox(paths: DrawPath[]): BoundingBox` 函数
  - 遍历所有路径的所有点，找出 minX、minY、maxX、maxY
  - 返回 `{ minX, minY, width: maxX-minX, height: maxY-minY }`
  - 空数组 → 返回 `{ minX: 0, minY: 0, width: 0, height: 0 }`
- 类型 `DrawPath` 和 `BoundingBox` 从 `types.ts` 导入

### 步骤 6.4 — 管线编排器集成路径提取 ✅
- `src/main/pipeline-orchestrator.ts` 更新：
  - 推理完成后自动启动路径提取（`runPathExtraction`）
  - 调用 `computeBoundingBox(paths)` 计算包围盒
  - 存储 `paths` 和 `boundingBox` 到 AppContext
  - `pipeline-complete` 发送实际 `pathCount` 和 `boundingBox`
  - 路径提取失败 → 状态机转 ERROR → 推送 `app-error`（含针对性建议）
  - 无有效线条 → ERROR（reason: "未检测到可绘制线条"）
  - 成功 Toast 显示路径数量："线稿提取完成，共 N 条路径"
- `src/main/app-context.ts` 扩展：新增 `paths: DrawPath[] | null`、`boundingBox: BoundingBox | null`

### 新增测试文件
| 文件 | 用例 | 说明 |
|------|------|------|
| `tests/unit/geometry-utils.test.ts` | 3 | 有路径包围盒、空数组零值、多路径最小外接矩形 |
| `tests/unit/path-extraction-worker.test.ts` | 7 | 方形边框至少1轮廓、全白报错、全黑报错、≥3点、排序、坐标范围 |
| `tests/integration/pipeline-e2e.test.ts` | 5 | 完整推理+提取流程、路径点数、坐标范围、超时、无有效线条 |

### 验证汇总
| 检查项 | 结果 |
|--------|------|
| `npx tsc -p tsconfig.main.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.shared.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.worker.json --noEmit` | 通过 |
| `node scripts/build-main.mjs` | 构建成功 |
| `node scripts/build-workers.mjs` | 构建成功 |
| `npx vite build` | 构建成功，1538 模块 |
| `npx tsx --test tests/unit/geometry-utils.test.ts` | 3/3 通过 |
| `npx tsx --test tests/unit/path-extraction-worker.test.ts` | 7/7 通过（192ms/用例） |
| `npx tsx --test tests/integration/pipeline-e2e.test.ts` | 5/5 通过（madoka.jpg 实测） |
| 源码 `require()` 检查 | 0 匹配 |
| 依赖变更 | `@techstark/opencv-js` → `@dalongrong/opencv-wasm@4.8.1` |

## 阶段 7：预览叠加窗口 ✅ 完成

### 步骤 7.1 — 叠加窗口创建与销毁 ✅
- `src/main/preview-overlay.ts` 创建：
  - `createOverlay({ paths, boundingBox, lineColor, opacity }): BrowserWindow`
  - `destroyOverlay()` / `getOverlayWindow()`
  - 窗口属性：`transparent: true`、`alwaysOnTop: true`、`frame: false`、`skipTaskbar: true`、`hasShadow: false`
  - 初始大小 = boundingBox 尺寸（最小 100px），主屏幕居中
  - dev/prod URL 切换（与主窗口一致）
  - 每 500ms 定时器强制 `setAlwaysOnTop(true, 'screen-saver')` 防止被其他软件覆盖置顶
- `src/renderer/overlay/index.html`：叠加层 HTML（Canvas + 缩放标签）
- `src/renderer/overlay/main.ts`：Canvas 渲染 + 交互逻辑
- `src/preload/overlay.ts`：叠加层专用 contextBridge preload

### 步骤 7.2 — Canvas 路径渲染 ✅
- devicePixelRatio 适配、坐标映射、逐路径 lineTo 渲染
- 线宽 2px、lineCap round、lineJoin round
- 虚线边框 `[4, 4]`
- window resize → 重绘 + 更新缩放比例

### 步骤 7.3-7.5 — 交互模型演进 ✅

经历了三次迭代：

**迭代 1**：叠加窗口渲染侧监听 `keydown`/`keyup` 检测 Ctrl 按键
- 问题：窗口失焦后 keydown/keyup 不再送达，且 `setIgnoreMouseEvents(true)` 导致点击无法重新获取焦点 → 死锁

**迭代 2**：主进程注册全局快捷键 `Ctrl+Shift+F9` 切换交互/穿透模式
- 快捷键在任何窗口都能触发，解决了焦点问题
- 但 `Space` 作为键名的快捷键被系统输入法保留，改为 `Ctrl+Shift+F9`

**迭代 3（最终方案）**：进入预览默认交互模式 + 全局快捷键作为备用
- 默认：进入预览即进入交互模式（缩放手柄可见，可直接拖拽/缩放）
- `Ctrl+Shift+F9`：切换交互/穿透模式（需要操作目标软件时切穿透，之后恢复交互）
- 穿透模式：`setIgnoreMouseEvents(true)`，鼠标落到下层软件
- 交互模式：`setIgnoreMouseEvents(false)`，可拖拽移动 + 四角等比缩放 0.5x~3.0x

### 步骤 7.6 — 缩放比例同步到状态栏 ✅
- 叠加层 `sendScaleChanged` → Main `ipcMain.on` 转发 → Renderer `OVERLAY_SCALE_CHANGED`
- PREVIEWING 状态下状态栏显示当前缩放比例 "1.5x"

### 步骤 7.7 — 多显示器适配 ✅
- 初始位置：`screen.getPrimaryDisplay().workAreaSize` 居中
- `setBounds()` 支持跨屏拖拽 + 缩放

### 路径提取算法重大迭代（阶段 7 期间）

经过两次算法迭代：

**迭代 1**：`findContours(RETR_LIST, CHAIN_APPROX_NONE)` + `approxPolyDP`
- 问题 1：固定阈值 128 丢失细/淡线条
- 问题 2：epsilon=1.0 过度简化，细线条被丢弃
- 问题 3：`findContours` 追踪白色区域**外边界**，粗线变双线轮廓

**迭代 2（最终方案）**：Zhang-Suen 骨架化 + 骨架追踪
- 替换 `findContours` → 纯 TypeScript Zhang-Suen 细化算法，将线条缩减到 1px 宽中心线
- 骨架追踪：从端点出发沿骨架走，交叉点分叉，生成单线路径
- 预处理：GaussianBlur(3,3) → THRESH_OTSU 自适应阈值 → MORPH_CLOSE(2,2) 闭合断线

### 性能说明
- 路径提取在**原始图片分辨率**下进行（推理 512×512 输出 resize 回原始尺寸）
- 大图（如 4K）的 Zhang-Suen 迭代次数多，路径点密集，可在叠加层放大时看到像素级锯齿
- 绘制时坐标通过叠加窗口/包围盒比例映射，不需要原始分辨率下的每个像素

### 新增/修改文件清单
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/main/preview-overlay.ts` | 新增 | 叠加窗口生命周期 + 全局快捷键 + 置顶定时器 |
| `src/renderer/overlay/index.html` | 新增 | 叠加层 HTML 入口 |
| `src/renderer/overlay/main.ts` | 新增 | Canvas 渲染 + 交互模式切换（拖拽/缩放） |
| `src/preload/overlay.ts` | 新增 | 叠加层 contextBridge preload（`onInit`/`onSetInteractive`/`setBounds`/`sendScaleChanged`） |
| `src/workers/path-extraction/worker.ts` | 重写 | findContours → Zhang-Suen 骨架化 + 骨架追踪 |
| `src/main/index.ts` | 修改 | 导入 preview-overlay；enterPreview/exitPreview；状态机 PREVIEWING 监听 |
| `src/main/ipc-handlers.ts` | 修改 | 新增预览进入/退出 handler、叠加层 bounds/缩放转发 handler |
| `src/shared/types.ts` | 修改 | IPC_CHANNELS 新增 `OVERLAY_ENTER_PREVIEW`/`OVERLAY_EXIT_PREVIEW` |
| `src/preload/index.ts` | 修改 | 新增 `onOverlayScaleChanged`/`enterPreview`/`exitPreview` |
| `src/renderer/env.d.ts` | 修改 | `ElectronAPI` 新增 3 个方法签名 |
| `src/renderer/App.vue` | 修改 | `onMounted` 新增缩放监听 |
| `scripts/build-main.mjs` | 修改 | 新增 overlay preload CJS 构建 |
| `vite.config.ts` | 修改 | 多页面构建（main + overlay 入口） |

### 验证汇总
| 检查项 | 结果 |
|--------|------|
| `npx tsc -p tsconfig.main.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.shared.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.worker.json --noEmit` | 通过 |
| `node scripts/build-main.mjs` | 构建成功（含 overlay.cjs） |
| `node scripts/build-workers.mjs` | 构建成功 |
| `npx vite build` | 构建成功（main + overlay 双入口） |

---

---
## 阶段 8：绘制引擎 ✅ 完成

### 步骤 8.1 — nut.js Adapter 封装 ✅
- `src/main/adapters/nut-js-adapter.ts` 创建：
  - AKD 项目中**唯一**使用 `createRequire` 的 Main Process 文件
  - 从 `@nut-tree-fork/nut-js` require 出 `mouse`、`Button`
  - 重新导出为 ESM 命名导出，带类型标注
  - 文件顶部 JSDoc 标注"此文件为 CJS → ESM Adapter，是唯一使用 createRequire 的位置"

### 步骤 8.2 — 绘制引擎核心实现 ✅
- `src/main/drawing-engine.ts` 创建：
  - `createDrawingEngine(deps)` 工厂函数，接收 `stateMachine`/`configStore`/`getMainWindow`/`destroyOverlay`
  - **`start(paths, boundingBox, overlayRect)`** 方法：
    1. 验证当前状态为 PREVIEWING → 否则抛出
    2. 验证 `overlayRect` 尺寸 > 0
    3. 读取配置：`drawSpeed`（钳制 100~2000）、`mouseButton`（left→LEFT, right→RIGHT, 其他→LEFT）
    4. 计算缩放因子：`scale = max(overlayRect.width / boundingBox.width, overlayRect.height / boundingBox.height)`
    5. 状态机转 DRAWING → IPC 推送 `APP_STATE`
    6. 调用 `destroyOverlay()` 关闭叠加窗口
    7. 逐路径逐点移动鼠标：`mouse.setPosition()` → `await delay(1000/speed)` → 每步检查 `stopFlag`
    8. 路径间：抬笔 → 移动到下一条起点 → 落笔
    9. 全部完成 → 状态机转 IDLE → Toast "绘制完成"
    10. 异常 → 强制抬笔 → 状态机转 ERROR
  - **`stop()`** 方法：设置 `stopFlag = true`，下一个步进循环检测到后立即抬笔 → 转 IDLE
  - **`isActive()`** 方法：返回当前是否正在绘制
  - 导出纯函数供测试：`clampSpeed`、`toScreen`、`toButton`
  - 坐标转换公式：`screenXY = overlayRect.origin + (point - boundingBox.min) × scale`（与设计文档 §9.2 一致）
  - 步进延迟：`1000 / drawSpeed` 毫秒

### 步骤 8.3 — 集成到主进程 ✅
- `src/main/ipc-handlers.ts`：`IpcHandlerDeps` 新增 `drawingEngine: ReturnType<typeof createDrawingEngine>`
- `src/main/index.ts`：
  - 导入 `createDrawingEngine`、`getOverlayWindow`
  - 创建 `drawingEngine` 实例（传入 stateMachine/configStore/getMainWindow/destroyOverlay）
  - 传入 `registerIpcHandlers` 的 deps

### 新增测试文件
| 文件 | 用例 | 说明 |
|------|------|------|
| `tests/unit/drawing-engine.test.ts` | 13 | clampSpeed(7) + toScreen(4) + 状态校验(2) |

### 验证汇总
| 检查项 | 结果 |
|--------|------|
| `npx tsc -p tsconfig.main.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.shared.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.worker.json --noEmit` | 通过 |
| `node scripts/build-main.mjs` | 构建成功 |
| `node scripts/build-workers.mjs` | 构建成功 |
| `npx vite build` | 构建成功，1541 模块 |
| `npx tsx --test tests/unit/drawing-engine.test.ts` | 13/13 通过 |
| `createRequire` 合规（仅 adapter + 已知 Worker）| 通过 |

### 注意事项
- 绘制引擎的**实际触发**（F6 startDraw / F7 stopDraw）将在阶段 10 快捷键管理器中实现
- 当前引擎已就绪，可通过 `drawingEngine.start(paths, boundingBox, overlayRect)` 直接调用
- `overlayRect` 需在调用 `start()` 前通过 `getOverlayWindow()?.getBounds()` 捕获叠加窗口的当前屏幕位置和尺寸

---

## 阶段 9：系统托盘 ✅ 完成

### 步骤 9.1 — 系统托盘创建与管理 ✅
- `src/main/tray-manager.ts` 创建：
  - `createTrayManager(deps)` 工厂函数，接收 `getMainWindow`/`getContext`/`stateMachine`/`iconDir`/`exportLineArt`/`requestQuit`
  - 应用启动时创建 `Tray`，默认 NOT_READY 图标
  - **右键菜单**（`Menu.buildFromTemplate`）：
    - "打开主窗口" → `mainWindow.show()` + `mainWindow.focus()`
    - 分隔线
    - 状态指示项（`状态: 未就绪`/`空闲`/`预览中`/`绘制中`/`错误`，disabled 只读）
    - 分隔线
    - "导出线稿 PNG"（仅 IDLE 状态 + `lineArtBuffer` 存在时 enabled）
    - 分隔线
    - "退出" → `requestQuit()` 安全退出流程
  - **左键单击**：同"打开主窗口"
  - 监听 `stateMachine.onStateChange` → `updateTray()`：更新图标 + tooltip + 重建菜单（状态文字和导出 enabled 态联动）
  - `destroy()` 方法解除托盘
- `src/main/index.ts` 集成：
  - 新增 `resolveIconDir()`（dev: `resources/icons/tray/`，prod: `process.resourcesPath/icons/tray/`）
  - 新增 `exportLineArt()` 函数（检查 buffer → 保存对话框 → `writeFile` → Toast 通知），抽取自原 IPC handler
  - 新增 `requestQuit()` 函数：DRAWING 状态下先 `drawingEngine.stop()` 抬笔 → `app.quit()`
  - `app.whenReady()` 中创建 `trayManager` 实例
  - `app.on('quit')` 中 `trayManager.destroy()`
- `src/main/ipc-handlers.ts` 重构：
  - `IpcHandlerDeps` 新增 `exportLineArt` 回调
  - `export-lineart` handler 简化为 `await deps.exportLineArt()`，消除导出逻辑重复
- `package.json` 更新：`extraResources` 新增 `resources/icons`（打包时提取到 asar 外）

### 步骤 9.2 — 托盘状态图标 ✅
- `scripts/generate-tray-icons.ts`：使用 sharp 从 SVG 生成 5 个 32×32 PNG 图标
- `resources/icons/tray/` 目录（5 个文件）：
  - `not-ready.png` — 蓝色 `#60a5fa` 圆点 + 虚线环
  - `idle.png` — 绿色 `#34d399` 实心圆点
  - `previewing.png` — 靛蓝紫 `#6366f1` 圆点 + 外光晕（SVG feGaussianBlur）
  - `drawing.png` — 琥珀色 `#fbbf24` 实心圆点
  - `error.png` — 红色 `#f87171` 圆点 + 淡红底

### 验证汇总
| 检查项 | 结果 |
|--------|------|
| `npx tsc -p tsconfig.main.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.shared.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.worker.json --noEmit` | 通过 |
| `node scripts/build-main.mjs` | 构建成功 |
| `node scripts/build-workers.mjs` | 构建成功 |
| `npx vite build` | 构建成功，1541 模块 |
| `npx tsx --test tests/unit/state-machine.test.ts` | 15/15 通过 |
| `npx tsx --test tests/unit/config-store.test.ts` | 8/8 通过 |
| `npx tsx --test tests/unit/image-import-handler.test.ts` | 15/15 通过 |
| `npx tsx --test tests/unit/drawing-engine.test.ts` | 15/15 通过 |
| `npx tsx --test tests/unit/geometry-utils.test.ts` | 3/3 通过 |

### 注意事项
- 托盘图标在 dev 模式下从 `resources/icons/tray/` 加载，prod 模式下从 `process.resourcesPath/icons/tray/` 加载
- "导出线稿 PNG" 菜单项仅在 IDLE 状态且 `lineArtBuffer` 非空时可选
- "退出"菜单项触发 `requestQuit()`：若正在绘制（DRAWING）先停止绘制抬笔，再调用 `app.quit()`
- 托盘 `click` 事件（左键单击）在 Windows/Linux 上直接触发；macOS 上需额外处理
- `export-lineart` IPC handler 和托盘"导出线稿 PNG"菜单项共享同一个 `exportLineArt()` 函数，无重复代码
- 图标生成脚本 `scripts/generate-tray-icons.ts` 为一次性脚本，勿纳入 CI/CD

### 新增/修改文件清单
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/main/tray-manager.ts` | 新增 | 系统托盘：Tray 创建、右键菜单、状态联动 |
| `scripts/generate-tray-icons.ts` | 新增 | 一次性脚本：sharp 生成 5 个托盘图标 PNG |
| `resources/icons/tray/*.png` | 新增 | 5 个 32×32 状态图标 |
| `src/main/index.ts` | 修改 | 新增 tray 集成、exportLineArt、requestQuit |
| `src/main/ipc-handlers.ts` | 修改 | IpcHandlerDeps 新增 exportLineArt；export-lineart handler 委托 |
| `package.json` | 修改 | extraResources 新增 resources/icons |

---

## 阶段 10：快捷键管理器 ✅ 完成

### 步骤 10.1 — 快捷键管理器实现 ✅
- `src/main/shortcut-manager.ts` 创建：
  - `createShortcutManager(deps)` 工厂函数，接收 `stateMachine`/`configStore`/`getMainWindow`/`globalShortcut` + 5 个动作回调
  - 监听 `stateMachine.onStateChange` → `setImmediate(() => refresh())` 延迟重新注册
  - 各状态热键映射：
    - NOT_READY / ERROR：无热键
    - IDLE：`preview`（默认 F5）→ 进入预览
    - PREVIEWING：`preview`（退出预览）+ `startDraw`（F6）+ `toggleOverlay`（Ctrl+Shift+F9）
    - DRAWING：`stopDraw`（F7）
  - 监听 `configStore.onDidChange('hotkeys')` → 自动重新注册
  - 全回调含 `safeCallback` 状态双重校验（防竞态）
  - 注册失败 → Toast 通知"热键 [键名] 已被占用"，不抛异常、不阻塞状态流转
  - `globalShortcut` 通过 DI 注入（便于测试 mock）
  - 导出纯函数 `getHotkeysForState(state, config)` 供测试
- `src/shared/types.ts`：`AppConfig.hotkeys` 新增 `toggleOverlay: string`
- `src/main/config-store.ts`：schema 新增 `hotkeys.toggleOverlay`（默认 `'CommandOrControl+Shift+F9'`）

### 步骤 10.2 — preview-overlay.ts 重构 ✅
- 移除硬编码 `TOGGLE_SHORTCUT` 常量及 `registerOverlayShortcut`/`unregisterOverlayShortcut`
- 移除 `globalShortcut` 导入
- 新增导出 `toggleOverlayInteractive()` — 由快捷键管理器调用
- `Ctrl+Shift+F9` 改为可配置项，纳入快捷键管理器统一管理

### 步骤 10.3 — 主进程集成 ✅
- `src/main/index.ts`：
  - 导入 `createShortcutManager`、`toggleOverlayInteractive`
  - 新增 3 个函数：`previewToggle()`（IDLE→进入预览 / PREVIEWING→退出）、`startDraw()`（从 context 取 paths/boundingBox + overlay bounds → drawingEngine.start）、`stopDraw()`（drawingEngine.stop）
  - 创建 `shortcutManager` 实例，传入 `globalShortcut` 依赖
- `src/main/ipc-handlers.ts`：
  - `IpcHandlerDeps` 新增 `configStore: ConfigStore`
  - `UPDATE_SETTINGS` handler 从占位改为功能实现（写入 configStore → 快捷键管理器通过 `onDidChange` 自动响应重新注册）

### Bug 修复：预览状态下按预览键再次呼出叠加窗口
- **原因**：`exitPreview` → `transition(IDLE)` → 快捷键管理器 `state-change` 监听器同步调用 `refresh()` → `unregisterAll` + `register(F5, IDLE 回调)`。此时 F5 键仍物理按下，Electron `globalShortcut.register` 立即触发了新注册的 IDLE 回调 → `enterPreview` 再次打开叠加窗口
- **修复**：`state-change` 回调中 `refresh()` 用 `setImmediate()` 包裹，延迟到下一个事件循环 tick 执行，使当前按键事件完全处理完毕后再重新注册热键

### 新增/修改文件清单
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/main/shortcut-manager.ts` | 新增 | 快捷键管理器核心 |
| `tests/unit/shortcut-manager.test.ts` | 新增 | 13 个单元测试 |
| `src/shared/types.ts` | 修改 | AppConfig.hotkeys 新增 toggleOverlay |
| `src/main/config-store.ts` | 修改 | schema 新增 hotkeys.toggleOverlay |
| `src/main/preview-overlay.ts` | 修改 | 移除硬编码快捷键；导出 toggleOverlayInteractive |
| `src/main/index.ts` | 修改 | 集成 shortcutManager、previewToggle/startDraw/stopDraw |
| `src/main/ipc-handlers.ts` | 修改 | IpcHandlerDeps 新增 configStore；实现 UPDATE_SETTINGS |

### 验证汇总
| 检查项 | 结果 |
|--------|------|
| `npx tsc -p tsconfig.main.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.shared.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.worker.json --noEmit` | 通过 |
| `node scripts/build-main.mjs` | 构建成功 |
| `node scripts/build-workers.mjs` | 构建成功 |
| `npx vite build` | 构建成功，1541 模块 |
| `npx tsx --test tests/unit/shortcut-manager.test.ts` | 13/13 通过 |
| `npx tsx --test tests/unit/state-machine.test.ts` | 15/15 通过 |
| `npx tsx --test tests/unit/config-store.test.ts` | 8/8 通过 |
| `npx tsx --test tests/unit/image-import-handler.test.ts` | 15/15 通过 |
| `npx tsx --test tests/unit/drawing-engine.test.ts` | 15/15 通过 |
| `npx tsx --test tests/unit/geometry-utils.test.ts` | 3/3 通过 |
| **总测试数** | **69** |

### 注意事项
- `Ctrl+Shift+F9`（切换叠加层穿透模式）已从硬编码改为配置项，默认值 `CommandOrControl+Shift+F9`，与其他热键同等对待
- 快捷键管理器通过 `globalShortcut` DI 注入，测试时传入 mock 即可覆盖全部场景
- 状态变更触发的 `refresh()` 使用 `setImmediate` 延迟，防止在同一物理按键事件中重复触发（见 Bug 修复记录）
- `previewToggle` 同时处理"进入预览"和"退出预览"两种方向，根据当前状态自动判断

---

## 阶段 11：错误处理与边界情况 ✅ 完成

### 步骤 11.1 — 集中化 ERROR 状态进入逻辑 ✅
- `src/main/error-handler.ts` 创建：
  - `createErrorHandler(deps)` 工厂函数，接收 `stateMachine`/`getMainWindow`
  - `enterError(errorInfo)` 方法：
    1. 防重入检查（已在 ERROR 则跳过）
    2. `stateMachine.transition(ERROR)` → 触发 shortcut-manager 注销全部热键、触发叠加窗口销毁（PREVIEWING→非PREVIEWING 监听器）
    3. 推送 IPC `APP_ERROR` + `APP_STATE` + 错误 Toast
- `src/main/pipeline-orchestrator.ts` 重构：
  - `PipelineDeps` 新增 `enterError` 回调
  - catch 块改为调用 `enterError()` 替代内联 `transition + 3 次 IPC 推送`
- `src/main/drawing-engine.ts` 重构：
  - `DrawingEngineDeps` 新增 `enterError` 回调
  - catch 块改为调用 `deps.enterError()`（鼠标释放仍由引擎自身处理）
- `src/main/index.ts` 集成：
  - 创建 `errorHandler` 实例并传入 pipeline 和 drawingEngine 的 deps

### 步骤 11.2 — ERROR 覆盖层 UI ✅
- `src/renderer/components/ErrorOverlay.vue` 创建：
  - 绝对定位覆盖图片面板内容区，`--color-surface-100` 背景
  - `CircleX` 图标 56px（`--color-error`）+ 错误描述 14px + 建议操作 12px
  - [重试] 主按钮（32px、主色填充、`CircleDashed` 图标）：click / Enter / Space 激活
  - [打开日志目录] 次链接（12px、hover 变主色）
  - 入场动画：300ms `cubic-bezier(0.16,1,0.3,1)` fade-in + scale 0.95→1

### 步骤 11.3 — ERROR 恢复流程 ✅
- `src/main/ipc-handlers.ts` `RETRY_FROM_ERROR` handler 实现：
  1. 验证当前状态为 ERROR → 否则返回 `{ success: false }`
  2. 清空 context 中全部缓存数据（imageBuffer/imagePath/lineArtBuffer/lineArtBase64/paths/boundingBox/width/height）
  3. 状态机转 NOT_READY
  4. 推送 `APP_STATE` + info Toast "已重置，请重新导入图片"
- `src/renderer/App.vue` 更新：
  - 新增 `errorInfo` ref + `provide('appStatus'/'errorInfo')` 供子组件注入
  - `onAppStateChange` 中非 ERROR 状态自动清除 `errorInfo`
  - `onMounted` 中注册 `onAppError` IPC 监听器
- `src/renderer/components/ImagePanel.vue` 更新：
  - 注入 `appStatus` 和 `errorInfo`
  - ERROR 状态 + errorInfo 存在时渲染 `ErrorOverlay` 替代正常内容
  - `onRetry` 调用 `window.electronAPI.retryFromError()`

### 步骤 11.4 — 应用退出保护 ✅
- `src/main/index.ts` 更新：
  - **单实例锁**：`app.requestSingleInstanceLock()` → 获取失败则 `app.quit()`
  - **`second-instance` 事件**：激活已有主窗口（restore/show/focus）
  - **`before-quit` 事件**：DRAWING 状态下 `event.preventDefault()` → `drawingEngine.stop()` 抬笔 → 2s 后 `app.quit()`
  - **`quit` 事件**：新增 `shortcutManager.destroy()` 清理

### 新增/修改文件清单
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/main/error-handler.ts` | 新增 | 集中化 ERROR 状态进入逻辑 |
| `src/renderer/components/ErrorOverlay.vue` | 新增 | ERROR 覆盖层 UI 组件 |
| `src/main/pipeline-orchestrator.ts` | 修改 | catch 块委托 enterError() |
| `src/main/drawing-engine.ts` | 修改 | DrawingEngineDeps 新增 enterError；catch 块委托 |
| `src/main/ipc-handlers.ts` | 修改 | 实现 RETRY_FROM_ERROR handler |
| `src/main/index.ts` | 修改 | 集成 errorHandler；单实例锁；before-quit；shortcutManager.destroy |
| `src/renderer/App.vue` | 修改 | errorInfo 状态管理；provide/inject；onAppError 监听 |
| `src/renderer/components/ImagePanel.vue` | 修改 | 注入状态；ERROR 时渲染 ErrorOverlay |

### 验证汇总
| 检查项 | 结果 |
|--------|------|
| `npx tsc -p tsconfig.main.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.shared.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.worker.json --noEmit` | 通过 |
| `node scripts/build-main.mjs` | 构建成功 |
| `node scripts/build-workers.mjs` | 构建成功 |
| `npx vite build` | 构建成功，1544 模块 |
| `npx tsx --test tests/unit/state-machine.test.ts` | 15/15 通过 |
| `npx tsx --test tests/unit/config-store.test.ts` | 8/8 通过 |
| `npx tsx --test tests/unit/image-import-handler.test.ts` | 15/15 通过 |
| `npx tsx --test tests/unit/drawing-engine.test.ts` | 15/15 通过 |
| `npx tsx --test tests/unit/shortcut-manager.test.ts` | 13/13 通过 |
| `npx tsx --test tests/unit/geometry-utils.test.ts` | 3/3 通过 |
| **总测试数** | **69** |

### 阶段 11 Bug 修复记录
| 问题 | 原因 | 修复 |
|------|------|------|
| ERROR 状态栏正确但 ErrorOverlay 不渲染 | Vue `provide`/`inject` 通过 `<KeepAlive>` 传递 Ref 时模板绑定不稳定 | 改为标准 props 传递：App → ContentRouter(新增透传props) → ImagePanel(defineProps)，移除 inject |
| 点击重试后图片面板未重置为空拖拽区 | 主进程清空了 Buffer/paths，但 ImagePanel 前端的 hasImage/originalSrc/lineArtSrc 未同步清除 | ImagePanel 添加 `watch(props.appStatus)` 检测 ERROR→NOT_READY 时自动重置 4 个前端状态 |

### 注意事项
- ERROR 进入时，以下副作用自动由各模块的 state-change 监听器触发，`error-handler.ts` 无需重复处理：
  - 热键注销 → `shortcut-manager.ts` 监听 `state-change → ERROR → refresh() → unregisterAll`
  - 叠加窗口销毁 → `index.ts` 监听 `PREVIEWING→non-PREVIEWING → destroyOverlay()`
  - 绘制停止 → `drawing-engine.ts` 在调用 `enterError` 前自行释放鼠标
- Workers 无全局注册表，每个 `runInference`/`runPathExtraction` 在结果/错误/超时时自行 `terminate()`，无僵尸线程风险
- `enterError()` 含防重入保护：已在 ERROR 状态时跳过，避免重复推送 IPC
- `RETRY_FROM_ERROR` 清空所有运行时缓存后转 NOT_READY，用户需重新导入图片
- 单实例锁在 `app.whenReady()` 之前执行，第二个实例立即退出
- `before-quit` 中 DRAWING 状态会先抬笔延迟 2s 再退出
- **ErrorOverlay 状态传递必须使用 props 而非 provide/inject**：KeepAlive 缓存组件中 inject 的 Ref 模板绑定存在响应性边界情况，标准 props 透传链路可靠

---

## 阶段 12：设置面板 + 主题系统 + 首次启动提示 ✅ 完成

### 步骤 12.1 — SliderControl 通用组件 ✅
- `src/renderer/components/SliderControl.vue` 创建：
  - Props：`label`、`modelValue`（number）、`min`、`max`、`step`、`unit`
  - 自定义样式 range 滑块：轨道 4px + 渐变填充 + 13px 圆形滑块（拖动放大至 18px）
  - 右侧等宽字体数值显示（含单位）
  - v-model 双向绑定

### 步骤 12.2 — 快捷键设置 UI ✅
- `src/renderer/components/HotkeyRow.vue`：单行快捷键（键帽样式 + 修改按钮 + 恢复默认）
- `src/renderer/components/HotkeyCapture.vue`：全屏遮罩按键捕获弹窗（组合键捕获，Esc 取消，Enter 确认）
- `src/renderer/components/HotkeySettings.vue`：4 行快捷键配置（预览/开始绘制/停止绘制/预览穿透）

### 步骤 12.3 — 设置面板完整组装 ✅
- `src/renderer/components/SettingsPanel.vue` 从占位重写为完整设置页：
  - 卡片 1：快捷键设置（HotkeySettings）
  - 卡片 2：绘制参数（速度滑块 100~2000 / 鼠标左右键 / 透明度 0.3~0.8 / 线条颜色）
  - 卡片 3：关于（版本号 + 技术栈 + 引擎说明）
  - 所有修改通过 `updateSettings` IPC 即时持久化
- 新增 `GET_SETTINGS` IPC 通道（types.ts → ipc-handlers.ts → preload → env.d.ts）

### 步骤 12.4 — 主题系统（深色/浅色切换） ✅
- `App.vue`：`theme` ref 驱动动态 `:data-theme` 绑定 + `toggleTheme()` 方法
- `SideNav.vue`：移除"关于"按钮，原位置添加主题切换（Moon/Sun 图标 + "深色"/"浅色"文字标识）
- `tokens.css`：浅色主题全套 WCAG 适配配色（主色微调至白底对比度 4.7:1、语义色加深、表面色阶精准 9 阶）
- 新增 4 级阴影 Token：`--shadow-card` / `--shadow-modal` / `--shadow-dropdown` / `--shadow-button-hover`（深色主题为 `none`）
- 阴影已应用到：设置卡片、弹窗、Toast、主按钮 hover 态

### 步骤 12.5 — 叠加层设置实时同步 ✅
- `index.ts`：`configStore.onDidChange` 监听 `overlayOpacity` → `setOpacity()` / `overlayLineColor` → IPC 推送
- `overlay.ts` preload：新增 `onLineColorChange` 监听
- `overlay/main.ts`：接收新颜色 → 更新 `lineColor` 变量 → `render()` 重绘
- 用户修改透明度或线条颜色后，已打开的预览窗口即时响应，无需重新呼出

### 步骤 12.6 — 首次启动快捷键提示 ✅
- `src/renderer/components/FirstRunTips.vue`：全屏毛玻璃遮罩 + 居中卡片，显示 4 个快捷键键帽 + 功能描述
- `config-store.ts`：新增 `hasSeenShortcutTips: boolean`（默认 `false`）
- `App.vue`：`onMounted` 检查标志 → 未看过则显示 → 点击"知道了"持久化
- 快捷键值从实际配置读取（非硬编码默认值）

### 主题切换 Bug 修复
| 问题 | 原因 | 修复 |
|------|------|------|
| 浅色主题下图片面板背景不切换 | `ImagePanel.vue` 的 `.image-panel__content` 无显式背景 | 添加 `background: var(--color-surface-0)` |
| 浅色主题下设置面板背景仍为深色 | `SettingsPanel.vue` 无显式背景 | 添加 `background: var(--color-surface-0)` |
| 切换面板时背景闪烁深色 | `ContentRouter.vue` 在 Transition 间隙无背景 | 添加 `background: var(--color-surface-0)` |

### 新增/修改文件清单
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/shared/types.ts` | 修改 | IPC_CHANNELS 新增 `GET_SETTINGS`；AppConfig 新增 `hasSeenShortcutTips` |
| `src/main/ipc-handlers.ts` | 修改 | 新增 `GET_SETTINGS` handler |
| `src/main/config-store.ts` | 修改 | schema 新增 `hasSeenShortcutTips` |
| `src/preload/index.ts` | 修改 | 新增 `getSettings()` |
| `src/preload/overlay.ts` | 修改 | 新增 `onLineColorChange()` |
| `src/renderer/env.d.ts` | 修改 | ElectronAPI 新增 `getSettings()` |
| `src/renderer/App.vue` | 修改 | 动态主题 + FirstRunTips 集成 |
| `src/renderer/components/FirstRunTips.vue` | 新增 | 首次启动快捷键提示 |
| `src/renderer/components/SliderControl.vue` | 新增 | 通用滑块组件 |
| `src/renderer/components/HotkeyCapture.vue` | 新增 | 按键捕获弹窗 |
| `src/renderer/components/HotkeyRow.vue` | 新增 | 快捷键行 |
| `src/renderer/components/HotkeySettings.vue` | 新增 | 快捷键设置区（4 行） |
| `src/renderer/components/SettingsPanel.vue` | 重写 | 完整设置面板（3 卡片） |
| `src/renderer/components/SideNav.vue` | 修改 | 移除关于按钮 → 添加主题切换 |
| `src/renderer/components/ContentRouter.vue` | 修改 | 添加显式背景 |
| `src/renderer/components/ImagePanel.vue` | 修改 | 添加显式背景 |
| `src/renderer/components/ToastItem.vue` | 修改 | 添加 `--shadow-dropdown` |
| `src/renderer/components/PanelToolbar.vue` | 修改 | hover 添加 `--shadow-button-hover` |
| `src/renderer/components/ErrorOverlay.vue` | 修改 | hover 添加 `--shadow-button-hover` |
| `src/renderer/styles/tokens.css` | 修改 | 浅色主题 WCAG 配色 + 阴影 Token |
| `src/renderer/overlay/main.ts` | 修改 | 监听 `onLineColorChange` 重绘 |
| `src/main/index.ts` | 修改 | 叠加层设置实时同步监听器 |

### 验证汇总
| 检查项 | 结果 |
|--------|------|
| `npx tsc -p tsconfig.main.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.shared.json --noEmit` | 通过 |
| `npx tsc -p tsconfig.worker.json --noEmit` | 通过 |
| `node scripts/build-main.mjs` | 构建成功 |
| `node scripts/build-workers.mjs` | 构建成功 |
| `npx vite build` | 构建成功，1560 模块 |
| `npx tsx --test tests/unit/state-machine.test.ts` | 15/15 通过 |
| `npx tsx --test tests/unit/config-store.test.ts` | 8/8 通过 |
| `npx tsx --test tests/unit/shortcut-manager.test.ts` | 13/13 通过 |
| `npx tsx --test tests/unit/drawing-engine.test.ts` | 15/15 通过 |
| `npx tsx --test tests/unit/image-import-handler.test.ts` | 15/15 通过 |
| `npx tsx --test tests/unit/geometry-utils.test.ts` | 3/3 通过 |
| **总测试数** | **69** |

### 注意事项
- 浅色主题阴影 Token 在 `:root` 中设为 `none`，仅在 `[data-theme="light"]` 中赋值。深色主题下阴影不可见，但 token 仍可安全使用
- `hasSeenShortcutTips` 标记持久化到 `config.json`。重置配置后首次启动提示会重新出现
- 叠加层设置实时同步通过 `configStore.onDidChange` 实现，与快捷键管理器的配置监听模式一致
- 面板背景必须在 ContentRouter / ImagePanel / SettingsPanel 三个层级各自显式设置，依赖 body 继承在 Transition 动画期间不可靠
- toggleOverlay 快捷键已在设置面板中显示，中文名为"预览/穿透"，默认值 `Ctrl+Shift+F9`

---

## 下一步：阶段 13 — 导出线稿

---

## 给后续开发者的备注

1. **preload 是关键桥接层**：新增 IPC 监听器需同步修改 3 个文件（preload/index.ts → env.d.ts → 消费组件）
2. **Electron 沙箱**：`sandbox: false` 已关闭
3. **preload 构建**：必须输出 `.cjs` 扩展名，否则 `"type": "module"` 导致 Electron 以 ESM 解析失败
4. **Worker 构建**：`bundle: false` 避免 CJS 依赖被包裹在 `__require()` 中
5. **Main Process 改动需重启**：`scripts/dev.ts` 已自动构建 Main+Workers
6. **KeepAlive** 已在 `ContentRouter` 中使用
7. **路径提取 Worker** 使用 `@dalongrong/opencv-wasm`，通过 `createRequire` CJS 桥接
8. **OpenCV Mat 内存管理**：每个 `cv.Mat` 使用完毕后必须调用 `.delete()`
9. **路径提取算法**：Zhang-Suen 骨架化（纯 TS）→ 骨架追踪，生成单线中心线路径
10. **叠加层有独立 preload**：`src/preload/overlay.ts` → `dist/main/preload/overlay.cjs`
11. **叠加层交互**：默认进入即交互模式（可拖拽/缩放），`Ctrl+Shift+F9` 切换穿透模式
12. **叠加层置顶**：500ms 定时器强制 `setAlwaysOnTop(true, 'screen-saver')`，防止被其他软件覆盖
13. **快捷键管理器 `setImmediate` 延迟**：状态变更触发的热键重注册使用 `setImmediate` 延迟，避免在同一物理按键事件中同步重注册导致重复触发（典型案例：PREVIEWING 下按 F5 → exitPreview → IDLE → 立即 register F5 被按键再次触发 → enterPreview）
14. **`globalShortcut` DI 注入**：`shortcut-manager.ts` 通过 `ShortcutManagerDeps.globalShortcut` 接收 Electron 全局快捷键 API，测试时传入 mock 即可覆盖全部场景
15. **快捷键回调双重校验**：所有热键回调通过 `safeCallback(expectedState, cb)` 包装，执行前二次验证 `stateMachine.getState() === expectedState`，防止竞态
16. **路径提取分辨率**：在原始图片尺寸下进行，大图需注意性能；叠加层 Canvas 坐标映射会缩放，不依赖原始分辨率
15. **nut.js Adapter**：`src/main/adapters/nut-js-adapter.ts` 是 Main Process 中唯一使用 `createRequire` 的位置，其他文件通过 ESM import 从此 adapter 导入
16. **绘制引擎不直接操作窗口**：`start()` 接收 `overlayRect`（由调用方在调用前通过 `getOverlayWindow()?.getBounds()` 捕获），引擎本身不依赖叠加窗口引用
17. **绘制参数校验内置于引擎**：`drawSpeed` 钳制 100~2000、`mouseButton` 回退 left、`overlayRect` 尺寸校验，调用方无需预处理
18. **stopFlag 机制**：`stop()` 设置标志位后，引擎在当前步进循环的下一个点检测到后立即抬笔，不等待当前路径完成
19. **托盘 `Tray`**：`src/main/tray-manager.ts` 负责托盘生命周期。左键单击打开主窗口。右键菜单根据状态机动态更新（点击"退出"前若 DRAWING 状态会先抬笔）
20. **导出线稿统一入口**：`exportLineArt()` 在 `src/main/index.ts` 中定义，同时供 IPC handler 和托盘菜单使用，无代码重复

### 阶段 6 关键 Bug：OpenCV 包不兼容

| 问题 | 原因 | 修复 |
|------|------|------|
| `@techstark/opencv-js` 在 Worker 中永久超时 | Emscripten WASM 在 `worker_threads` 中 `onRuntimeInitialized` 永不触发 | 替换为 `@dalongrong/opencv-wasm@4.8.1` |
| `cv.imdecode` 不可用 | opencv-wasm 不含 `imgcodecs` 模块 | `sharp` 解码 PNG → `cv.matFromArray()` |
