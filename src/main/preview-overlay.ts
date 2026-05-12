import { BrowserWindow, screen, app, globalShortcut } from 'electron'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { DrawPath, BoundingBox } from '../shared/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let overlayWindow: BrowserWindow | null = null
let overlayInteractive = false
let topTimer: ReturnType<typeof setInterval> | null = null

const TOGGLE_SHORTCUT = 'CommandOrControl+Shift+F9'

interface OverlayOptions {
  paths: DrawPath[]
  boundingBox: BoundingBox
  lineColor: string
  opacity: number
}

export function createOverlay(opts: OverlayOptions): BrowserWindow {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    destroyOverlay()
  }

  const { paths, boundingBox, lineColor, opacity } = opts

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenW, height: screenH } = primaryDisplay.workAreaSize

  const winW = Math.max(boundingBox.width, 100)
  const winH = Math.max(boundingBox.height, 100)
  const winX = Math.round(screenW / 2 - winW / 2)
  const winY = Math.round(screenH / 2 - winH / 2)

  overlayWindow = new BrowserWindow({
    x: winX,
    y: winY,
    width: winW,
    height: winH,
    transparent: true,
    alwaysOnTop: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    opacity,
    webPreferences: {
      preload: join(__dirname, '../preload/overlay.cjs'),
      sandbox: false,
    },
  })

  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  overlayInteractive = false

  if (app.isPackaged) {
    const overlayHtmlPath = join(__dirname, '../../dist/renderer/overlay/index.html')
    overlayWindow.loadFile(overlayHtmlPath)
  } else {
    const devUrl = process.env['VITE_DEV_SERVER_URL'] ?? 'http://localhost:5173'
    overlayWindow.loadURL(`${devUrl}/overlay/index.html`)
  }

  overlayWindow.webContents.on('did-finish-load', () => {
    overlayWindow?.webContents.send('overlay-init', {
      paths,
      boundingBox,
      lineColor,
    })
    // 默认进入交互模式（可直接拖拽），快捷键作为备用
    setOverlayInteractive(true)
  })

  // 每 500ms 重新置顶，防止被其他软件的 alwaysOnTop 覆盖
  topTimer = setInterval(() => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.setAlwaysOnTop(true, 'screen-saver')
    }
  }, 500)

  overlayWindow.on('closed', () => {
    unregisterOverlayShortcut()
    if (topTimer) {
      clearInterval(topTimer)
      topTimer = null
    }
    overlayWindow = null
  })

  registerOverlayShortcut()

  return overlayWindow
}

export function destroyOverlay(): void {
  unregisterOverlayShortcut()
  if (topTimer) {
    clearInterval(topTimer)
    topTimer = null
  }
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.destroy()
    overlayWindow = null
  }
}

export function getOverlayWindow(): BrowserWindow | null {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    return overlayWindow
  }
  return null
}

function setOverlayInteractive(active: boolean): void {
  overlayInteractive = active
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setIgnoreMouseEvents(!active, { forward: true })
    overlayWindow.webContents.send('overlay-set-interactive', active)
  }
}

function registerOverlayShortcut(): void {
  try {
    const registered = globalShortcut.register(TOGGLE_SHORTCUT, () => {
      setOverlayInteractive(!overlayInteractive)
    })
    if (!registered) {
      console.warn(`[AKD] 全局快捷键 ${TOGGLE_SHORTCUT} 注册失败（可能被占用）`)
    }
  } catch (err) {
    console.warn(`[AKD] 全局快捷键 ${TOGGLE_SHORTCUT} 注册异常:`, err)
  }
}

function unregisterOverlayShortcut(): void {
  globalShortcut.unregister(TOGGLE_SHORTCUT)
}
