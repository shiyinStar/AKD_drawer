import { parentPort } from 'node:worker_threads'
import { createRequire } from 'node:module'
import sharp from 'sharp'
import type { DrawPath, Point } from '../../shared/types.js'

const require = createRequire(import.meta.url)

let cv: any = null
let cvError: string | null = null

try {
  const { cv: cvInstance } = require('@dalongrong/opencv-wasm')
  cv = cvInstance
} catch (err) {
  cvError = err instanceof Error ? err.message : 'OpenCV 加载失败'
}

// ============================================================
// Zhang-Suen 骨架化（纯 TypeScript）
// 将二值图中的白色区域迭代细化至 1px 宽中心线
// ============================================================
function zhangSuenThinning(data: Uint8Array, w: number, h: number): void {
  const work = new Uint8Array(data)
  let changed = true

  while (changed) {
    changed = false

    // Step 1: 删除东南边界点
    const remove1: number[] = []
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x
        if (work[idx] !== 255) continue

        // 8 邻域顺时针从顶开始: P2(top) P3(tr) P4(right) P5(br) P6(bottom) P7(bl) P8(left) P9(tl)
        const p2 = work[(y - 1) * w + x] === 255 ? 1 : 0
        const p3 = work[(y - 1) * w + x + 1] === 255 ? 1 : 0
        const p4 = work[y * w + x + 1] === 255 ? 1 : 0
        const p5 = work[(y + 1) * w + x + 1] === 255 ? 1 : 0
        const p6 = work[(y + 1) * w + x] === 255 ? 1 : 0
        const p7 = work[(y + 1) * w + x - 1] === 255 ? 1 : 0
        const p8 = work[y * w + x - 1] === 255 ? 1 : 0
        const p9 = work[(y - 1) * w + x - 1] === 255 ? 1 : 0

        const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9
        if (B < 2 || B > 6) continue

        // 顺时针序列中 0→1 跳变次数
        const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2]
        let A = 0
        for (let k = 0; k < 8; k++) {
          if (seq[k] === 0 && seq[k + 1] === 1) A++
        }
        if (A !== 1) continue

        if (p2 * p4 * p6 !== 0) continue
        if (p4 * p6 * p8 !== 0) continue

        remove1.push(idx)
      }
    }
    for (const idx of remove1) {
      work[idx] = 0
      changed = true
    }

    // Step 2: 删除西北边界点
    const remove2: number[] = []
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x
        if (work[idx] !== 255) continue

        const p2 = work[(y - 1) * w + x] === 255 ? 1 : 0
        const p3 = work[(y - 1) * w + x + 1] === 255 ? 1 : 0
        const p4 = work[y * w + x + 1] === 255 ? 1 : 0
        const p5 = work[(y + 1) * w + x + 1] === 255 ? 1 : 0
        const p6 = work[(y + 1) * w + x] === 255 ? 1 : 0
        const p7 = work[(y + 1) * w + x - 1] === 255 ? 1 : 0
        const p8 = work[y * w + x - 1] === 255 ? 1 : 0
        const p9 = work[(y - 1) * w + x - 1] === 255 ? 1 : 0

        const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9
        if (B < 2 || B > 6) continue

        const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2]
        let A = 0
        for (let k = 0; k < 8; k++) {
          if (seq[k] === 0 && seq[k + 1] === 1) A++
        }
        if (A !== 1) continue

        if (p2 * p4 * p8 !== 0) continue
        if (p2 * p6 * p8 !== 0) continue

        remove2.push(idx)
      }
    }
    for (const idx of remove2) {
      work[idx] = 0
      changed = true
    }
  }

  data.set(work)
}

