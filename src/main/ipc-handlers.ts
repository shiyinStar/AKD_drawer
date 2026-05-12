import { ipcMain, BrowserWindow, dialog } from 'electron'
import { IPC_CHANNELS, StatusState } from '../shared/types.js'
import type { ToastMessage, AppConfig } from '../shared/types.js'
import type { AppContext } from './app-context.js'
import { handleImportImage, handleImportImageFromBase64 } from './image-import-handler.js'
import { getOverlayWindow } from './preview-overlay.js'
import type { createDrawingEngine } from './drawing-engine.js'
import type { ConfigStore } from './config-store.js'

export interface IpcHandlerDeps {
  getState: () => StatusState
  getMainWindow: () => BrowserWindow | null
  getContext: () => AppContext
  runPipeline: (imageBuffer: Buffer) => Promise<void>
  enterPreview: () => void
  exitPreview: () => void
  drawingEngine: ReturnType<typeof createDrawingEngine>
  exportLineArt: () => Promise<void>
  configStore: ConfigStore
}

export function registerIpcHandlers(deps: IpcHandlerDeps): void {
  ipcMain.handle(IPC_CHANNELS.APP_STATE, () => {
    return deps.getState()
  })

  ipcMain.handle(IPC_CHANNELS.IMPORT_IMAGE, async (_event, input: string) => {
    const ctx = deps.getContext()
    const isDataUrl = input.startsWith('data:')
    const result = isDataUrl
      ? handleImportImageFromBase64(input, ctx)
      : await handleImportImage(input, ctx)

    if (result.success) {
      const win = deps.getMainWindow()
      win?.webContents.send(IPC_CHANNELS.SHOW_TOAST, {
        type: 'success',
        message: `图片 "${result.fileName}" 导入成功`,
      } as ToastMessage)

      win?.webContents.send(IPC_CHANNELS.APP_STATE, deps.getState())

      // 触发推理管线（异步，不阻塞响应）
      deps.runPipeline(ctx.imageBuffer!).catch((err) => {
        console.error('[AKD] 管线启动失败:', err)
      })
    }

    return result
  })

  ipcMain.handle(IPC_CHANNELS.GET_IMAGE_DATA, async () => {
    const ctx = deps.getContext()
    if (!ctx.imageBuffer) {
      return { success: false }
    }
    const ext = ctx.imagePath
      ? ctx.imagePath.slice(ctx.imagePath.lastIndexOf('.')).toLowerCase()
      : '.png'
    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
    }
    const mime = mimeMap[ext] ?? 'image/png'
    return {
      success: true,
      dataUrl: `data:${mime};base64,${ctx.imageBuffer.toString('base64')}`,
      fileName: ctx.imagePath ? ctx.imagePath.split(/[/\\]/).pop() : '',
    }
  })

  ipcMain.handle(IPC_CHANNELS.RETRY_FROM_ERROR, async () => {
    const ctx = deps.getContext()
    if (deps.getState() !== StatusState.ERROR) {
      return { success: false, reason: '当前状态不允许重试' }
    }

    ctx.imageBuffer = null
    ctx.imagePath = null
    ctx.lineArtBuffer = null
    ctx.lineArtBase64 = null
    ctx.paths = null
    ctx.boundingBox = null
    ctx.width = 0
    ctx.height = 0

    ctx.stateMachine.transition(StatusState.NOT_READY)
    const win = deps.getMainWindow()
    win?.webContents.send(IPC_CHANNELS.APP_STATE, StatusState.NOT_READY)
    win?.webContents.send(IPC_CHANNELS.SHOW_TOAST, {
      type: 'info',
      message: '已重置，请重新导入图片',
    } satisfies ToastMessage)

    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.UPDATE_SETTINGS, async (_event, partialSettings: Record<string, unknown>) => {
    try {
      const store = deps.configStore as { set: (k: string, v: unknown) => void }
      for (const [key, value] of Object.entries(partialSettings)) {
        store.set(key, value)
      }
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存设置失败'
      return { success: false, reason: message }
    }
  })

  ipcMain.handle('export-lineart', async () => {
    await deps.exportLineArt()
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    deps.getMainWindow()?.minimize()
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    const win = deps.getMainWindow()
    if (win) {
      win.isMaximized() ? win.unmaximize() : win.maximize()
    }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
    deps.getMainWindow()?.hide()
  })

  ipcMain.handle(IPC_CHANNELS.OPEN_FILE_DIALOG, async () => {
    const win = deps.getMainWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: '图片文件', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] },
      ],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // 叠加层 IPC 处理
  ipcMain.handle('overlay-set-bounds', (_event, bounds: { x: number; y: number; width: number; height: number }) => {
    const overlay = getOverlayWindow()
    if (overlay && !overlay.isDestroyed()) {
      overlay.setBounds(bounds)
    }
  })

  // 叠加层缩放变更 → 转发至主渲染进程
  ipcMain.on('overlay-scale-changed', (_event, data: { scale: number; width: number; height: number }) => {
    const win = deps.getMainWindow()
    win?.webContents.send(IPC_CHANNELS.OVERLAY_SCALE_CHANGED, data)
  })

  // 进入/退出预览
  ipcMain.handle(IPC_CHANNELS.OVERLAY_ENTER_PREVIEW, () => {
    deps.enterPreview()
  })

  ipcMain.handle(IPC_CHANNELS.OVERLAY_EXIT_PREVIEW, () => {
    deps.exitPreview()
  })
}
