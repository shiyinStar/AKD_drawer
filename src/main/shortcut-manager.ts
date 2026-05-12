import type { BrowserWindow } from 'electron'
import { StatusState, IPC_CHANNELS } from '../shared/types.js'
import type { StateMachine } from './state-machine.js'
import type { ConfigStore } from './config-store.js'
import type { ToastMessage } from '../shared/types.js'

export interface ShortcutManagerDeps {
  stateMachine: StateMachine
  configStore: ConfigStore
  getMainWindow: () => BrowserWindow | null
  onPreviewToggle: () => void
  onStartDraw: () => void
  onStopDraw: () => void
  onToggleOverlay: () => void
  globalShortcut: Pick<Electron.GlobalShortcut, 'register' | 'unregisterAll'>
}

export function createShortcutManager(deps: ShortcutManagerDeps) {
  const { stateMachine, configStore, getMainWindow, globalShortcut } = deps
  let currentState = stateMachine.getState()

  function notifyConflict(keyName: string): void {
    const win = getMainWindow()
    win?.webContents.send(IPC_CHANNELS.SHOW_TOAST, {
      type: 'warning',
      message: `热键 ${keyName} 已被占用`,
    } satisfies ToastMessage)
  }

  function safeCallback(expectedState: StatusState, cb: () => void): () => void {
    return () => {
      if (stateMachine.getState() === expectedState) {
        cb()
      }
    }
  }

  function register(key: string, callback: () => void): void {
    if (!key) return
    try {
      const ok = globalShortcut.register(key, callback)
      if (!ok) {
        notifyConflict(key)
      }
    } catch {
      notifyConflict(key)
    }
  }

  function refresh(): void {
    globalShortcut.unregisterAll()

    const config = configStore.getAll()
    const { preview, startDraw, stopDraw, toggleOverlay } = config.hotkeys

    switch (currentState) {
      case StatusState.IDLE:
        register(preview, safeCallback(StatusState.IDLE, deps.onPreviewToggle))
        break

      case StatusState.PREVIEWING:
        register(preview, safeCallback(StatusState.PREVIEWING, deps.onPreviewToggle))
        register(startDraw, safeCallback(StatusState.PREVIEWING, deps.onStartDraw))
        register(toggleOverlay, safeCallback(StatusState.PREVIEWING, deps.onToggleOverlay))
        break

      case StatusState.DRAWING:
        register(stopDraw, safeCallback(StatusState.DRAWING, deps.onStopDraw))
        break

      case StatusState.NOT_READY:
      case StatusState.ERROR:
        break
    }
  }

  stateMachine.onStateChange(({ to }) => {
    currentState = to
    setImmediate(() => refresh())
  })

  configStore.onDidChange('hotkeys', () => {
    refresh()
  })

  refresh()

  function destroy(): void {
    globalShortcut.unregisterAll()
  }

  return { refresh, destroy }
}

export function getHotkeysForState(
  state: StatusState,
  config: { preview: string; startDraw: string; stopDraw: string; toggleOverlay: string },
): string[] {
  switch (state) {
    case StatusState.IDLE:
      return [config.preview]
    case StatusState.PREVIEWING:
      return [config.preview, config.startDraw, config.toggleOverlay]
    case StatusState.DRAWING:
      return [config.stopDraw]
    case StatusState.NOT_READY:
    case StatusState.ERROR:
      return []
  }
}
