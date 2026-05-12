import { parentPort } from 'node:worker_threads'

async function main() {
  try {
    const m = await import('@techstark/opencv-js')
    parentPort?.postMessage({ stage: 'imported', defaultType: typeof m.default })
    const cv = await (m.default ?? m)
    parentPort?.postMessage({ stage: 'loaded', cvType: typeof cv })
  } catch (err) {
    parentPort?.postMessage({ stage: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}

parentPort?.on('message', () => main())
