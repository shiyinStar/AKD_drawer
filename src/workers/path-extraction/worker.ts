import { parentPort } from 'node:worker_threads'
import { createRequire } from 'node:module'
import sharp from 'sharp'
import type { DrawPath, Point } from '../../shared/types.js'

const require = createRequire(import.meta.url)

let cv: any = null
let cvError: string | null = null

// 同步加载 OpenCV（使用本地 WASM 文件，~75ms）
try {
  const { cv: cvInstance } = require('@dalongrong/opencv-wasm')
  cv = cvInstance
} catch (err) {
  cvError = err instanceof Error ? err.message : 'OpenCV 加载失败'
}

async function decodePNG(buffer: Buffer): Promise<{ mat: any; width: number; height: number }> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  // 转灰度：取 R 通道（灰度 PNG 三通道值相同）
  const grayData = new Uint8Array(width * height)
  for (let i = 0; i < width * height; i++) {
    grayData[i] = data[i * channels]
  }

  const mat = cv.matFromArray(height, width, cv.CV_8UC1, Array.from(grayData))
  return { mat, width, height }
}

if (parentPort) {
  const port = parentPort

  port.on('message', async (msg: { type: string; lineArtBuffer?: ArrayBuffer }) => {
    if (msg.type !== 'extract' || !msg.lineArtBuffer) return

    if (cvError) {
      port.postMessage({ type: 'error', message: cvError })
      return
    }

    try {
      const buffer = Buffer.from(msg.lineArtBuffer)
      const { mat: gray, width, height } = await decodePNG(buffer)

      if (gray.empty()) {
        port.postMessage({ type: 'error', message: '无法解码线稿图片' })
        return
      }

      const binary = new cv.Mat()
      cv.threshold(gray, binary, 128, 255, cv.THRESH_BINARY)

      const inverted = new cv.Mat()
      cv.bitwise_not(binary, inverted)

      const contours = new cv.MatVector()
      const hierarchy = new cv.Mat()
      cv.findContours(inverted, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_NONE)

      const paths: DrawPath[] = []

      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i)

        if (contour.rows < 3) {
          contour.delete()
          continue
        }

        const approx = new cv.Mat()
        cv.approxPolyDP(contour, approx, 1.0, false)
        contour.delete()

        if (approx.rows < 3) {
          approx.delete()
          continue
        }

        const points: Point[] = []
        for (let r = 0; r < approx.rows; r++) {
          const x = approx.data32S[r * 2]
          const y = approx.data32S[r * 2 + 1]
          if (x >= 0 && x < gray.cols && y >= 0 && y < gray.rows) {
            points.push({ x, y })
          }
        }
        approx.delete()

        if (points.length >= 3) {
          paths.push(points)
        }
      }

      contours.delete()
      hierarchy.delete()
      binary.delete()
      inverted.delete()
      gray.delete()

      if (paths.length === 0) {
        port.postMessage({
          type: 'error',
          message: '未检测到可绘制线条',
        })
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
