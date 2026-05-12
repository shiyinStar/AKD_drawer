import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getHotkeysForState } from '../../src/main/shortcut-manager.js'
import { StatusState } from '../../src/shared/types.js'

// ---- getHotkeysForState ----

const defaultHotkeys = {
  preview: 'F5',
  startDraw: 'F6',
  stopDraw: 'F7',
  toggleOverlay: 'CommandOrControl+Shift+F9',
}

test('getHotkeysForState: NOT_READY → 空数组', () => {
  const keys = getHotkeysForState(StatusState.NOT_READY, defaultHotkeys)
  assert.deepStrictEqual(keys, [])
})

test('getHotkeysForState: IDLE → 仅 preview', () => {
  const keys = getHotkeysForState(StatusState.IDLE, defaultHotkeys)
  assert.deepStrictEqual(keys, ['F5'])
})

test('getHotkeysForState: PREVIEWING → preview + startDraw + toggleOverlay', () => {
  const keys = getHotkeysForState(StatusState.PREVIEWING, defaultHotkeys)
  assert.deepStrictEqual(keys, ['F5', 'F6', 'CommandOrControl+Shift+F9'])
})

test('getHotkeysForState: DRAWING → 仅 stopDraw', () => {
  const keys = getHotkeysForState(StatusState.DRAWING, defaultHotkeys)
  assert.deepStrictEqual(keys, ['F7'])
})

test('getHotkeysForState: ERROR → 空数组', () => {
  const keys = getHotkeysForState(StatusState.ERROR, defaultHotkeys)
  assert.deepStrictEqual(keys, [])
})

test('getHotkeysForState: 自定义快捷键映射', () => {
  const custom = {
    preview: 'F9',
    startDraw: 'Ctrl+Shift+D',
    stopDraw: 'Escape',
    toggleOverlay: 'Ctrl+Shift+O',
  }

  const previewKeys = getHotkeysForState(StatusState.PREVIEWING, custom)
  assert.deepStrictEqual(previewKeys, ['F9', 'Ctrl+Shift+D', 'Ctrl+Shift+O'])

  const drawKeys = getHotkeysForState(StatusState.DRAWING, custom)
  assert.deepStrictEqual(drawKeys, ['Escape'])
})

// ---- createShortcutManager 事件与注册 ----

function waitImmediate(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve))
}

test('createShortcutManager: IDLE 初始注册 preview', async () => {
  const { createShortcutManager } = await import('../../src/main/shortcut-manager.js')

  let registeredKeys: string[] = []

  const mockGS = {
    register(key: string) {
      registeredKeys.push(key)
      return true
    },
    unregisterAll() {
      registeredKeys = []
    },
  }

  const manager = createShortcutManager({
    stateMachine: {
      getState: () => StatusState.IDLE,
      onStateChange: () => {},
      removeStateChangeListener: () => {},
    } as never,
    configStore: {
      getAll: () => ({
        hotkeys: defaultHotkeys,
        drawSpeed: 500,
        mouseButton: 'left',
        overlayOpacity: 0.6,
        overlayLineColor: '#000000',
      }),
      onDidChange: () => {},
      set: () => {},
    } as never,
    getMainWindow: () => null,
    onPreviewToggle: () => {},
    onStartDraw: () => {},
    onStopDraw: () => {},
    onToggleOverlay: () => {},
    globalShortcut: mockGS,
  })

  assert.deepStrictEqual(registeredKeys, ['F5'])

  manager.destroy()
})

