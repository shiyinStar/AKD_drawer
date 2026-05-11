import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { handleImportImage } from '../../src/main/image-import-handler.js'
import type { AppContext } from '../../src/main/app-context.js'

// 最小有效 1×1 红色 PNG（67 字节）
const MINIMAL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='

// 最小有效 1×1 JPEG
const MINIMAL_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwD/2Q=='

function createMockContext(): AppContext {
  return {
    stateMachine: null as unknown as AppContext['stateMachine'],
    configStore: null as unknown as AppContext['configStore'],
    mainWindow: null,
    imageBuffer: null,
    imagePath: null,
    width: 0,
    height: 0,
  }
}

describe('handleImportImage', () => {
  let tmpDir: string
  let validPngPath: string
  let validJpgPath: string
  let txtFilePath: string
  let fakePngPath: string

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'akd-import-test-'))

    validPngPath = join(tmpDir, 'test.png')
    writeFileSync(validPngPath, Buffer.from(MINIMAL_PNG_BASE64, 'base64'))

    validJpgPath = join(tmpDir, 'test.jpg')
    writeFileSync(validJpgPath, Buffer.from(MINIMAL_JPEG_BASE64, 'base64'))

    txtFilePath = join(tmpDir, 'test.txt')
    writeFileSync(txtFilePath, 'this is not an image')

    // .png 扩展名但内容非 PNG（magic bytes 校验失败场景）
    fakePngPath = join(tmpDir, 'fake.png')
    writeFileSync(fakePngPath, 'this is not a PNG file')
  })

  after(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('合法 PNG 文件 → success: true，含 dataUrl', async () => {
    const ctx = createMockContext()
    const result = await handleImportImage(validPngPath, ctx)

    assert.strictEqual(result.success, true)
    assert.ok(result.dataUrl)
    assert.ok(result.dataUrl!.startsWith('data:image/png;base64,'))
    assert.ok(result.fileName)
    assert.strictEqual(result.fileName, 'test.png')
  })

  it('合法 JPG 文件 → success: true，含 dataUrl', async () => {
    const ctx = createMockContext()
    const result = await handleImportImage(validJpgPath, ctx)

    assert.strictEqual(result.success, true)
    assert.ok(result.dataUrl)
    assert.ok(result.dataUrl!.startsWith('data:image/jpeg;base64,'))
  })

  it('合法 PNG → imageBuffer 和 imagePath 存入 context', async () => {
    const ctx = createMockContext()
    await handleImportImage(validPngPath, ctx)

    assert.ok(ctx.imageBuffer)
    assert.ok(ctx.imageBuffer!.length > 0)
    assert.strictEqual(ctx.imagePath, validPngPath)
  })

  it('不存在的文件路径 → success: false', async () => {
    const ctx = createMockContext()
    const result = await handleImportImage(join(tmpDir, 'does-not-exist.png'), ctx)

    assert.strictEqual(result.success, false)
    assert.ok(result.reason)
    assert.ok(result.reason!.includes('不存在') || result.reason!.includes('无法访问'))
  })

  it('不支持的文件扩展名 (.txt) → success: false', async () => {
    const ctx = createMockContext()
    const result = await handleImportImage(txtFilePath, ctx)

    assert.strictEqual(result.success, false)
    assert.ok(result.reason)
    assert.ok(result.reason!.includes('不支持的文件格式'))
  })

  it('不支持的文件扩展名 (.pdf 等) → success: false', async () => {
    const ctx = createMockContext()
    const pdfPath = join(tmpDir, 'doc.pdf')
    writeFileSync(pdfPath, 'fake pdf')
    const result = await handleImportImage(pdfPath, ctx)

    assert.strictEqual(result.success, false)
    assert.ok(result.reason)
  })

  it('.png 扩展名但内容非 PNG → success: false（magic bytes 校验）', async () => {
    const ctx = createMockContext()
    const result = await handleImportImage(fakePngPath, ctx)

    assert.strictEqual(result.success, false)
    assert.ok(result.reason)
    assert.ok(result.reason!.includes('校验失败') || result.reason!.includes('损坏'))
  })

  it('导入失败不覆盖 context 中原有数据', async () => {
    const ctx = createMockContext()
    ctx.imageBuffer = Buffer.from('previous')
    ctx.imagePath = '/some/old/path.png'

    await handleImportImage(txtFilePath, ctx)

    assert.strictEqual(ctx.imagePath, '/some/old/path.png')
    assert.strictEqual(ctx.imageBuffer!.toString(), 'previous')
  })
})
