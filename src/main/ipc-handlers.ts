import { ipcMain, BrowserWindow, dialog } from 'electron'
import { IPC_CHANNELS } from '../shared/types.js'
import type { StatusState, ToastMessage } from '../shared/types.js'
import type { AppContext } from './app-context.js'
import { handleImportImage } from './image-import-handler.js'

export interface IpcHandlerDeps {
  getState: () => StatusState
  getMainWindow: () => BrowserWindow | null
  getContext: () => AppContext
}

export function registerIpcHandlers(deps: IpcHandlerDeps): void {
  ipcMain.handle(IPC_CHANNELS.APP_STATE, () => {
    return deps.getState()
  })

  ipcMain.handle(IPC_CHANNELS.IMPORT_IMAGE, async (_event, filePath: string) => {
    const ctx = deps.getContext()
    const result = await handleImportImage(filePath, ctx)

    if (result.success) {
      const win = deps.getMainWindow()
      win?.webContents.send(IPC_CHANNELS.SHOW_TOAST, {
        type: 'success',
        message: `图片 "${result.fileName}" 导入成功`,
      } as ToastMessage)

      win?.webContents.send(IPC_CHANNELS.APP_STATE, deps.getState())
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
    return { success: false, reason: 'not implemented' }
  })

  ipcMain.handle(IPC_CHANNELS.UPDATE_SETTINGS, async (_event, partialSettings: Record<string, unknown>) => {
    return { success: false, reason: 'not implemented' }
  })

  ipcMain.handle('export-lineart', async () => {
    return { success: false, reason: 'not implemented' }
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
}
