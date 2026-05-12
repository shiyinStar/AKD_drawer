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
  /** DPI 缩放因子（nut-js 坐标转换用）。dev/test 环境传 1 */
  scaleFactor: number
}

export interface DrawingEngineDeps {
  stateMachine: StateMachine
  configStore: ConfigStore
  getMainWindow: () => BrowserWindow | null
  destroyOverlay: () => void
  enterError: ReturnType<typeof createErrorHandler>['enterError']
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (ms <= 0) {
      resolve()
      return
    }
    // 亚毫秒延迟：纯自旋等待（时长极短，可接受）
    if (ms < 1.5) {
      const end = performance.now() + ms
      while (performance.now() < end) { /* spin */ }
      resolve()
      return
    }
    // ≥1.5ms：setTimeout 等待大部分时间，剩余用自旋补足精度
    const start = performance.now()
    setTimeout(() => {
      const elapsed = performance.now() - start
      const remaining = ms - elapsed
      if (remaining > 0) {
        const end = performance.now() + remaining
        while (performance.now() < end) { /* spin */ }
      }
      resolve()
    }, Math.max(0, ms - 1))
  })
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

    const scaleX = overlayRect.width / boundingBox.width
    const scaleY = overlayRect.height / boundingBox.height
    const scale = Math.max(scaleX, scaleY)

    // nut-js 底层使用 Win32 SetCursorPos（物理像素），而 Electron getBounds 返回 DIP
    // 高 DPI 显示器（150%/200%）下需乘以 scaleFactor 转换
    const { scaleFactor } = overlayRect

    function toPhysical(dip: { x: number; y: number }): { x: number; y: number } {
      return {
        x: Math.round(dip.x * scaleFactor),
        y: Math.round(dip.y * scaleFactor),
      }
    }

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

        // 预计算整条路径的屏幕坐标和物理坐标，避免热循环中重复调用 toScreen/toPhysical
        const screenPts = path.map((p) => toScreen(p, boundingBox, overlayRect, scale))
        const physicalPts = screenPts.map((p) => toPhysical(p))

        await mouse.setPosition(physicalPts[0])
        await mouse.pressButton(button)

        for (let j = 1; j < physicalPts.length; j++) {
          if (stopFlag) break

          const dx = screenPts[j].x - screenPts[j - 1].x
          const dy = screenPts[j].y - screenPts[j - 1].y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance === 0) continue

          const t0 = performance.now()
          await mouse.setPosition(physicalPts[j])
          const overhead = performance.now() - t0

          // 末点不延迟 — 画完即抬笔，笔画切换更利落
          if (j < physicalPts.length - 1) {
            const pointDelay = (distance / speed) * 1000
            await delay(Math.max(0, pointDelay - overhead))
          }
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
