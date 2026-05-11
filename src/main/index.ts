import { app, BrowserWindow, session } from 'electron'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createAppContext } from './app-context.js'
import type { AppContext } from './app-context.js'
import { registerIpcHandlers } from './ipc-handlers.js'
import { createPipelineOrchestrator } from './pipeline-orchestrator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let ctx: AppContext

function resolveModelPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'models', 'anime2sketch.onnx')
  }
  return join(__dirname, '..', '..', 'resources', 'models', 'anime2sketch.onnx')
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

  const pipeline = createPipelineOrchestrator({
    modelPath: resolveModelPath(),
    getContext: () => ctx,
    getMainWindow: () => ctx.mainWindow,
    stateMachine: ctx.stateMachine,
  })

  registerIpcHandlers({
    getState: () => ctx.stateMachine.getState(),
    getMainWindow: () => ctx.mainWindow,
    getContext: () => ctx,
    runPipeline: (buffer: Buffer) => pipeline.run(buffer),
  })
})

app.on('window-all-closed', () => {
  // 不退出 — 保留系统托盘
})
