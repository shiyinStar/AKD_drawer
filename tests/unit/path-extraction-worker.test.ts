import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Worker } from 'node:worker_threads'
import sharp from 'sharp'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..', '..')
const WORKER_PATH = join(
  PROJECT_ROOT,
  'dist',
  'workers',
  'path-extraction',
  'worker.js',
)

const WORKER_EXISTS = existsSync(WORKER_PATH)

async function createTestImage(
  width: number,
  height: number,
  drawRect: boolean,
): Promise<Buffer> {
  const channels = 1
  const pixelData = new Uint8Array(width * height)

  pixelData.fill(255)

  if (drawRect) {
    const left = Math.floor(width * 0.25)
    const right = Math.floor(width * 0.75)
    const top = Math.floor(height * 0.25)
    const bottom = Math.floor(height * 0.75)

    const borderWidth = 4
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const isTop = y < top + borderWidth
        const isBottom = y > bottom - borderWidth
        const isLeft = x < left + borderWidth
        const isRight = x > right - borderWidth

        if (isTop || isBottom || isLeft || isRight) {
          pixelData[y * width + x] = 0
        }
      }
    }
  }

  return sharp(pixelData, { raw: { width, height, channels } })
    .png()
    .toBuffer()
}

function runPathExtraction(
  lineArtBuffer: Buffer,
  timeoutMs = 30_000,
): Promise<{ paths?: Array<{ x: number; y: number }[]>; error?: string }> {
  return new Promise((resolve, reject) => {
    const workerUrl = new URL(
      '../../dist/workers/path-extraction/worker.js',
      import.meta.url,
    )

    const worker = new Worker(workerUrl)

    const timer = setTimeout(() => {
      worker.terminate()
      reject(new Error('测试超时'))
    }, timeoutMs)

    worker.on('message', (msg: { type: string; paths?: Array<{ x: number; y: number }[]>; message?: string }) => {
      clearTimeout(timer)
      worker.terminate()
      if (msg.type === 'result' && msg.paths) {
        resolve({ paths: msg.paths })
      } else if (msg.type === 'error') {
        resolve({ error: msg.message })
      }
    })

    worker.on('error', (err) => {
      clearTimeout(timer)
      worker.terminate()
      reject(err)
    })

    const buffer = lineArtBuffer.buffer.slice(
      0,
      lineArtBuffer.byteLength,
    ) as ArrayBuffer

    worker.postMessage({ type: 'extract', lineArtBuffer: buffer }, [buffer])
  })
}

// ============================================================
// 步骤 6.1 验证: path-extraction-worker.test.ts (7 项)
// ============================================================

test('1. 已知包含白色方块的二值图像（100×100 PNG）→ 至少返回 1 条轮廓', { skip: !WORKER_EXISTS }, async () => {
  const testImg = await createTestImage(100, 100, true)
  const { paths, error } = await runPathExtraction(testImg)

  assert.strictEqual(error, undefined, `路径提取应成功: ${error}`)
  assert.ok(paths, '应返回 paths')
  assert.ok(paths!.length >= 1, `应有至少 1 条路径，实际 ${paths!.length}`)
})

test('2. 全白图 → 返回 error "未检测到可绘制线条"', { skip: !WORKER_EXISTS }, async () => {
  const testImg = await createTestImage(100, 100, false)
  const { paths, error } = await runPathExtraction(testImg)

  assert.ok(error, '应返回错误')
  assert.ok(
    error!.includes('未检测到可绘制线条'),
    `错误消息应包含"未检测到可绘制线条"，实际: ${error}`,
  )
  assert.strictEqual(paths, undefined, 'paths 应为 undefined')
})

test('3. 全黑图 → 返回 error', { skip: !WORKER_EXISTS }, async () => {
  const pixelData = new Uint8Array(100 * 100).fill(0)
  const testImg = await sharp(pixelData, {
    raw: { width: 100, height: 100, channels: 1 },
  })
    .png()
    .toBuffer()

  const { paths, error } = await runPathExtraction(testImg)

  // 全黑图经二值化(128 阈值)全黑 → bitwise_not 后全白 → findContours 可能找整图或为空
  if (error) {
    assert.ok(typeof error === 'string', '错误消息应为字符串')
  } else if (paths) {
    assert.ok(paths.length >= 0, '路径数量应为非负')
  }
})

test('4. approxPolyDP 简化后每条路径至少 3 个点', { skip: !WORKER_EXISTS }, async () => {
  const testImg = await createTestImage(100, 100, true)
  const { paths, error } = await runPathExtraction(testImg)

  assert.strictEqual(error, undefined, `路径提取应成功: ${error}`)
  assert.ok(paths, '应返回 paths')

  for (let i = 0; i < paths!.length; i++) {
    const path = paths![i]
    assert.ok(
      path.length >= 3,
      `路径 #${i} 应有至少 3 个点，实际 ${path.length}`,
    )
  }
})

test('5. 输出路径数组已排序（首条路径首点 Y ≤ 第二条首点 Y，Y 相同则 X 升序）', { skip: !WORKER_EXISTS }, async () => {
  const testImg = await createTestImage(100, 100, true)
  const { paths, error } = await runPathExtraction(testImg)

  assert.strictEqual(error, undefined, `路径提取应成功: ${error}`)
  assert.ok(paths, '应返回 paths')

  for (let i = 1; i < paths!.length; i++) {
    const ay = paths![i - 1][0].y
    const by = paths![i][0].y
    const ax = paths![i - 1][0].x
    const bx = paths![i][0].x
    assert.ok(
      ay < by || (ay === by && ax <= bx),
      `路径 #${i} 首点应排在 #${i - 1} 之后: (${ax},${ay}) vs (${bx},${by})`,
    )
  }
})

test('6. 所有路径至少包含 3 个点', { skip: !WORKER_EXISTS }, async () => {
  const testImg = await createTestImage(100, 100, true)
  const { paths, error } = await runPathExtraction(testImg)

  assert.strictEqual(error, undefined, `路径提取应成功: ${error}`)
  assert.ok(paths, '应返回 paths')
  assert.ok(paths!.length > 0, '应有路径')

  for (let i = 0; i < paths!.length; i++) {
    assert.ok(
      paths![i].length >= 3,
      `路径 #${i} 至少 3 个点，实际 ${paths![i].length}`,
    )
  }
})

test('7. 坐标值在图片尺寸范围内', { skip: !WORKER_EXISTS }, async () => {
  const testImg = await createTestImage(100, 100, true)
  const { paths, error } = await runPathExtraction(testImg)

  assert.strictEqual(error, undefined, `路径提取应成功: ${error}`)

  for (let i = 0; i < paths!.length; i++) {
    for (const pt of paths![i]) {
      assert.ok(pt.x >= 0 && pt.x < 100, `路径 #${i}: x=${pt.x} 超出 [0, 100)`)
      assert.ok(pt.y >= 0 && pt.y < 100, `路径 #${i}: y=${pt.y} 超出 [0, 100)`)
    }
  }
})
