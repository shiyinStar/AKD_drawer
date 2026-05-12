import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const startTime = Date.now()

try {
  const { cv } = require('@dalongrong/opencv-wasm')
  console.log(`Loaded after ${Date.now() - startTime}ms`)
  console.log('cv type:', typeof cv)
  console.log('Has Mat:', 'Mat' in cv)
  console.log('Has threshold:', typeof cv.threshold)
  console.log('Has findContours:', typeof cv.findContours)
  console.log('Has approxPolyDP:', typeof cv.approxPolyDP)

  const mat = new cv.Mat()
  console.log('Mat created, empty():', mat.empty())
  mat.delete()
  console.log('OK')
} catch (err) {
  console.error(`Error after ${Date.now() - startTime}ms:`, err)
  process.exit(1)
}
