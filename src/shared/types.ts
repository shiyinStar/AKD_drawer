export enum StatusState {
  NOT_READY = 'NOT_READY',
  IDLE = 'IDLE',
  PREVIEWING = 'PREVIEWING',
  DRAWING = 'DRAWING',
  ERROR = 'ERROR',
}

export interface Point {
  x: number
  y: number
}

export type DrawPath = Point[]

export interface BoundingBox {
  minX: number
  minY: number
  width: number
  height: number
}

export interface AppConfig {
  hotkeys: {
    preview: string
    startDraw: string
    stopDraw: string
  }
  drawSpeed: number
  mouseButton: 'left' | 'right'
  overlayOpacity: number
  overlayLineColor: string
}

export interface PipelineProgress {
  stage: string
  progress: number
}

export interface ErrorInfo {
  reason: string
  suggestion: string
  logPath: string
}

export const IPC_CHANNELS = {
  IMPORT_IMAGE: 'import-image',
  PIPELINE_PROGRESS: 'pipeline-progress',
  PIPELINE_COMPLETE: 'pipeline-complete',
  HOTKEY_TRIGGERED: 'hotkey-triggered',
  DRAW_STATUS: 'draw-status',
  APP_ERROR: 'app-error',
  RETRY_FROM_ERROR: 'retry-from-error',
  UPDATE_SETTINGS: 'update-settings',
  APP_STATE: 'app-state',
  OVERLAY_SCALE_CHANGED: 'overlay-scale-changed',
  WINDOW_MINIMIZE: 'window-minimize',
  WINDOW_MAXIMIZE: 'window-maximize',
  WINDOW_CLOSE: 'window-close',
  SHOW_TOAST: 'show-toast',
  GET_IMAGE_DATA: 'get-image-data',
  OPEN_FILE_DIALOG: 'open-file-dialog',
} as const

export interface ToastMessage {
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  duration?: number
}
