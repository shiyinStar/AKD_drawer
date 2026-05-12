interface Point { x: number; y: number }
interface DrawPath extends Array<Point> {}

interface BoundingBox { minX: number; minY: number; width: number; height: number }

interface OverlayData {
  paths: DrawPath[]
  boundingBox: BoundingBox
  lineColor: string
}

declare global {
  interface Window {
    overlayAPI: {
      onInit(callback: (data: OverlayData) => void): void
      onSetInteractive(callback: (interactive: boolean) => void): void
      setBounds(bounds: { x: number; y: number; width: number; height: number }): Promise<void>
      sendScaleChanged(scale: number, width: number, height: number): void
    }
  }
}

const canvas = document.getElementById('overlay-canvas') as HTMLCanvasElement
const scaleLabel = document.getElementById('scale-label') as HTMLDivElement

let paths: DrawPath[] = []
let boundingBox: BoundingBox = { minX: 0, minY: 0, width: 1, height: 1 }
let lineColor = '#000000'
let interactive = false
let isDragging = false
let isResizing = false
let resizeCorner: 'nw' | 'ne' | 'sw' | 'se' | null = null
let dragStartX = 0
let dragStartY = 0
let winStartX = 0
let winStartY = 0
let winStartW = 0
let winStartH = 0
const CORNER_SIZE = 8
const CORNER_HIT = 16

function getDpr(): number {
  return window.devicePixelRatio || 1
}

function resizeCanvas(): void {
  const w = window.innerWidth
  const h = window.innerHeight
  const dpr = getDpr()
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function render(): void {
  const ctx = canvas.getContext('2d')!
  const w = window.innerWidth
  const h = window.innerHeight
  ctx.clearRect(0, 0, w, h)

  const scaleX = boundingBox.width > 0 ? w / boundingBox.width : 1
  const scaleY = boundingBox.height > 0 ? h / boundingBox.height : 1

  function toCanvas(px: number, py: number): [number, number] {
    return [
      (px - boundingBox.minX) * scaleX,
      (py - boundingBox.minY) * scaleY,
    ]
  }

  ctx.strokeStyle = lineColor
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.imageSmoothingEnabled = true

  for (const path of paths) {
    if (path.length < 2) continue
    ctx.beginPath()
    const [sx, sy] = toCanvas(path[0].x, path[0].y)
    ctx.moveTo(sx, sy)
    for (let i = 1; i < path.length; i++) {
      const [px, py] = toCanvas(path[i].x, path[i].y)
      ctx.lineTo(px, py)
    }
    ctx.stroke()
  }

  ctx.strokeStyle = lineColor
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.rect(1, 1, w - 2, h - 2)
  ctx.stroke()
  ctx.setLineDash([])

  if (interactive) {
    ctx.fillStyle = '#6366f1'
    const corners: [number, number][] = [
      [0, 0],
      [w - CORNER_SIZE, 0],
      [0, h - CORNER_SIZE],
      [w - CORNER_SIZE, h - CORNER_SIZE],
    ]
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx, cy, CORNER_SIZE, CORNER_SIZE)
    }
  }
}

function updateScale(): void {
  const refW = boundingBox.width || 1
  const s = window.innerWidth / refW
  window.overlayAPI.sendScaleChanged(
    Math.round(s * 100) / 100,
    window.innerWidth,
    window.innerHeight,
  )
}

function showScaleLabel(text: string): void {
  scaleLabel.textContent = text
  scaleLabel.classList.add('visible')
}

function hideScaleLabel(): void {
  scaleLabel.classList.remove('visible')
}

function getCornerUnderMouse(mx: number, my: number): 'nw' | 'ne' | 'sw' | 'se' | null {
  const w = window.innerWidth
  const h = window.innerHeight
  const corners: Record<string, [number, number]> = {
    nw: [0, 0],
    ne: [w, 0],
    sw: [0, h],
    se: [w, h],
  }
  for (const [key, [cx, cy]] of Object.entries(corners)) {
    if (Math.abs(mx - cx) <= CORNER_HIT && Math.abs(my - cy) <= CORNER_HIT) {
      return key as 'nw' | 'ne' | 'sw' | 'se'
    }
  }
  return null
}

