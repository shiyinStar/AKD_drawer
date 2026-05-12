import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

;(globalThis as any).Module = {
  onRuntimeInitialized: () => {
    console.log('OpenCV runtime initialized!')
  },
}

console.log('Loading opencv.js via require...')
const startTime = Date.now()

try {
  const cv = require('@techstark/opencv-js')
  console.log(`require returned after ${Date.now() - startTime}ms`)
  console.log('Type of cv:', typeof cv)
  console.log('cv is Promise:', cv instanceof Promise)

  if (cv instanceof Promise) {
    console.log('Awaiting cv Promise...')
    const timer = setTimeout(() => {
      console.log(`TIMEOUT after ${Date.now() - startTime}ms`)
      process.exit(1)
    }, 30_000)

    cv.then(
      (result) => {
        clearTimeout(timer)
        console.log(`Resolved after ${Date.now() - startTime}ms, type: ${typeof result}`)
        process.exit(0)
      },
      (err) => {
        clearTimeout(timer)
        console.error(`Rejected: ${err}`)
        process.exit(1)
      },
    )
  } else {
    console.log('Keys:', Object.keys(cv).slice(0, 10))
    console.log('Has Mat:', 'Mat' in cv)
    process.exit(0)
  }
} catch (err) {
  console.error(`Error:`, err)
  process.exit(1)
}
