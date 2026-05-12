import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Worker } from 'node:worker_threads'
import sharp from 'sharp'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..', '..')
const MODEL_PATH = join(PROJECT_ROOT, 'resources', 'models', 'anime2sketch.onnx')
const INFERENCE_WORKER_PATH = join(PROJECT_ROOT, 'dist', 'workers', 'inference', 'worker.js')
const EXTRACTION_WORKER_PATH = join(PROJECT_ROOT, 'dist', 'workers', 'path-extraction', 'worker.js')

const MODEL_EXISTS = existsSync(MODEL_PATH)
const WORKERS_EXIST = existsSync(INFERENCE_WORKER_PATH) && existsSync(EXTRACTION_WORKER_PATH)

interface ImageSource {
  label: string
  getBuffer: () => Promise<Buffer>
}

async function selectImageSource(): Promise<ImageSource> {
  const sources: ImageSource[] = []

  // 环境变量指定路径
  const envPath = process.env['TEST_IMAGE_PATH']
  if (envPath && existsSync(envPath)) {
    sources.push({
      label: `TEST_IMAGE_PATH: ${envPath}`,
      getBuffer: async () => readFileSync(envPath),
    })
  }

  // 合成测试图 1: 带黑色矩形边框
  sources.push({
    label: '合成图: 100×100 黑色矩形边框',
    getBuffer: async () => {
      const pixels = new Uint8Array(100 * 100)
      pixels.fill(255)
      for (let y = 25; y <= 75; y++) {
        for (let x = 25; x <= 75; x++) {
          if (x < 29 || x > 71 || y < 29 || y > 71) pixels[y * 100 + x] = 0
        }
      }
      return sharp(pixels, { raw: { width: 100, height: 100, channels: 1 } }).png().toBuffer()
    },
  })

  // 合成测试图 2: 带垂直条纹
  sources.push({
    label: '合成图: 120×80 垂直条纹',
    getBuffer: async () => {
      const pixels = new Uint8Array(120 * 80)
      pixels.fill(255)
      for (let x = 20; x < 120; x += 25) {
        for (let y = 5; y < 75; y++) {
          if (Math.abs(x - Math.round(x / 25) * 25) < 2) pixels[y * 120 + x] = 0
        }
      }
      return sharp(pixels, { raw: { width: 120, height: 80, channels: 1 } }).png().toBuffer()
    },
  })

  // 交互式终端 → 让用户选择
  if (sources.length > 1 && process.stdin.isTTY) {
    return new Promise((resolve) => {
      const rl = createInterface({ input: process.stdin, output: process.stdout })
      console.log('\n可用测试图片:')
      sources.forEach((s, i) => console.log(`  [${i + 1}] ${s.label}`))
      rl.question(`选择 (1-${sources.length})，默认 1: `, (answer) => {
        rl.close()
        const idx = Math.max(0, Math.min(sources.length - 1, (parseInt(answer) || 1) - 1))
        console.log(`已选择: ${sources[idx].label}\n`)
        resolve(sources[idx])
      })
    })
  }

  return sources[0]
}

function runInference(
  modelPath: string,
  imageBuffer: Buffer,
  timeoutMs = 60_000,
): Promise<{ result?: Buffer; error?: string }> {
  return new Promise((resolve, reject) => {
    const workerUrl = new URL('../../dist/workers/inference/worker.js', import.meta.url)
    const worker = new Worker(workerUrl, { workerData: { modelPath } })

    const timer = setTimeout(() => { worker.terminate(); reject(new Error('推理超时')) }, timeoutMs)

    worker.on('message', (msg: { type: string; lineArtBuffer?: ArrayBuffer; message?: string }) => {
      clearTimeout(timer)
      worker.terminate()
      if (msg.type === 'result' && msg.lineArtBuffer) {
        resolve({ result: Buffer.from(msg.lineArtBuffer) })
      } else if (msg.type === 'error') {
        resolve({ error: msg.message })
      }
    })

    worker.on('error', (err) => { clearTimeout(timer); worker.terminate(); reject(err) })

    const buf = imageBuffer.buffer.slice(0, imageBuffer.byteLength) as ArrayBuffer
    worker.postMessage({ type: 'infer', imageBuffer: buf }, [buf])
  })
}

function runPathExtraction(
  lineArtBuffer: Buffer,
  timeoutMs = 30_000,
): Promise<{ paths?: Array<{ x: number; y: number }[]>; error?: string }> {
  return new Promise((resolve, reject) => {
    const workerUrl = new URL('../../dist/workers/path-extraction/worker.js', import.meta.url)
    const worker = new Worker(workerUrl)

    const timer = setTimeout(() => { worker.terminate(); reject(new Error('路径提取超时')) }, timeoutMs)

    worker.on('message', (msg: { type: string; paths?: Array<{ x: number; y: number }[]>; message?: string }) => {
      clearTimeout(timer)
      worker.terminate()
      if (msg.type === 'result' && msg.paths) resolve({ paths: msg.paths })
      else if (msg.type === 'error') resolve({ error: msg.message })
    })

    worker.on('error', (err) => { clearTimeout(timer); worker.terminate(); reject(err) })

    const buf = lineArtBuffer.buffer.slice(0, lineArtBuffer.byteLength) as ArrayBuffer
    worker.postMessage({ type: 'extract', lineArtBuffer: buf }, [buf])
  })
}

