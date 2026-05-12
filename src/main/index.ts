import { app, BrowserWindow, session, dialog, globalShortcut } from 'electron'
import { join, dirname } from 'node:path'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createAppContext } from './app-context.js'
import type { AppContext } from './app-context.js'
import { registerIpcHandlers } from './ipc-handlers.js'
import { createPipelineOrchestrator } from './pipeline-orchestrator.js'
import { createOverlay, destroyOverlay, getOverlayWindow, toggleOverlayInteractive } from './preview-overlay.js'
import { createDrawingEngine } from './drawing-engine.js'
import { createTrayManager } from './tray-manager.js'
import { createShortcutManager } from './shortcut-manager.js'
import { createErrorHandler } from './error-handler.js'
import { StatusState, IPC_CHANNELS } from '../shared/types.js'
import type { ToastMessage } from '../shared/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const gotInstanceLock = app.requestSingleInstanceLock()

if (!gotInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (ctx?.mainWindow) {
      if (ctx.mainWindow.isMinimized()) ctx.mainWindow.restore()
      ctx.mainWindow.show()
      ctx.mainWindow.focus()
    }
  })
}

let ctx: AppContext

function resolveModelPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'models', 'anime2sketch.onnx')
  }
  return join(__dirname, '..', '..', 'resources', 'models', 'anime2sketch.onnx')
}

function resolveIconDir(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'icons', 'tray')
  }
  return join(__dirname, '..', '..', '..', 'resources', 'icons', 'tray')
}

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 720,
    minHeight: 480,
    frame: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: false,
    },
  })

  session.defaultSession.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' data:",
          ],
        },
      })
    },
  )

  win.on('ready-to-show', () => {
    win.show()
  })

  if (app.isPackaged) {
    win.loadFile(join(__dirname, '../../dist/renderer/index.html'))
  } else {
    win.loadURL(process.env['VITE_DEV_SERVER_URL'] ?? 'http://localhost:5173')
  }

  return win
}

app.whenReady().then(() => {
  ctx = createAppContext()
  const win = createMainWindow()
  ctx.mainWindow = win

  const errorHandler = createErrorHandler({
    stateMachine: ctx.stateMachine,
    getMainWindow: () => ctx.mainWindow,
  })

  const pipeline = createPipelineOrchestrator({
    modelPath: resolveModelPath(),
    getContext: () => ctx,
    getMainWindow: () => ctx.mainWindow,
    stateMachine: ctx.stateMachine,
    enterError: errorHandler.enterError,
  })

  function enterPreview(): void {
    const state = ctx.stateMachine.getState()
    if (state !== StatusState.IDLE) return

    const paths = ctx.paths
    const boundingBox = ctx.boundingBox
    if (!paths || !boundingBox || paths.length === 0) return

    ctx.stateMachine.transition(StatusState.PREVIEWING)
    win.webContents.send('app-state', StatusState.PREVIEWING)

    const config = ctx.configStore.getAll()
    createOverlay({
      paths,
      boundingBox,
      lineColor: config.overlayLineColor,
      opacity: config.overlayOpacity,
    })
  }

  function exitPreview(): void {
    const state = ctx.stateMachine.getState()
    if (state !== StatusState.PREVIEWING) return

    destroyOverlay()
    ctx.stateMachine.transition(StatusState.IDLE)
    win.webContents.send('app-state', StatusState.IDLE)
  }

  // 状态机监听器：非预览状态退出时销毁叠加窗口
  ctx.stateMachine.onStateChange(({ from, to }) => {
    if (from === StatusState.PREVIEWING && to !== StatusState.PREVIEWING) {
      destroyOverlay()
    }
  })

  const drawingEngine = createDrawingEngine({
    stateMachine: ctx.stateMachine,
    configStore: ctx.configStore,
    getMainWindow: () => ctx.mainWindow,
    destroyOverlay,
    enterError: errorHandler.enterError,
  })

  function previewToggle(): void {
    const state = ctx.stateMachine.getState()
    if (state === StatusState.IDLE) {
      enterPreview()
    } else if (state === StatusState.PREVIEWING) {
      exitPreview()
    }
  }

  function startDraw(): void {
    const state = ctx.stateMachine.getState()
    if (state !== StatusState.PREVIEWING) return

    const paths = ctx.paths
    const boundingBox = ctx.boundingBox
    if (!paths || !boundingBox) return

    const overlay = getOverlayWindow()
    if (!overlay || overlay.isDestroyed()) return

    const bounds = overlay.getBounds()
    drawingEngine.start(paths, boundingBox, {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    })
  }

  function stopDraw(): void {
    if (ctx.stateMachine.getState() !== StatusState.DRAWING) return
    drawingEngine.stop()
  }

  const shortcutManager = createShortcutManager({
    stateMachine: ctx.stateMachine,
    configStore: ctx.configStore,
    getMainWindow: () => ctx.mainWindow,
    onPreviewToggle: previewToggle,
    onStartDraw: startDraw,
    onStopDraw: stopDraw,
    onToggleOverlay: toggleOverlayInteractive,
    globalShortcut,
  })

  async function exportLineArt(): Promise<void> {
    const lineArtBuffer = ctx.lineArtBuffer
    if (!lineArtBuffer) {
      win.webContents.send(IPC_CHANNELS.SHOW_TOAST, {
        type: 'warning',
        message: '无线稿可导出',
      } satisfies ToastMessage)
      return
    }

    const result = await dialog.showSaveDialog(win, {
      defaultPath: 'lineart.png',
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
    })

    if (result.canceled || !result.filePath) return

    try {
      await writeFile(result.filePath, lineArtBuffer)
      win.webContents.send(IPC_CHANNELS.SHOW_TOAST, {
        type: 'success',
        message: '线稿已导出',
      } satisfies ToastMessage)
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存失败'
      win.webContents.send(IPC_CHANNELS.SHOW_TOAST, {
        type: 'error',
        message: `导出失败: ${message}`,
      } satisfies ToastMessage)
    }
  }

  function requestQuit(): void {
    if (ctx.stateMachine.getState() === StatusState.DRAWING) {
      drawingEngine.stop()
    }
    app.quit()
  }

  registerIpcHandlers({
    getState: () => ctx.stateMachine.getState(),
    getMainWindow: () => ctx.mainWindow,
    getContext: () => ctx,
    runPipeline: (buffer: Buffer) => pipeline.run(buffer),
    enterPreview,
    exitPreview,
    drawingEngine,
    exportLineArt,
    configStore: ctx.configStore,
  })

  const trayManager = createTrayManager({
    getMainWindow: () => ctx.mainWindow,
    getContext: () => ctx,
    stateMachine: ctx.stateMachine,
    iconDir: resolveIconDir(),
    exportLineArt,
    requestQuit,
  })

  app.on('quit', () => {
    trayManager.destroy()
    shortcutManager.destroy()
  })

  app.on('before-quit', (event) => {
    if (ctx.stateMachine.getState() === StatusState.DRAWING) {
      event.preventDefault()
      drawingEngine.stop()
      setTimeout(() => app.quit(), 2000)
    }
  })
})

app.on('window-all-closed', () => {
  // 不退出 — 保留系统托盘
})
