import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clampSpeed, toScreen } from '../../src/main/drawing-engine.js'
import type { BoundingBox, OverlayRect } from '../../src/main/drawing-engine.js'
import { StatusState } from '../../src/shared/types.js'

// ---- clampSpeed ----

test('clampSpeed: 50 → 钳制为 100', () => {
  assert.strictEqual(clampSpeed(50), 100)
})

test('clampSpeed: 3000 → 钳制为 2000', () => {
  assert.strictEqual(clampSpeed(3000), 2000)
})

test('clampSpeed: 500 → 保持不变', () => {
  assert.strictEqual(clampSpeed(500), 500)
})

test('clampSpeed: NaN → 回退 500', () => {
  assert.strictEqual(clampSpeed(Number.NaN), 500)
})

test('clampSpeed: 非数字 → 回退 500', () => {
  assert.strictEqual(clampSpeed('abc' as unknown as number), 500)
})

test('clampSpeed: 100 → 保持不变（边界）', () => {
  assert.strictEqual(clampSpeed(100), 100)
})

test('clampSpeed: 2000 → 保持不变（边界）', () => {
  assert.strictEqual(clampSpeed(2000), 2000)
})

// ---- toScreen ----

test('toScreen: 基本坐标转换 — 缩放 1x，无偏移', () => {
  const point = { x: 50, y: 30 }
  const boundingBox: BoundingBox = { minX: 0, minY: 0, width: 100, height: 100, scaleFactor: 1 }
  const overlayRect: OverlayRect = { x: 100, y: 200, width: 100, height: 100, scaleFactor: 1 }
  const scale = 1

  const result = toScreen(point, boundingBox, overlayRect, scale)
  assert.strictEqual(result.x, 150)
  assert.strictEqual(result.y, 230)
})

test('toScreen: 缩放 2x，带 boundingBox 偏移', () => {
  const point = { x: 60, y: 40 }
  const boundingBox: BoundingBox = { minX: 10, minY: 10, width: 80, height: 60 }
  const overlayRect: OverlayRect = { x: 0, y: 0, width: 160, height: 120, scaleFactor: 1 }
  const scale = 2

  const result = toScreen(point, boundingBox, overlayRect, scale)
  // screenX = 0 + (60-10)*2 = 100
  // screenY = 0 + (40-10)*2 = 60
  assert.strictEqual(result.x, 100)
  assert.strictEqual(result.y, 60)
})

test('toScreen: 缩放 1.5x，坐标四舍五入', () => {
  const point = { x: 15, y: 25 }
  const boundingBox: BoundingBox = { minX: 0, minY: 0, width: 100, height: 100, scaleFactor: 1 }
  const overlayRect: OverlayRect = { x: 50, y: 80, width: 150, height: 150, scaleFactor: 1 }
  const scale = 1.5

  const result = toScreen(point, boundingBox, overlayRect, scale)
  assert.strictEqual(result.x, 73)
  assert.strictEqual(result.y, 118)
})

test('toScreen: 原点坐标 (0,0)', () => {
  const point = { x: 0, y: 0 }
  const boundingBox: BoundingBox = { minX: 0, minY: 0, width: 200, height: 200 }
  const overlayRect: OverlayRect = { x: 10, y: 20, width: 400, height: 400, scaleFactor: 1 }
  const scale = 2

  const result = toScreen(point, boundingBox, overlayRect, scale)
  assert.strictEqual(result.x, 10)
  assert.strictEqual(result.y, 20)
})

// ---- createDrawingEngine 状态校验 ----

test('start: 非 PREVIEWING 状态抛出', async () => {
  const { createDrawingEngine } = await import('../../src/main/drawing-engine.js')

  const engine = createDrawingEngine({
    stateMachine: {
      getState: () => StatusState.IDLE,
      transition: () => {},
      onStateChange: () => {},
      removeStateChangeListener: () => {},
    } as never,
    configStore: {
      getAll: () => ({ drawSpeed: 500, mouseButton: 'left' }),
    } as never,
    getMainWindow: () => null,
    destroyOverlay: () => {},
  })

  await assert.rejects(
    () =>
      engine.start(
        [],
        { minX: 0, minY: 0, width: 0, height: 0 },
        { x: 0, y: 0, width: 100, height: 100, scaleFactor: 1 },
      ),
    /仅预览状态可启动绘制/,
  )
})

test('start: 叠加窗口尺寸无效抛出', async () => {
  const { createDrawingEngine } = await import('../../src/main/drawing-engine.js')

  const engine = createDrawingEngine({
    stateMachine: {
      getState: () => StatusState.PREVIEWING,
      transition: () => {},
      onStateChange: () => {},
      removeStateChangeListener: () => {},
    } as never,
    configStore: {
      getAll: () => ({ drawSpeed: 500, mouseButton: 'left' }),
    } as never,
    getMainWindow: () => null,
    destroyOverlay: () => {},
  })

  await assert.rejects(
    () =>
      engine.start(
        [],
        { minX: 0, minY: 0, width: 0, height: 0 },
        { x: 0, y: 0, width: 0, height: 100, scaleFactor: 1 },
      ),
    /叠加窗口尺寸无效/,
  )
})

test('stop: 设置 stopFlag（未启动时不抛异常）', async () => {
  const { createDrawingEngine } = await import('../../src/main/drawing-engine.js')

  const engine = createDrawingEngine({
    stateMachine: {
      getState: () => StatusState.PREVIEWING,
      transition: () => {},
      onStateChange: () => {},
      removeStateChangeListener: () => {},
    } as never,
    configStore: {
      getAll: () => ({ drawSpeed: 500, mouseButton: 'left' }),
    } as never,
    getMainWindow: () => null,
    destroyOverlay: () => {},
  })

  assert.doesNotThrow(() => engine.stop())
})

test('isActive: 初始状态为 false', async () => {
  const { createDrawingEngine } = await import('../../src/main/drawing-engine.js')

  const engine = createDrawingEngine({
    stateMachine: {
      getState: () => StatusState.PREVIEWING,
      transition: () => {},
      onStateChange: () => {},
      removeStateChangeListener: () => {},
    } as never,
    configStore: {
      getAll: () => ({ drawSpeed: 500, mouseButton: 'left' }),
    } as never,
    getMainWindow: () => null,
    destroyOverlay: () => {},
  })

  assert.strictEqual(engine.isActive(), false)
})
