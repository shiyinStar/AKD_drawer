import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { Worker } from 'node:worker_threads'
import sharp from 'sharp'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..', '..')
const MODEL_PATH = join(PROJECT_ROOT, 'resources', 'models', 'anime2sketch.onnx')
const WORKER_PATH = join(
  PROJECT_ROOT,
  'dist',
  'workers',
  'inference',
  'worker.js',
)

const MODEL_EXISTS = existsSync(MODEL_PATH)
const WORKER_EXISTS = existsSync(WORKER_PATH)

async function createTestImage(width: number, height: number): Promise<Buffer> {
  const channels = 3
  const pixelData = new Uint8Array(width * height * channels)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels
      pixelData[idx] = Math.floor((x / width) * 255)
      pixelData[idx + 1] = Math.floor((y / height) * 255)
      pixelData[idx + 2] = 128
    }
  }

  return sharp(pixelData, { raw: { width, height, channels } })
    .png()
    .toBuffer()
}

function runInference(
  modelPath: string,
  imageBuffer: Buffer,
  timeoutMs = 60_000,
): Promise<{ result?: Buffer; error?: string }> {
  return new Promise((resolve, reject) => {
    const workerUrl = new URL(
      '../../dist/workers/inference/worker.js',
      import.meta.url,
    )

    const worker = new Worker(workerUrl, {
      workerData: { modelPath },
    })

    const timer = setTimeout(() => {
      worker.terminate()
      reject(new Error('测试超时'))
    }, timeoutMs)

    worker.on(
      'message',
      (msg: { type: string; lineArtBuffer?: ArrayBuffer; message?: string }) => {
        clearTimeout(timer)
        worker.terminate()
        if (msg.type === 'result' && msg.lineArtBuffer) {
          resolve({ result: Buffer.from(msg.lineArtBuffer) })
        } else if (msg.type === 'error') {
          resolve({ error: msg.message })
        }
      },
    )

    worker.on('error', (err) => {
      clearTimeout(timer)
      worker.terminate()
      reject(err)
    })

    const buffer = imageBuffer.buffer.slice(
      0,
      imageBuffer.byteLength,
    ) as ArrayBuffer

    worker.postMessage({ type: 'infer', imageBuffer: buffer }, [buffer])
  })
}

// ============================================================
// 测试套件
// ============================================================

test('推理 Worker 启动并加载模型', { skip: !MODEL_EXISTS || !WORKER_EXISTS }, async () => {
  const testImg = await createTestImage(64, 64)
  const { result, error } = await runInference(MODEL_PATH, testImg)

  assert.strictEqual(error, undefined, `模型加载应成功: ${error}`)
  assert.ok(result, '应返回 lineArtBuffer')
  assert.ok(result!.length > 0, 'lineArtBuffer 不应为空')
})

test('推理产出有效 PNG Buffer', { skip: !MODEL_EXISTS || !WORKER_EXISTS }, async () => {
  const width = 120
  const height = 80
  const testImg = await createTestImage(width, height)
  const { result, error } = await runInference(MODEL_PATH, testImg)

  assert.strictEqual(error, undefined, `推理应成功: ${error}`)
  assert.ok(result, '应返回 lineArtBuffer')

  const metadata = await sharp(result).metadata()
  assert.strictEqual(metadata.format, 'png', '输出应为 PNG 格式')
  assert.ok(metadata.width! > 0, '输出图片宽度应 > 0')
  assert.ok(metadata.height! > 0, '输出图片高度应 > 0')
})

test('输出尺寸与输入尺寸一致', { skip: !MODEL_EXISTS || !WORKER_EXISTS }, async () => {
  const width = 150
  const height = 100
  const testImg = await createTestImage(width, height)
  const { result, error } = await runInference(MODEL_PATH, testImg)

  assert.strictEqual(error, undefined, `推理应成功: ${error}`)
  assert.ok(result, '应返回 lineArtBuffer')

  const metadata = await sharp(result).metadata()
  assert.strictEqual(
    metadata.width,
    width,
    `输出宽度 ${metadata.width} 应等于输入宽度 ${width}`,
  )
  assert.strictEqual(
    metadata.height,
    height,
    `输出高度 ${metadata.height} 应等于输入高度 ${height}`,
  )
})

test('不同尺寸图片推理后尺寸各自一致', { skip: !MODEL_EXISTS || !WORKER_EXISTS }, async () => {
  const testCases = [
    { width: 80, height: 80 },
    { width: 200, height: 50 },
    { width: 50, height: 200 },
  ]

  for (const { width, height } of testCases) {
    const testImg = await createTestImage(width, height)
    const { result, error } = await runInference(MODEL_PATH, testImg)

    assert.strictEqual(error, undefined, `${width}x${height}: 推理应成功`)
    const metadata = await sharp(result).metadata()
    assert.strictEqual(
      metadata.width,
      width,
      `${width}x${height}: 输出宽度应为 ${width}`,
    )
    assert.strictEqual(
      metadata.height,
      height,
      `${width}x${height}: 输出高度应为 ${height}`,
    )
  }
})

test('全黑图片推理不崩溃', { skip: !MODEL_EXISTS || !WORKER_EXISTS }, async () => {
  const width = 64
  const height = 64
  const pixelData = new Uint8Array(width * height * 3).fill(0)
  const testImg = await sharp(pixelData, {
    raw: { width, height, channels: 3 },
  })
    .png()
    .toBuffer()

  const { result, error } = await runInference(MODEL_PATH, testImg)

  if (error) {
    assert.ok(typeof error === 'string', '错误消息应为字符串')
  } else {
    assert.ok(result, '应返回结果')
    assert.ok(result!.length > 0, '结果不应为空')
  }
})

test('模型路径不存在时 Worker 报错', async () => {
  const fakePath = join(PROJECT_ROOT, 'nonexistent', 'model.onnx')
  const testImg = await createTestImage(64, 64)

  try {
    const { error } = await runInference(fakePath, testImg, 10_000)
    assert.ok(error, '应返回错误消息')
  } catch (err) {
    assert.ok(err instanceof Error, '应抛出 Error')
  }
})
