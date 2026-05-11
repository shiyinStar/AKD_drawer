import { Worker } from 'node:worker_threads'

const INFERENCE_TIMEOUT_MS = 30_000

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