function getCursorForCorner(corner: 'nw' | 'ne' | 'sw' | 'se'): string {
  switch (corner) {
    case 'nw': return 'nw-resize'
    case 'ne': return 'ne-resize'
    case 'sw': return 'sw-resize'
    case 'se': return 'se-resize'
  }
}

function setInteractive(active: boolean): void {
  interactive = active
  if (!active) {
    isDragging = false
    isResizing = false
    resizeCorner = null
    hideScaleLabel()
  }
  document.body.style.cursor = active ? 'grab' : 'default'
  render()
}

window.overlayAPI.onSetInteractive((active) => {
  setInteractive(active)
})

window.overlayAPI.onInit((data) => {
  paths = data.paths
  boundingBox = data.boundingBox
  lineColor = data.lineColor
  resizeCanvas()
  render()
  updateScale()
})

document.addEventListener('mousedown', (e) => {
  if (!interactive) return
  dragStartX = e.screenX
  dragStartY = e.screenY
  winStartX = window.screenX
  winStartY = window.screenY
  if (resizeCorner) {
    isResizing = true
    winStartW = window.innerWidth
    winStartH = window.innerHeight
    e.preventDefault()
  } else {
    isDragging = true
    document.body.style.cursor = 'grabbing'
    e.preventDefault()
  }
})

document.addEventListener('mousemove', (e) => {
  if (!interactive) return

  if (isResizing && resizeCorner) {
    const dx = e.screenX - dragStartX
    const dy = e.screenY - dragStartY
    const aspectRatio = winStartW / (winStartH || 1)
    const minW = boundingBox.width * 0.5
    const maxW = boundingBox.width * 3.0

    let newW: number
    let newH: number
    let newX = winStartX
    let newY = winStartY

    switch (resizeCorner) {
      case 'se':
        newW = winStartW + dx
        newH = newW / aspectRatio
        break
      case 'sw':
        newW = winStartW - dx
        newH = newW / aspectRatio
        newX = winStartX + (winStartW - newW)
        break
      case 'ne':
        newW = winStartW + dx
        newH = newW / aspectRatio
        newY = winStartY + (winStartH - newH)
        break
      case 'nw':
        newW = winStartW - dx
        newH = newW / aspectRatio
        newX = winStartX + (winStartW - newW)
        newY = winStartY + (winStartH - newH)
        break
    }

    newW = Math.max(minW, Math.min(maxW, newW!))
    newH = Math.max(minW / aspectRatio, Math.min(maxW / aspectRatio, newH!))

    window.overlayAPI.setBounds({
      x: Math.round(newX),
      y: Math.round(newY),
      width: Math.round(newW),
      height: Math.round(newH),
    })
    const s = newW / (boundingBox.width || 1)
    showScaleLabel(`${Math.round(s * 100) / 100}x  ${Math.round(newW)}×${Math.round(newH)}`)
  } else if (isDragging) {
    const dx = e.screenX - dragStartX
    const dy = e.screenY - dragStartY
    window.overlayAPI.setBounds({
      x: Math.round(winStartX + dx),
      y: Math.round(winStartY + dy),
      width: window.innerWidth,
      height: window.innerHeight,
    })
  } else {
    const corner = getCornerUnderMouse(e.clientX, e.clientY)
    resizeCorner = corner
    if (corner) {
      document.body.style.cursor = getCursorForCorner(corner)
    } else {
      document.body.style.cursor = 'grab'
    }
  }
})

document.addEventListener('mouseup', () => {
  if (isResizing) {
    isResizing = false
    resizeCorner = null
    hideScaleLabel()
    updateScale()
  }
  isDragging = false
  if (interactive) {
    document.body.style.cursor = 'grab'
  }
})

window.addEventListener('resize', () => {
  resizeCanvas()
  render()
  updateScale()
})
