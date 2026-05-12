const startTime = Date.now()

console.log('Importing @techstark/opencv-js via ESM import()...')

try {
  const m = await import('@techstark/opencv-js')
  console.log(`Imported after ${Date.now() - startTime}ms`)
  console.log('default type:', typeof m.default)

  const cvModule = m.default
  console.log('cvModule is Promise:', cvModule instanceof Promise)

  if (cvModule instanceof Promise) {
    console.log('Awaiting cvModule Promise...')
    const timeout = setTimeout(() => {
      console.log(`TIMEOUT after ${Date.now() - startTime}ms`)
      process.exit(1)
    }, 120_000)

    try {
      const cv = await cvModule
      clearTimeout(timeout)
      console.log(`Resolved after ${Date.now() - startTime}ms`)
      console.log('cv type:', typeof cv)
      console.log('Has Mat:', 'Mat' in cv)
      console.log('Has threshold:', typeof cv.threshold)
      process.exit(0)
    } catch (err) {
      clearTimeout(timeout)
      console.error(`Rejected:`, err)
      process.exit(1)
    }
  } else {
    console.log('Has Mat:', 'Mat' in cvModule)
    if (!('Mat' in cvModule)) {
      console.log('Waiting for onRuntimeInitialized...')
      const timeout = setTimeout(() => {
        console.log(`TIMEOUT after ${Date.now() - startTime}ms`)
        process.exit(1)
      }, 120_000)

      cvModule.onRuntimeInitialized = () => {
        clearTimeout(timeout)
        console.log(`Runtime initialized after ${Date.now() - startTime}ms`)
        console.log('Has Mat:', 'Mat' in cvModule)
        process.exit(0)
      }
    } else {
      console.log('Already ready!')
      process.exit(0)
    }
  }
} catch (err) {
  console.error(`Import failed:`, err)
  process.exit(1)
}
