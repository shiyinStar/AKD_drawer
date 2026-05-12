import { contextBridge, ipcRenderer } from 'electron'
import type { StatusState, PipelineProgress, ErrorInfo, ToastMessage, PipelineCompleteData } from '../shared/types.js'
import { IPC_CHANNELS } from '../shared/types.js'

contextBridge.exposeInMainWorld('electronAPI', {
  getAppState: (): Promise<StatusState> =>
    ipcRenderer.invoke(IPC_CHANNELS.APP_STATE),

  onAppStateChange: (callback: (state: StatusState) => void): void => {
    ipcRenderer.on(IPC_CHANNELS.APP_STATE, (_event, state: StatusState) =>
      callback(state),
    )
  },

  onPipelineProgress: (callback: (progress: PipelineProgress) => void): void => {
    ipcRenderer.on(
      IPC_CHANNELS.PIPELINE_PROGRESS,
      (_event, progress: PipelineProgress) => callback(progress),
    )
  },

  onDrawStatus: (callback: (status: unknown) => void): void => {
    ipcRenderer.on(IPC_CHANNELS.DRAW_STATUS, (_event, status: unknown) =>
      callback(status),
    )
  },

  onAppError: (callback: (error: ErrorInfo) => void): void => {
    ipcRenderer.on(IPC_CHANNELS.APP_ERROR, (_event, error: ErrorInfo) =>
      callback(error),
    )
  },

  importImage: (filePath: string): Promise<unknown> =>
    ipcRenderer.invoke(IPC_CHANNELS.IMPORT_IMAGE, filePath),

  retryFromError: (): Promise<unknown> =>
    ipcRenderer.invoke(IPC_CHANNELS.RETRY_FROM_ERROR),

  getSettings: (): Promise<unknown> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),

  updateSettings: (
    partialSettings: Record<string, unknown>,
  ): Promise<unknown> =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_SETTINGS, partialSettings),

  exportLineArt: (): Promise<unknown> =>
    ipcRenderer.invoke('export-lineart'),

  windowMinimize: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),

  windowMaximize: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),

  windowClose: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),

  onPipelineComplete: (
    callback: (data: PipelineCompleteData) => void,
  ): void => {
    ipcRenderer.on(
      IPC_CHANNELS.PIPELINE_COMPLETE,
      (_event, data: PipelineCompleteData) => callback(data),
    )
  },

  onToast: (callback: (toast: ToastMessage) => void): void => {
    ipcRenderer.on(IPC_CHANNELS.SHOW_TOAST, (_event, toast: ToastMessage) =>
      callback(toast),
    )
  },

  getImageData: (): Promise<unknown> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_IMAGE_DATA),

  openFileDialog: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.OPEN_FILE_DIALOG),

  onOverlayScaleChanged: (
    callback: (data: { scale: number; width: number; height: number }) => void,
  ): void => {
    ipcRenderer.on(
      IPC_CHANNELS.OVERLAY_SCALE_CHANGED,
      (_event, data: { scale: number; width: number; height: number }) =>
        callback(data),
    )
  },

  enterPreview: (): Promise<unknown> =>
    ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_ENTER_PREVIEW),

  exitPreview: (): Promise<unknown> =>
    ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_EXIT_PREVIEW),
})
