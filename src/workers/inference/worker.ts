import { parentPort, workerData } from 'node:worker_threads'
import * as ort from 'onnxruntime-node'
import sharp from 'sharp'

const INFERENCE_TIMEOUT_MS = 30_000

interface WorkerMessage {
  type: 'infer'
  imageBuffer: ArrayBuffer
}

const { modelPath } = workerData as { modelPath: string }

let session: ort.InferenceSession | null = null

async function loadModel(path: string): Promise<ort.InferenceSession> {
  return ort.InferenceSession.create(path, {
    executionProviders: ['cpu'],
  })
}

async function preprocess(
  imageBuffer: ArrayBuffer,
): Promise<{ tensor: ort.Tensor; originalWidth: number; originalHeight: number }> {
  const buffer = Buffer.from(imageBuffer)
  const metadata = await sharp(buffer).metadata()
  const originalWidth = metadata.width ?? 512
  const originalHeight = metadata.height ?? 512

  const { data, info } = await sharp(buffer)
    .resize(512, 512, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info

  const chwData = new Float32Array(channels * height * width)
  for (let h = 0; h < height; h++) {
    for (let w = 0; w < width; w++) {
      for (let c = 0; c < channels; c++) {
        const hwcIdx = (h * width + w) * channels + c
        const chwIdx = c * height * width + h * width + w
        chwData[chwIdx] = (data[hwcIdx] / 255 - 0.5) / 0.5
      }
    }
  }

  const tensor = new ort.Tensor('float32', chwData, [1, channels, height, width])
  return { tensor, originalWidth, originalHeight }
}

async function postprocess(
  outputTensor: ort.Tensor,
  targetWidth: number,
  targetHeight: number,
): Promise<Buffer> {
  const outputData = outputTensor.data as Float32Array
  const pixelCount = 512 * 512

  const denormData = new Uint8Array(pixelCount)
  for (let i = 0; i < pixelCount; i++) {
    const val = (outputData[i] + 1) / 2 * 255
    denormData[i] = Math.round(Math.max(0, Math.min(255, val)))
  }

  return sharp(denormData, {
    raw: { width: 512, height: 512, channels: 1 },
  })
    .resize(targetWidth, targetHeight)
    .png()
    .toBuffer()
}

async function handleInfer(msg: WorkerMessage): Promise<void> {
  const timeoutTimer = setTimeout(() => {
    parentPort?.postMessage({
      type: 'error',
      message: '推理超时，请重试',
    })
    process.exit(1)
  }, INFERENCE_TIMEOUT_MS)

  try {
    if (!session) {
      session = await loadModel(modelPath)
    }

    const { tensor, originalWidth, originalHeight } = await preprocess(msg.imageBuffer)

    const feeds: Record<string, ort.Tensor> = { input: tensor }
    const results = await session.run(feeds)
    const outputKey = Object.keys(results)[0]
    const outputTensor = results[outputKey]

    const lineArtBuffer = await postprocess(outputTensor, originalWidth, originalHeight)

    clearTimeout(timeoutTimer)

    const resultBuffer = lineArtBuffer.buffer.slice(
      0,
      lineArtBuffer.byteLength,
    ) as ArrayBuffer

    parentPort?.postMessage(
      {
        type: 'result',
        lineArtBuffer: resultBuffer,
      },
      [resultBuffer],
    )
  } catch (err) {
    clearTimeout(timeoutTimer)
    const message = err instanceof Error ? err.message : '未知推理错误'
    parentPort?.postMessage({ type: 'error', message })
  }
}

parentPort?.on('message', (msg: WorkerMessage) => {
  if (msg.type === 'infer') {
    handleInfer(msg)
  }
})
