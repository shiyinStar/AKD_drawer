import type { DrawPath, BoundingBox } from './types.js'

export function computeBoundingBox(paths: DrawPath[]): BoundingBox {
  if (paths.length === 0) {
    return { minX: 0, minY: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const path of paths) {
    for (const point of path) {
      if (point.x < minX) minX = point.x
      if (point.y < minY) minY = point.y
      if (point.x > maxX) maxX = point.x
      if (point.y > maxY) maxY = point.y
    }
  }

  return {
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}