// 全局图片源（所有测试共享，仅加载一次）
let imageBuffer: Buffer | null = null
async function getImageBuffer(): Promise<Buffer> {
  if (!imageBuffer) {
    const source = await selectImageSource()
    console.log(`图片源: ${source.label}`)
    imageBuffer = await source.getBuffer()
    console.log(`图片大小: ${(imageBuffer.length / 1024).toFixed(1)} KB`)
  }
  return imageBuffer
}

// ============================================================
// 测试用例
// ============================================================

test('1. 完整流程 → 图片 → 推理 → 路径提取 → 返回路径和包围盒', { skip: !MODEL_EXISTS || !WORKERS_EXIST }, async () => {
  const img = await getImageBuffer()
  const { result: lineArtBuffer, error: inferError } = await runInference(MODEL_PATH, img)
  assert.strictEqual(inferError, undefined, `推理应成功: ${inferError}`)
  assert.ok(lineArtBuffer, '应返回 lineArtBuffer')

  const { paths, error: extractError } = await runPathExtraction(lineArtBuffer)
  assert.strictEqual(extractError, undefined, `路径提取应成功: ${extractError}`)
  assert.ok(paths, '应返回 paths')
  assert.ok(paths!.length > 0, `路径数量应 > 0，实际 ${paths!.length}`)

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of paths!) for (const pt of p) {
    if (pt.x < minX) minX = pt.x
    if (pt.y < minY) minY = pt.y
    if (pt.x > maxX) maxX = pt.x
    if (pt.y > maxY) maxY = pt.y
  }
  assert.ok(maxX - minX > 0, `boundingBox.width 应 > 0`)
  assert.ok(maxY - minY > 0, `boundingBox.height 应 > 0`)
})

test('2. 每条路径至少 3 个点', { skip: !MODEL_EXISTS || !WORKERS_EXIST }, async () => {
  const img = await getImageBuffer()
  const { result: lineArtBuffer, error: inferError } = await runInference(MODEL_PATH, img)
  assert.strictEqual(inferError, undefined, `推理应成功: ${inferError}`)
  const { paths, error: extractError } = await runPathExtraction(lineArtBuffer!)
  assert.strictEqual(extractError, undefined, `路径提取应成功: ${extractError}`)
  for (let i = 0; i < paths!.length; i++) {
    assert.ok(paths![i].length >= 3, `路径 #${i} 至少 3 个点，实际 ${paths![i].length}`)
  }
})

test('3. 路径坐标均在图片尺寸范围内', { skip: !MODEL_EXISTS || !WORKERS_EXIST }, async () => {
  const img = await getImageBuffer()
  const { result: lineArtBuffer, error: inferError } = await runInference(MODEL_PATH, img)
  assert.strictEqual(inferError, undefined, `推理应成功: ${inferError}`)
  const meta = await sharp(lineArtBuffer!).metadata()
  const imgW = meta.width!, imgH = meta.height!

  const { paths, error: extractError } = await runPathExtraction(lineArtBuffer!)
  assert.strictEqual(extractError, undefined, `路径提取应成功: ${extractError}`)
  for (let i = 0; i < paths!.length; i++) {
    for (const pt of paths![i]) {
      assert.ok(pt.x >= 0 && pt.x < imgW, `路径 #${i}: x=${pt.x} 超出 [0, ${imgW})`)
      assert.ok(pt.y >= 0 && pt.y < imgH, `路径 #${i}: y=${pt.y} 超出 [0, ${imgH})`)
    }
  }
})

test('4. 推理超时 → 返回 error', { skip: !MODEL_EXISTS || !WORKERS_EXIST }, async () => {
  const largePixels = new Uint8Array(2048 * 2048 * 3)
  for (let i = 0; i < largePixels.length; i++) largePixels[i] = Math.floor(Math.random() * 256)
  const largeImg = await sharp(largePixels, {
    raw: { width: 2048, height: 2048, channels: 3 },
  }).png().toBuffer()

  try {
    const { result, error } = await runInference(MODEL_PATH, largeImg, 40_000)
    if (error) assert.ok(typeof error === 'string')
    else assert.ok(result, '应返回结果')
  } catch (err) {
    assert.ok(err instanceof Error)
  }
})

test('5. 无有效线条 → 路径提取返回 error', { skip: !WORKERS_EXIST }, async () => {
  const pixels = new Uint8Array(100 * 100).fill(255)
  const whiteImg = await sharp(pixels, { raw: { width: 100, height: 100, channels: 1 } }).png().toBuffer()
  const { error } = await runPathExtraction(whiteImg)
  assert.ok(error, '应返回错误')
  assert.ok(error!.includes('未检测到可绘制线条'), `错误: ${error}`)
})
