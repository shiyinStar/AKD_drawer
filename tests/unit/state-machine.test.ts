import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { StateMachine, InvalidTransitionError } from '../../src/main/state-machine.js'
import { StatusState } from '../../src/shared/types.js'

describe('StateMachine', () => {
  it('初始状态为 NOT_READY', () => {
    const sm = new StateMachine()
    assert.strictEqual(sm.getState(), StatusState.NOT_READY)
  })

  it('NOT_READY → IDLE 合法转移成功', () => {
    const sm = new StateMachine()
    sm.transition(StatusState.IDLE)
    assert.strictEqual(sm.getState(), StatusState.IDLE)
  })

  it('IDLE → PREVIEWING 合法转移成功', () => {
    const sm = new StateMachine()
    sm.transition(StatusState.IDLE)
    sm.transition(StatusState.PREVIEWING)
    assert.strictEqual(sm.getState(), StatusState.PREVIEWING)
  })

  it('PREVIEWING → DRAWING 合法转移成功', () => {
    const sm = new StateMachine()
    sm.transition(StatusState.IDLE)
    sm.transition(StatusState.PREVIEWING)
    sm.transition(StatusState.DRAWING)
    assert.strictEqual(sm.getState(), StatusState.DRAWING)
  })

  it('DRAWING → IDLE 合法转移成功', () => {
    const sm = new StateMachine()
    sm.transition(StatusState.IDLE)
    sm.transition(StatusState.PREVIEWING)
    sm.transition(StatusState.DRAWING)
    sm.transition(StatusState.IDLE)
    assert.strictEqual(sm.getState(), StatusState.IDLE)
  })

  it('IDLE → DRAWING（跳过 PREVIEWING）非法转移抛异常', () => {
    const sm = new StateMachine()
    sm.transition(StatusState.IDLE)
    assert.throws(
      () => sm.transition(StatusState.DRAWING),
      InvalidTransitionError,
    )
  })

  it('NOT_READY → DRAWING 非法转移抛异常', () => {
    const sm = new StateMachine()
    assert.throws(
      () => sm.transition(StatusState.DRAWING),
      InvalidTransitionError,
    )
  })

  it('ERROR 可从 NOT_READY 转入', () => {
    const sm = new StateMachine()
    sm.transition(StatusState.ERROR)
    assert.strictEqual(sm.getState(), StatusState.ERROR)
  })

  it('ERROR 可从 IDLE 转入', () => {
    const sm = new StateMachine()
    sm.transition(StatusState.IDLE)
    sm.transition(StatusState.ERROR)
    assert.strictEqual(sm.getState(), StatusState.ERROR)
  })

  it('ERROR 可从 PREVIEWING 转入', () => {
    const sm = new StateMachine()
    sm.transition(StatusState.IDLE)
    sm.transition(StatusState.PREVIEWING)
    sm.transition(StatusState.ERROR)
    assert.strictEqual(sm.getState(), StatusState.ERROR)
  })

  it('ERROR 可从 DRAWING 转入', () => {
    const sm = new StateMachine()
    sm.transition(StatusState.IDLE)
    sm.transition(StatusState.PREVIEWING)
    sm.transition(StatusState.DRAWING)
    sm.transition(StatusState.ERROR)
    assert.strictEqual(sm.getState(), StatusState.ERROR)
  })

  it('ERROR → NOT_READY 合法转移成功', () => {
    const sm = new StateMachine()
    sm.transition(StatusState.ERROR)
    sm.transition(StatusState.NOT_READY)
    assert.strictEqual(sm.getState(), StatusState.NOT_READY)
  })

  it('ERROR → IDLE（跳过 NOT_READY）非法', () => {
    const sm = new StateMachine()
    sm.transition(StatusState.ERROR)
    assert.throws(
      () => sm.transition(StatusState.IDLE),
      InvalidTransitionError,
    )
  })

  it('状态变更后 state-change 事件被触发，事件参数包含旧状态和新状态', () => {
    const sm = new StateMachine()
    const events: Array<{ from: StatusState; to: StatusState }> = []

    sm.onStateChange((event) => {
      events.push({ from: event.from, to: event.to })
    })

    sm.transition(StatusState.IDLE)
    sm.transition(StatusState.PREVIEWING)

    assert.strictEqual(events.length, 2)
    assert.deepStrictEqual(events[0], { from: StatusState.NOT_READY, to: StatusState.IDLE })
    assert.deepStrictEqual(events[1], { from: StatusState.IDLE, to: StatusState.PREVIEWING })
  })

  it('非法转移时状态不改变', () => {
    const sm = new StateMachine()
    sm.transition(StatusState.IDLE)
    try {
      sm.transition(StatusState.DRAWING)
    } catch {
      // expected
    }
    assert.strictEqual(sm.getState(), StatusState.IDLE)
  })
})