test('createShortcutManager: 状态变更触发重新注册', async () => {
  const { createShortcutManager } = await import('../../src/main/shortcut-manager.js')

  let registeredKeys: string[] = []

  const mockGS = {
    register(key: string) {
      registeredKeys.push(key)
      return true
    },
    unregisterAll() {
      registeredKeys = []
    },
  }

  let state = StatusState.IDLE
  const listeners: Array<(...args: never[]) => void> = []

  createShortcutManager({
    stateMachine: {
      getState: () => state,
      onStateChange: (fn: (...args: never[]) => void) => {
        listeners.push(fn)
      },
      removeStateChangeListener: () => {},
    } as never,
    configStore: {
      getAll: () => ({
        hotkeys: defaultHotkeys,
        drawSpeed: 500,
        mouseButton: 'left',
        overlayOpacity: 0.6,
        overlayLineColor: '#000000',
      }),
      onDidChange: () => {},
      set: () => {},
    } as never,
    getMainWindow: () => null,
    onPreviewToggle: () => {},
    onStartDraw: () => {},
    onStopDraw: () => {},
    onToggleOverlay: () => {},
    globalShortcut: mockGS,
  })

  assert.deepStrictEqual(registeredKeys, ['F5'], '初始 IDLE 应注册 F5')

  state = StatusState.PREVIEWING
  registeredKeys = []
  listeners.forEach((fn) => fn({ from: StatusState.IDLE, to: StatusState.PREVIEWING } as never))
  await waitImmediate()
  assert.deepStrictEqual(registeredKeys, ['F5', 'F6', 'CommandOrControl+Shift+F9'], 'PREVIEWING 应注册 3 个键')

  state = StatusState.DRAWING
  registeredKeys = []
  listeners.forEach((fn) => fn({ from: StatusState.PREVIEWING, to: StatusState.DRAWING } as never))
  await waitImmediate()
  assert.deepStrictEqual(registeredKeys, ['F7'], 'DRAWING 应注册 F7')

  state = StatusState.NOT_READY
  registeredKeys = []
  listeners.forEach((fn) => fn({ from: StatusState.DRAWING, to: StatusState.NOT_READY } as never))
  await waitImmediate()
  assert.deepStrictEqual(registeredKeys, [], 'NOT_READY 应无热键')

  state = StatusState.ERROR
  registeredKeys = []
  listeners.forEach((fn) => fn({ from: StatusState.IDLE, to: StatusState.ERROR } as never))
  await waitImmediate()
  assert.deepStrictEqual(registeredKeys, [], 'ERROR 应无热键')
})

test('createShortcutManager: 配置变更触发重新注册', async () => {
  const { createShortcutManager } = await import('../../src/main/shortcut-manager.js')

  let registeredKeys: string[] = []

  const mockGS = {
    register(key: string) {
      registeredKeys.push(key)
      return true
    },
    unregisterAll() {
      registeredKeys = []
    },
  }

  let hotkeysDidChangeCallback: (() => void) | null = null

  createShortcutManager({
    stateMachine: {
      getState: () => StatusState.IDLE,
      onStateChange: () => {},
      removeStateChangeListener: () => {},
    } as never,
    configStore: {
      getAll: () => ({
        hotkeys: defaultHotkeys,
        drawSpeed: 500,
        mouseButton: 'left',
        overlayOpacity: 0.6,
        overlayLineColor: '#000000',
      }),
      onDidChange: (_key: string, cb: () => void) => {
        hotkeysDidChangeCallback = cb
      },
      set: () => {},
    } as never,
    getMainWindow: () => null,
    onPreviewToggle: () => {},
    onStartDraw: () => {},
    onStopDraw: () => {},
    onToggleOverlay: () => {},
    globalShortcut: mockGS,
  })

  assert.deepStrictEqual(registeredKeys, ['F5'], '初始注册 F5')

  registeredKeys = []
  hotkeysDidChangeCallback?.()
  assert.deepStrictEqual(registeredKeys, ['F5'], '配置变更后重新注册 F5')
})

test('createShortcutManager: 注册失败发送 Toast', async () => {
  const { createShortcutManager } = await import('../../src/main/shortcut-manager.js')

  let toastMessage: string | null = null

  const mockGS = {
    register(_key: string) {
      return false
    },
    unregisterAll() {},
  }

  createShortcutManager({
    stateMachine: {
      getState: () => StatusState.IDLE,
      onStateChange: () => {},
      removeStateChangeListener: () => {},
    } as never,
    configStore: {
      getAll: () => ({
        hotkeys: defaultHotkeys,
        drawSpeed: 500,
        mouseButton: 'left',
        overlayOpacity: 0.6,
        overlayLineColor: '#000000',
      }),
      onDidChange: () => {},
      set: () => {},
    } as never,
    getMainWindow: () => ({
      webContents: {
        send: (_channel: string, data: unknown) => {
          const msg = data as { message: string }
          toastMessage = msg.message
        },
      },
    }) as never,
    onPreviewToggle: () => {},
    onStartDraw: () => {},
    onStopDraw: () => {},
    onToggleOverlay: () => {},
    globalShortcut: mockGS,
  })

  assert.ok(toastMessage, '应发送 Toast')
  assert.ok(toastMessage!.includes('F5'), 'Toast 应包含键名 F5')
})

