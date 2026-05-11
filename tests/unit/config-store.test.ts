import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { ConfigStore } from '../../src/main/config-store.js'

describe('ConfigStore', () => {
  let store: ConfigStore
  let tmpDir: string

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'akd-config-test-'))
    store = new ConfigStore({ cwd: tmpDir })
  })

  after(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('get 返回 schema 默认值', () => {
    assert.strictEqual(store.get('drawSpeed'), 500)
    assert.strictEqual(store.get('mouseButton'), 'left')
    assert.strictEqual(store.get('overlayOpacity'), 0.6)
    assert.strictEqual(store.get('overlayLineColor'), '#000000')
  })

  it('getAll 返回完整配置对象', () => {
    const all = store.getAll()
    assert.strictEqual(typeof all, 'object')
    assert.strictEqual(all.drawSpeed, 500)
    assert.strictEqual(all.hotkeys.preview, 'F5')
    assert.strictEqual(all.hotkeys.startDraw, 'F6')
    assert.strictEqual(all.hotkeys.stopDraw, 'F7')
  })

  it('set 修改后 get 返回新值', () => {
    store.set('drawSpeed', 800)
    assert.strictEqual(store.get('drawSpeed'), 800)
    store.reset('drawSpeed')
  })

  it('reset 恢复默认值', () => {
    store.set('drawSpeed', 1200)
    store.reset('drawSpeed')
    assert.strictEqual(store.get('drawSpeed'), 500)
  })

  it('hotkeys 默认值正确', () => {
    const hotkeys = store.get('hotkeys')
    assert.strictEqual(hotkeys.preview, 'F5')
    assert.strictEqual(hotkeys.startDraw, 'F6')
    assert.strictEqual(hotkeys.stopDraw, 'F7')
  })

  it('mouseButton 枚举值合法', () => {
    store.set('mouseButton', 'right')
    assert.strictEqual(store.get('mouseButton'), 'right')
    store.reset('mouseButton')
  })

  it('overlayOpacity 在范围内', () => {
    store.set('overlayOpacity', 0.5)
    assert.strictEqual(store.get('overlayOpacity'), 0.5)
    store.reset('overlayOpacity')
  })

  it('onDidChange 在值变更时回调被触发', () => {
    const changes: Array<{ newValue: number; oldValue: number }> = []

    store.onDidChange('drawSpeed', (newValue, oldValue) => {
      changes.push({ newValue, oldValue })
    })

    store.set('drawSpeed', 1500)
    store.set('drawSpeed', 300)

    assert.strictEqual(changes.length, 2)
    assert.strictEqual(changes[0].newValue, 1500)
    assert.strictEqual(changes[0].oldValue, 500)
    assert.strictEqual(changes[1].newValue, 300)
    assert.strictEqual(changes[1].oldValue, 1500)

    store.reset('drawSpeed')
  })
})
