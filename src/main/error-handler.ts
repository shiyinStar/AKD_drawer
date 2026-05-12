import type { BrowserWindow } from 'electron'
import { StatusState, IPC_CHANNELS } from '../shared/types.js'
import type { ErrorInfo, ToastMessage } from '../shared/types.js'
import type { StateMachine } from './state-machine.js'

export interface ErrorHandlerDeps {
  stateMachine: StateMachine
  getMainWindow: () => BrowserWindow | null
}

export function createErrorHandler(deps: ErrorHandlerDeps) {
  const { stateMachine, getMainWindow } = deps

  function enterError(errorInfo: ErrorInfo): void {
    if (stateMachine.getState() === StatusState.ERROR) return

    stateMachine.transition(StatusState.ERROR)

    const win = getMainWindow()
    win?.webContents.send(IPC_CHANNELS.APP_ERROR, errorInfo)
    win?.webContents.send(IPC_CHANNELS.APP_STATE, StatusState.ERROR)
    win?.webContents.send(IPC_CHANNELS.SHOW_TOAST, {
      type: 'error',
      message: errorInfo.reason,
    } satisfies ToastMessage)
  }

  return { enterError }
}
