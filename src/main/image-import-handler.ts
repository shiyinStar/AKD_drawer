import { access, readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import type { AppContext } from './app-context.js'

const acceptedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp']

const magicBytes: Record<string, number[][]> = {
  '.png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  '.jpg': [[0xff, 0xd8, 0xff]],
  '.jpeg': [[0xff, 0xd8, 0xff]],
  '.bmp': [[0x42, 0x4d]],
}

function checkMagicBytes(buffer: Buffer, ext: string): boolean {
  const signatures = magicBytes[ext]
  if (!signatures) return false
  return signatures.some((sig) => {
    if (buffer.length < sig.length) return false
    return sig.every((byte, i) => buffer[i] === byte)
  })
}

function checkWebpMagic(buffer: Buffer): boolean {
  if (buffer.length < 12) return false
  return (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  )
}

function validateFormat(filePath: string, buffer: Buffer): string | null {
  const ext = extname(filePath).toLowerCase()
  if (!acceptedExtensions.includes(ext)) {
    return `不支持的文件格式: ${ext || '未知'}`
  }
  if (ext === '.webp') {
    if (!checkWebpMagic(buffer)) return '文件头校验失败，文件可能已损坏'
  } else {
    if (!checkMagicBytes(buffer, ext)) return '文件头校验失败，文件可能已损坏'
  }
  return null
}

export interface ImportResult {
  success: boolean
  reason?: string
  dataUrl?: string
  fileName?: string
}

export async function handleImportImage(
  filePath: string,
  ctx: AppContext,
): Promise<ImportResult> {
  try {
    await access(filePath)
  } catch {
    return { success: false, reason: '文件不存在或无法访问' }
  }

  let buffer: Buffer
  try {
    buffer = await readFile(filePath)
  } catch {
    return { success: false, reason: '无法读取文件' }
  }

  const formatError = validateFormat(filePath, buffer)
  if (formatError) {
    return { success: false, reason: formatError }
  }

  ctx.imageBuffer = buffer
  ctx.imagePath = filePath

  const mimeMap: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
  }
  const ext = extname(filePath).toLowerCase()
  const mime = mimeMap[ext] ?? 'image/png'
  const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`
  const fileName = basename(filePath)

  return {
    success: true,
    dataUrl,
    fileName,
  }
}
