# AKD 开发进度

**最后更新**: 2026-05-12 (阶段 7 完成)

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

## 下一步：阶段 8 — 绘制引擎

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
13. **⚠ 阶段 10 提醒**：`Ctrl+Shift+F9`（切换穿透）需要在阶段 10 快捷键管理器中实现为可配置项，与其他快捷键（F5/F6/F7）同等对待
14. **路径提取分辨率**：在原始图片尺寸下进行，大图需注意性能；叠加层 Canvas 坐标映射会缩放，不依赖原始分辨率

### 阶段 6 关键 Bug：OpenCV 包不兼容

| 问题 | 原因 | 修复 |
|------|------|------|
| `@techstark/opencv-js` 在 Worker 中永久超时 | Emscripten WASM 在 `worker_threads` 中 `onRuntimeInitialized` 永不触发 | 替换为 `@dalongrong/opencv-wasm@4.8.1` |
| `cv.imdecode` 不可用 | opencv-wasm 不含 `imgcodecs` 模块 | `sharp` 解码 PNG → `cv.matFromArray()` |