// ============================================================
// 骨架路径追踪
// 从端点出发沿骨架走，在交叉点分叉，标记已访问避免重复
// ============================================================
function traceSkeleton(skel: Uint8Array, w: number, h: number): DrawPath[] {
  const visited = new Uint8Array(w * h)
  const paths: DrawPath[] = []

  const dirs = [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1],
  ]

  function neighborCount(x: number, y: number): number {
    let n = 0
    for (const [dx, dy] of dirs) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < w && ny >= 0 && ny < h && skel[ny * w + nx] === 255) {
        n++
      }
    }
    return n
  }

  function getNeighbors(x: number, y: number): [number, number][] {
    const result: [number, number][] = []
    for (const [dx, dy] of dirs) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < w && ny >= 0 && ny < h && skel[ny * w + nx] === 255 && visited[ny * w + nx] === 0) {
        result.push([nx, ny])
      }
    }
    return result
  }

  // 找到端点（1 个邻居）开始追踪
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (skel[y * w + x] !== 255 || visited[y * w + x] !== 0) continue

      const nc = neighborCount(x, y)
      if (nc !== 1 && nc !== 0) continue

      // 从端点开始走
      const path: Point[] = [{ x, y }]
      visited[y * w + x] = 1

      let cx = x
      let cy = y

      while (true) {
        const neighbors = getNeighbors(cx, cy)
        if (neighbors.length === 0) break

        // 优先选直线方向，保持路径尽可能直
        let bestIdx = 0
        if (path.length >= 2) {
          const prev = path[path.length - 2]
          const dx = cx - prev.x
          const dy = cy - prev.y
          if (dx !== 0 || dy !== 0) {
            // 找与前进方向最接近的邻居
            let bestDot = -Infinity
            for (let i = 0; i < neighbors.length; i++) {
              const [nx, ny] = neighbors[i]
              const ndx = nx - cx
              const ndy = ny - cy
              const dot = ndx * dx + ndy * dy
              if (dot > bestDot) {
                bestDot = dot
                bestIdx = i
              }
            }
          }
        }

        const [nx, ny] = neighbors[bestIdx]
        visited[ny * w + nx] = 1
        path.push({ x: nx, y: ny })
        cx = nx
        cy = ny

        // 到达另一端点或分叉点
        const ncn = neighborCount(cx, cy)
        if (ncn !== 2) break
      }

      if (path.length >= 3) {
        paths.push(path)
      }
    }
  }

  // 处理剩余孤立环（所有点都是 2 邻居的闭合环）
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (skel[y * w + x] !== 255 || visited[y * w + x] !== 0) continue

      const path: Point[] = [{ x, y }]
      visited[y * w + x] = 1

      let cx = x
      let cy = y

      while (true) {
        const neighbors = getNeighbors(cx, cy)
        if (neighbors.length === 0) break

        const [nx, ny] = neighbors[0]
        visited[ny * w + nx] = 1
        path.push({ x: nx, y: ny })
        cx = nx
        cy = ny
      }

      if (path.length >= 3) {
        paths.push(path)
      }
    }
  }

  return paths
}

// ============================================================
// PNG 解码
// ============================================================
async function decodePNG(buffer: Buffer): Promise<{ mat: any; width: number; height: number }> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const grayData = new Uint8Array(width * height)
  for (let i = 0; i < width * height; i++) {
    grayData[i] = data[i * channels]
  }

  const mat = cv.matFromArray(height, width, cv.CV_8UC1, Array.from(grayData))
  return { mat, width, height }
}

// ============================================================
// Worker 消息处理
// ============================================================
if (parentPort) {
  const port = parentPort

  port.on('message', async (msg: { type: string; lineArtBuffer?: ArrayBuffer }) => {
    if (msg.type !== 'extract' || !msg.lineArtBuffer) return

    if (cvError) {
      port.postMessage({ type: 'error', message: cvError })
      return
    }

    const mats: any[] = []

    try {
      const buffer = Buffer.from(msg.lineArtBuffer)
      const { mat: gray, width, height } = await decodePNG(buffer)
      mats.push(gray)

      if (gray.empty()) {
        port.postMessage({ type: 'error', message: '无法解码线稿图片' })
        return
      }

      // 1. 高斯模糊降噪
      const blurred = new cv.Mat()
      mats.push(blurred)
      cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0)

      // 2. Otsu 自适应阈值 → 线条为白色前景
      const binary = new cv.Mat()
      mats.push(binary)
      cv.threshold(blurred, binary, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU)

      // 3. 形态学闭运算填补细微断线
      const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(2, 2))
      mats.push(kernel)
      const closed = new cv.Mat()
      mats.push(closed)
      cv.morphologyEx(binary, closed, cv.MORPH_CLOSE, kernel)

      // 4. 提取像素数据 → Zhang-Suen 骨架化 → 中心线 1px 宽
      const rawData = new Uint8Array(closed.data)
      zhangSuenThinning(rawData, width, height)

      // 5. 追踪骨架 → 单线路径
      const paths = traceSkeleton(rawData, width, height)

      for (const m of mats) {
        try { m.delete() } catch { /* ignore */ }
      }

      if (paths.length === 0) {
        port.postMessage({ type: 'error', message: '未检测到可绘制线条' })
        return
      }

      paths.sort((a, b) => {
        const ay = a[0].y
        const by = b[0].y
        if (ay !== by) return ay - by
        return a[0].x - b[0].x
      })

      port.postMessage({ type: 'result', paths })
    } catch (err) {
      const message = err instanceof Error ? err.message : '路径提取失败'
      port.postMessage({ type: 'error', message })
    }
  })
}
