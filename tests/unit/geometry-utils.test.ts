import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeBoundingBox } from '../../src/shared/geometry-utils.js'
import type { DrawPath } from '../../src/shared/types.js'

test('有路径时正确计算 minX/minY/width/height', () => {
  const paths: DrawPath = [
    { x: 0, y: 0 },
    { x: 100, y: 50 },
  ]

  const box = computeBoundingBox([paths])
  assert.strictEqual(box.minX, 0)
  assert.strictEqual(box.minY, 0)
  assert.strictEqual(box.width, 100)
  assert.strictEqual(box.height, 50)
})

test('空数组 → 返回零包围盒', () => {
  const box = computeBoundingBox([])
  assert.strictEqual(box.minX, 0)
  assert.strictEqual(box.minY, 0)
  assert.strictEqual(box.width, 0)
  assert.strictEqual(box.height, 0)
})

test('多条路径 — 取所有点的最小外接矩形', () => {
  const path1: DrawPath = [
    { x: 10, y: 20 },
    { x: 200, y: 30 },
  ]
  const path2: DrawPath = [
    { x: 50, y: 5 },
    { x: 150, y: 300 },
  ]

  const box = computeBoundingBox([path1, path2])
  assert.strictEqual(box.minX, 10)
  assert.strictEqual(box.minY, 5)
  assert.strictEqual(box.width, 190)
  assert.strictEqual(box.height, 295)
})
