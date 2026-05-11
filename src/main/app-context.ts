import { dirname } from 'node:path'
import type { BrowserWindow } from 'electron'
import { stateMachine } from './state-machine.js'
import { ConfigStore } from './config-store.js'
import type { StateMachine } from './state-machine.js'
import type { ConfigStore as ConfigStoreType } from './config-store.js'

export interface AppContext {
  stateMachine: StateMachine
  configStore: ConfigStoreType
  mainWindow: BrowserWindow | null
  imageBuffer: Buffer | null
  imagePath: string | null
  width: number
  height: number
  lineArtBuffer: Buffer | null
  lineArtBase64: string | null
}

export function createAppContext(): AppContext {
  const configStore = new ConfigStore({
    cwd: dirname(process.execPath),
  })

  return {
    stateMachine,
    configStore,
    mainWindow: null,
    imageBuffer: null,
    imagePath: null,
    width: 0,
    height: 0,
    lineArtBuffer: null,
    lineArtBase64: null,
  }
}
