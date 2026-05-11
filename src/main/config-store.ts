import Store from 'electron-store'
import type { AppConfig } from '../shared/types.js'

const schema = {
  hotkeys: {
    type: 'object',
    properties: {
      preview: { type: 'string', default: 'F5' },
      startDraw: { type: 'string', default: 'F6' },
      stopDraw: { type: 'string', default: 'F7' },
    },
    default: {
      preview: 'F5',
      startDraw: 'F6',
      stopDraw: 'F7',
    },
  },
  drawSpeed: {
    type: 'number',
    default: 500,
    minimum: 100,
    maximum: 2000,
  },
  mouseButton: {
    type: 'string',
    enum: ['left', 'right'],
    default: 'left',
  },
  overlayOpacity: {
    type: 'number',
    default: 0.6,
    minimum: 0.3,
    maximum: 0.8,
  },
  overlayLineColor: {
    type: 'string',
    default: '#000000',
  },
} as const

export interface ConfigStoreOptions {
  cwd: string
}

export class ConfigStore {
  private store: Store<AppConfig>

  constructor(options: ConfigStoreOptions) {
    this.store = new Store<AppConfig>({
      schema,
      cwd: options.cwd,
    })
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.store.get(key)
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.store.set(key, value)
  }

  getAll(): AppConfig {
    return this.store.store
  }

  reset<K extends keyof AppConfig>(key: K): void {
    this.store.reset(key)
  }

  onDidChange<K extends keyof AppConfig>(key: K, callback: (newValue: AppConfig[K], oldValue: AppConfig[K]) => void): void {
    this.store.onDidChange(key, callback as (newValue: unknown, oldValue: unknown) => void)
  }
}
