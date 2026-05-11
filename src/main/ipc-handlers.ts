import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../shared/types.js'
import type { StatusState } from '../shared/types.js'

export interface IpcHandlerDeps {
  getState: () => StatusState
  getMainWindow: () => BrowserWindow | null
}

export function registerIpcHandlers(deps: IpcHandlerDeps): void {
  ipcMain.handle(IPC_CHANNELS.APP_STATE, () => {
    return deps.getState()
  })

  ipcMain.handle(IPC_CHANNELS.IMPORT_IMAGE, async (_event, filePath: string) => {
    return { success: false, reason: 'not implemented' }
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
}
