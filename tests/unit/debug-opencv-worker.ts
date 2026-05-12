import { Worker } from 'node:worker_threads'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const WORKER_PATH = join(__dirname, '..', '..', 'dist', 'workers', 'path-extraction', 'worker.js')

console.log('Worker path:', WORKER_PATH)

const worker = new Worker(WORKER_PATH)

const startTime = Date.now()
const timer = setTimeout(() => {
  console.log(`TIMEOUT after ${Date.now() - startTime}ms`)
  worker.terminate()
  process.exit(1)
}, 60_000)

worker.on('message', (msg) => {
  console.log(`${Date.now() - startTime}ms:`, JSON.stringify(msg))
  if (msg.type === 'result' || msg.type === 'error') {
    clearTimeout(timer)
    worker.terminate()
    process.exit(msg.type === 'error' ? 1 : 0)
  }
})

worker.on('error', (err) => {
  console.log('Worker error:', err.message)
  clearTimeout(timer)
  process.exit(1)
})

const pixelData = new Uint8Array(100 * 100)
pixelData.fill(255)
// 绘制黑色方块
for (let y = 25; y <= 75; y++) {
  for (let x = 25; x <= 75; x++) {
    if (x < 29 || x > 71 || y < 29 || y > 71) {
      pixelData[y * 100 + x] = 0
    }
  }
}

const testImg = await sharp(pixelData, {
  raw: { width: 100, height: 100, channels: 1 },
}).png().toBuffer()

const buffer = testImg.buffer.slice(0, testImg.byteLength) as ArrayBuffer
console.log('Sending image to worker...')
worker.postMessage({ type: 'extract', lineArtBuffer: buffer }, [buffer])
