import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { cv } = require('@dalongrong/opencv-wasm')

const names = [
  'imdecode', 'imencode', 'imread', 'imwrite',
  'threshold', 'bitwise_not', 'findContours', 'approxPolyDP', 'cvtColor', 'Canny',
  'Mat', 'MatVector', 'matFromArray', 'Size', 'Point', 'Scalar',
  'imshow', 'imread', 'VideoCapture',
  'CHAIN_APPROX_NONE', 'RETR_LIST', 'THRESH_BINARY', 'IMREAD_GRAYSCALE',
  'CV_8UC1', 'CV_8UC3',
]

console.log(`OpenCV version:`, cv.version?.opencv)
console.log('')
for (const name of names) {
  const t = typeof cv[name]
  console.log(`${name}: ${t}${t === 'number' ? ' = ' + cv[name] : ''}`)
}
