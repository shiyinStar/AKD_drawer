import { contextBridge, ipcRenderer } from 'electron'

const OVERLAY_INIT = 'overlay-init'
const OVERLAY_SET_INTERACTIVE = 'overlay-set-interactive'
const OVERLAY_SET_BOUNDS = 'overlay-set-bounds'
const OVERLAY_SCALE_CHANGED = 'overlay-scale-changed'

contextBridge.exposeInMainWorld('overlayAPI', {
  onInit(callback: (data: {
    paths: { x: number; y: number }[][]
    boundingBox: { minX: number; minY: number; width: number; height: number }
    lineColor: string
  }) => void): void {
    ipcRenderer.on(OVERLAY_INIT, (_event, data) => callback(data))
  },

  onSetInteractive(callback: (interactive: boolean) => void): void {
    ipcRenderer.on(OVERLAY_SET_INTERACTIVE, (_event, interactive: boolean) => callback(interactive))
  },

  setBounds(bounds: { x: number; y: number; width: number; height: number }): Promise<void> {
    return ipcRenderer.invoke(OVERLAY_SET_BOUNDS, bounds)
  },

  sendScaleChanged(scale: number, width: number, height: number): void {
    ipcRenderer.send(OVERLAY_SCALE_CHANGED, { scale, width, height })
  },
})
