/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface ElectronAPI {
  getAppState(): Promise<import('../shared/types.js').StatusState>
  onAppStateChange(
    callback: (state: import('../shared/types.js').StatusState) => void,
  ): void
  onPipelineProgress(
    callback: (
      progress: import('../shared/types.js').PipelineProgress,
    ) => void,
  ): void
  onDrawStatus(callback: (status: unknown) => void): void
  onAppError(
    callback: (error: import('../shared/types.js').ErrorInfo) => void,
  ): void
  importImage(filePath: string): Promise<unknown>
  retryFromError(): Promise<unknown>
  updateSettings(partialSettings: Record<string, unknown>): Promise<unknown>
  exportLineArt(): Promise<unknown>
  windowMinimize(): Promise<void>
  windowMaximize(): Promise<void>
  windowClose(): Promise<void>
  onToast(
    callback: (toast: import('../shared/types.js').ToastMessage) => void,
  ): void
  getImageData(): Promise<unknown>
  openFileDialog(): Promise<string | null>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
