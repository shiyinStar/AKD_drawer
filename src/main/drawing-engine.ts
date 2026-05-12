import type { BrowserWindow } from 'electron'
import type { StateMachine } from './state-machine.js'
import type { ConfigStore } from './config-store.js'
import { StatusState, IPC_CHANNELS } from '../shared/types.js'
import type { DrawPath, BoundingBox } from '../shared/types.js'
import { mouse, Button } from './adapters/nut-js-adapter.js'
import type { createErrorHandler } from './error-handler.js'

export interface OverlayRect {
  x: number
  y: number
  width: number
  height: number
}

export interface DrawingEngineDeps {
  stateMachine: StateMachine
  configStore: ConfigStore
  getMainWindow: () => BrowserWindow | null
  destroyOverlay: () => void
  enterError: ReturnType<typeof createErrorHandler>['enterError']
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function toScreen(
  point: { x: number; y: number },
  boundingBox: BoundingBox,
  overlayRect: OverlayRect,
  scale: number,
): { x: number; y: number } {
  return {
    x: Math.round(overlayRect.x + (point.x - boundingBox.minX) * scale),
    y: Math.round(overlayRect.y + (point.y - boundingBox.minY) * scale),
  }
}

export function clampSpeed(speed: number): number {
  if (typeof speed !== 'number' || Number.isNaN(speed)) return 500
  if (speed < 100) return 100
  if (speed > 2000) return 2000
  return speed
}

export function toButton(value: string): number {
  return value === 'right' ? Button.RIGHT : Button.LEFT
}

function validateOverlayRect(rect: OverlayRect): void {
  if (rect.width <= 0 || rect.height <= 0) {
    throw new Error('叠加窗口尺寸无效')
  }
}

export function createDrawingEngine(deps: DrawingEngineDeps) {
  const { stateMachine, configStore, getMainWindow, destroyOverlay } = deps
  let stopFlag = false
  let active = false

  async function start(
    paths: DrawPath[],
    boundingBox: BoundingBox,
    overlayRect: OverlayRect,
  ): Promise<void> {
    if (stateMachine.getState() !== StatusState.PREVIEWING) {
      throw new Error('仅预览状态可启动绘制')
    }

    validateOverlayRect(overlayRect)

    const config = configStore.getAll()
    const speed = clampSpeed(config.drawSpeed)
    const button = toButton(config.mouseButton)
    const stepDelay = 1000 / speed

    const scaleX = overlayRect.width / boundingBox.width
    const scaleY = overlayRect.height / boundingBox.height
    const scale = Math.max(scaleX, scaleY)

    const win = getMainWindow()

    stateMachine.transition(StatusState.DRAWING)
    win?.webContents.send(IPC_CHANNELS.APP_STATE, StatusState.DRAWING)

    destroyOverlay()

    stopFlag = false
    active = true
    const totalPaths = paths.length

    try {
      for (let i = 0; i < paths.length; i++) {
        if (stopFlag) break

        const path = paths[i]
        if (path.length === 0) continue

        win?.webContents.send(IPC_CHANNELS.DRAW_STATUS, {
          currentPath: i + 1,
          totalPaths,
          speed,
        })

        const startPt = toScreen(path[0], boundingBox, overlayRect, scale)
        await mouse.setPosition({ x: startPt.x, y: startPt.y })
        await mouse.pressButton(button)

        for (let j = 1; j < path.length; j++) {
          if (stopFlag) break
          const pt = toScreen(path[j], boundingBox, overlayRect, scale)
          await mouse.setPosition({ x: pt.x, y: pt.y })
          await delay(stepDelay)
        }

        await mouse.releaseButton(button)
      }
    } catch (err) {
      try {
        await mouse.releaseButton(button)
      } catch {
        /* 二次释放安全忽略 */
      }

      active = false

      const message = err instanceof Error ? err.message : '绘制异常'
      deps.enterError({
        reason: message,
        suggestion: '请重试',
        logPath: '',
      })
      return
    }

    active = false

    if (!stopFlag) {
      stateMachine.transition(StatusState.IDLE)
      win?.webContents.send(IPC_CHANNELS.APP_STATE, StatusState.IDLE)
      win?.webContents.send(IPC_CHANNELS.SHOW_TOAST, {
        type: 'success',
        message: '绘制完成',
      })
    } else {
      stateMachine.transition(StatusState.IDLE)
      win?.webContents.send(IPC_CHANNELS.APP_STATE, StatusState.IDLE)
    }
  }

  function stop(): void {
    stopFlag = true
  }

  function isActive(): boolean {
    return active
  }

  return { start, stop, isActive }
}
