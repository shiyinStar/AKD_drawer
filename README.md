# AKD — 自动线稿绘制工具

AKD 是一款基于 Electron 的桌面自动绘图工具。用户导入动漫/插画风格图片后，软件通过 ONNX 深度学习模型提取线稿，再利用 OpenCV 将线稿转换为可绘制路径，最终通过模拟鼠标操作在 Photoshop、SAI、Clip Studio 等绘图软件中自动绘制出线稿。

## 核心流程

```
导入图片 → ONNX 推理提取线稿 → OpenCV 骨架化 + 路径提取
→ 透明叠加窗口预览 → 鼠标模拟自动绘制
```

## 技术栈

| 层 | 技术 |
|---|------|
| 桌面框架 | Electron 42 |
| 前端 | Vue 3 + Vite + TypeScript |
| AI 推理 | ONNX Runtime (anime2sketch 模型) |
| 路径提取 | OpenCV WASM + Zhang-Suen 骨架化算法 |
| 鼠标模拟 | nut-js (跨平台鼠标控制) |
| 图像处理 | sharp |
| 配置存储 | electron-store |
| 构建 | esbuild + electron-builder |
| UI 图标 | lucide-vue-next |
| 字体 | Inter + JetBrains Mono (自托管) |

## 快速开始

### 环境要求

- Node.js >= 20
- Windows / macOS / Linux

### 安装与运行

```bash
# 安装依赖
npm install

# 开发模式启动
npm run dev

# 生产构建
npm run build

# 打包为安装程序
npx electron-builder
```

### 模型文件

推理模型 `anime2sketch.onnx` 需放置在 `resources/models/` 目录下。

## 项目结构

```
AKD_final/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts           # 入口：窗口创建、应用生命周期
│   │   ├── state-machine.ts   # 五状态流转引擎
│   │   ├── config-store.ts    # 配置持久化 (electron-store)
│   │   ├── ipc-handlers.ts    # IPC 通信层
│   │   ├── pipeline-orchestrator.ts  # 推理+路径提取管线
│   │   ├── worker-manager.ts        # Worker 线程管理
│   │   ├── preview-overlay.ts       # 透明叠加窗口
│   │   ├── drawing-engine.ts        # 鼠标模拟绘制引擎
│   │   ├── shortcut-manager.ts      # 全局快捷键管理
│   │   ├── tray-manager.ts          # 系统托盘
│   │   ├── error-handler.ts         # 集中化错误处理
│   │   └── adapters/               # CJS→ESM 桥接层
│   ├── preload/            # contextBridge 预加载脚本
│   ├── renderer/           # Vue 3 渲染进程
│   │   ├── components/         # UI 组件 (20+ 组件)
│   │   ├── styles/             # CSS Token + 主题系统
│   │   └── overlay/            # 叠加窗口独立页面
│   ├── shared/             # 跨层共享类型
│   └── workers/            # Worker 线程
│       ├── inference/          # ONNX 推理 Worker
│       └── path-extraction/    # OpenCV 路径提取 Worker
├── scripts/                # 构建与开发脚本
├── resources/              # 模型、图标等静态资源
├── tests/                  # 单元测试 + 集成测试 (69 个用例)
└── memory-bank/            # 设计文档与架构说明
```

## 状态机

AKD 使用五状态流转引擎管理整个应用生命周期：

```
NOT_READY → IDLE → PREVIEWING → DRAWING → IDLE
    ↑         ↓         ↓           ↓
    └─────── ERROR ←────┴───────────┘
```

| 状态 | 说明 | 可用操作 |
|------|------|---------|
| NOT_READY | 等待导入图片 | 导入图片 |
| IDLE | 线稿就绪，等待预览 | 进入预览 (F5)、导出线稿 |
| PREVIEWING | 叠加窗口显示中 | 开始绘制 (F6)、退出预览、切换穿透 |
| DRAWING | 正在自动绘制 | 停止绘制 (F7) |
| ERROR | 发生错误 | 重试、打开日志 |

## 快捷键

| 快捷键 | 功能 | 可用状态 |
|--------|------|---------|
| F5 | 进入/退出预览 | IDLE / PREVIEWING |
| F6 | 开始绘制 | PREVIEWING |
| F7 | 停止绘制 | DRAWING |
| Ctrl+Shift+F9 | 切换叠加层穿透模式 | PREVIEWING |

所有快捷键可在设置面板中自定义。

## 设置项

| 设置 | 默认值 | 范围 |
|------|--------|------|
| 绘制速度 | 500 px/s | 100 ~ 2000 |
| 鼠标按键 | 左键 | 左键 / 右键 |
| 叠加层透明度 | 0.6 | 0.3 ~ 0.8 |
| 线条颜色 | #000000 | 任意颜色 |

## 测试

```bash
# 运行单元测试 (69 个用例)
npx tsx --test tests/unit/*.test.ts

# 运行集成测试
npx tsx --test tests/integration/*.test.ts
```

## 构建与打包

```bash
# 构建所有模块
node scripts/build-main.mjs      # Main Process + Preload
node scripts/build-workers.mjs   # Workers
npx vite build                   # Renderer

# 打包为桌面应用
npx electron-builder             # 完整打包 (NSIS/DMG/AppImage)
npx electron-builder --dir       # 仅解包目录 (调试用)
```

打包产物位于 `release/` 目录。

## 架构特点

- **100% ESM**：全项目使用 ES Module，零 CommonJS（除必要的 CJS 桥接层）
- **依赖注入**：核心模块通过工厂函数 + 接口注入依赖，避免循环依赖
- **Worker 线程隔离**：推理和路径提取在独立 Worker 中运行，不阻塞主进程
- **深色/浅色主题**：完整双主题支持，CSS 自定义属性驱动
- **DPI 感知**：正确处理高 DPI 显示器下的坐标转换
