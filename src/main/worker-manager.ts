import { Worker } from 'node:worker_threads'
import type { DrawPath } from '../shared/types.js'

const INFERENCE_TIMEOUT_MS = 30_000
const PATH_EXTRACTION_TIMEOUT_MS = 60_000

export function runInference(
  modelPath: string,
  imageBuffer: Buffer,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const workerUrl = new URL('../../workers/inference/worker.js', import.meta.url)

    const worker = new Worker(workerUrl, {
      workerData: { modelPath },
    })

    const timeoutTimer = setTimeout(() => {
      worker.terminate()
      reject(new Error('推理超时，请重试'))
    }, INFERENCE_TIMEOUT_MS)

    worker.on('message', (msg: { type: string; lineArtBuffer?: ArrayBuffer; message?: string }) => {
      clearTimeout(timeoutTimer)
      if (msg.type === 'result' && msg.lineArtBuffer) {
        const resultBuffer = Buffer.from(msg.lineArtBuffer)
        worker.terminate()
        resolve(resultBuffer)
      } else if (msg.type === 'error') {
        worker.terminate()
        reject(new Error(msg.message ?? '推理失败'))
      }
    })

    worker.on('error', (err) => {
      clearTimeout(timeoutTimer)
      worker.terminate()
      reject(err)
    })

    worker.on('messageerror', () => {
      clearTimeout(timeoutTimer)
      worker.terminate()
      reject(new Error('Worker 消息反序列化失败'))
    })

    const buffer = imageBuffer.buffer.slice(
      0,
      imageBuffer.byteLength,
    ) as ArrayBuffer

    worker.postMessage(
      {
        type: 'infer',
        imageBuffer: buffer,
      },
      [buffer],
    )
  })
}

export function runPathExtraction(
  lineArtBuffer: Buffer,
): Promise<{ paths: DrawPath[] }> {
  return new Promise((resolve, reject) => {
    const workerUrl = new URL('../../workers/path-extraction/worker.js', import.meta.url)

    const worker = new Worker(workerUrl)

    const timeoutTimer = setTimeout(() => {
      worker.terminate()
      reject(new Error('路径提取超时，请重试'))
    }, PATH_EXTRACTION_TIMEOUT_MS)

    worker.on('message', (msg: { type: string; paths?: DrawPath[]; message?: string }) => {
      clearTimeout(timeoutTimer)
      if (msg.type === 'result' && msg.paths) {
        worker.terminate()
        resolve({ paths: msg.paths })
      } else if (msg.type === 'error') {
        worker.terminate()
        reject(new Error(msg.message ?? '路径提取失败'))
      }
    })

    worker.on('error', (err) => {
      clearTimeout(timeoutTimer)
      worker.terminate()
      reject(err)
    })

    worker.on('messageerror', () => {
      clearTimeout(timeoutTimer)
      worker.terminate()
      reject(new Error('Worker 消息反序列化失败'))
    })

    const buffer = lineArtBuffer.buffer.slice(
      0,
      lineArtBuffer.byteLength,
    ) as ArrayBuffer

    worker.postMessage(
      {
        type: 'extract',
        lineArtBuffer: buffer,
      },
      [buffer],
    )
  })
}