test('createShortcutManager: 注册异常不崩溃', async () => {
  const { createShortcutManager } = await import('../../src/main/shortcut-manager.js')

  const mockGS = {
    register() {
      throw new Error('注册异常')
    },
    unregisterAll() {},
  }

  assert.doesNotThrow(() => {
    createShortcutManager({
      stateMachine: {
        getState: () => StatusState.IDLE,
        onStateChange: () => {},
        removeStateChangeListener: () => {},
      } as never,
      configStore: {
        getAll: () => ({
          hotkeys: defaultHotkeys,
          drawSpeed: 500,
          mouseButton: 'left',
          overlayOpacity: 0.6,
          overlayLineColor: '#000000',
        }),
        onDidChange: () => {},
        set: () => {},
      } as never,
      getMainWindow: () => null,
      onPreviewToggle: () => {},
      onStartDraw: () => {},
      onStopDraw: () => {},
      onToggleOverlay: () => {},
      globalShortcut: mockGS,
    })
  })
})

test('createShortcutManager: 回调含状态双重校验', async () => {
  const { createShortcutManager } = await import('../../src/main/shortcut-manager.js')

  let callbackInvoked = false
  let registeredCallback: (() => void) | null = null

  const mockGS = {
    register(_key: string, cb: () => void) {
      registeredCallback = cb
      return true
    },
    unregisterAll() {},
  }

  let currentState = StatusState.IDLE

  createShortcutManager({
    stateMachine: {
      getState: () => currentState,
      onStateChange: () => {},
      removeStateChangeListener: () => {},
    } as never,
    configStore: {
      getAll: () => ({
        hotkeys: defaultHotkeys,
        drawSpeed: 500,
        mouseButton: 'left',
        overlayOpacity: 0.6,
        overlayLineColor: '#000000',
      }),
      onDidChange: () => {},
      set: () => {},
    } as never,
    getMainWindow: () => null,
    onPreviewToggle: () => {
      callbackInvoked = true
    },
    onStartDraw: () => {},
    onStopDraw: () => {},
    onToggleOverlay: () => {},
    globalShortcut: mockGS,
  })

  registeredCallback?.()
  assert.strictEqual(callbackInvoked, true, 'IDLE 状态应触发 onPreviewToggle')

  currentState = StatusState.PREVIEWING
  callbackInvoked = false
  registeredCallback?.()
  assert.strictEqual(callbackInvoked, false, '状态已变，旧回调不应触发')
})

test('createShortcutManager: destroy 注销所有热键', async () => {
  const { createShortcutManager } = await import('../../src/main/shortcut-manager.js')

  let unregisterCalled = false

  const mockGS = {
    register() { return true },
    unregisterAll() { unregisterCalled = true },
  }

  const manager = createShortcutManager({
    stateMachine: {
      getState: () => StatusState.IDLE,
      onStateChange: () => {},
      removeStateChangeListener: () => {},
    } as never,
    configStore: {
      getAll: () => ({
        hotkeys: defaultHotkeys,
        drawSpeed: 500,
        mouseButton: 'left',
        overlayOpacity: 0.6,
        overlayLineColor: '#000000',
      }),
      onDidChange: () => {},
      set: () => {},
    } as never,
    getMainWindow: () => null,
    onPreviewToggle: () => {},
    onStartDraw: () => {},
    onStopDraw: () => {},
    onToggleOverlay: () => {},
    globalShortcut: mockGS,
  })

  unregisterCalled = false
  manager.destroy()
  assert.strictEqual(unregisterCalled, true, 'destroy 应调用 unregisterAll')
})
