# AKD 开发进度

**最后更新**: 2026-05-11 (阶段 4 完成)

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

## 下一步：阶段 5 — 推理管线

---

## 给后续开发者的备注

1. Main Process、Preload、Renderer 入口已实现，Worker 文件仍为占位注释
2. Node.js v24 内置 TS strip 模式不支持 enum 语法，需经 esbuild/tsx 编译后使用
3. 项目遵循 100% ESM，禁止 CommonJS（nut-js 有唯一的 CJS Adapter）
4. `@techstark/opencv-js` 实际版本号是 `4.12.0-release.1`，非 `^4.12.0`
