import { EventEmitter } from 'node:events'
import { StatusState } from '../shared/types.js'

export class InvalidTransitionError extends Error {
  constructor(from: StatusState, to: StatusState) {
    super(`Invalid state transition: ${from} → ${to}`)
    this.name = 'InvalidTransitionError'
  }
}

const VALID_TRANSITIONS: Record<StatusState, StatusState[]> = {
  [StatusState.NOT_READY]: [StatusState.IDLE, StatusState.ERROR],
  [StatusState.IDLE]: [StatusState.PREVIEWING, StatusState.NOT_READY, StatusState.ERROR],
  [StatusState.PREVIEWING]: [StatusState.DRAWING, StatusState.IDLE, StatusState.NOT_READY, StatusState.ERROR],
  [StatusState.DRAWING]: [StatusState.IDLE, StatusState.NOT_READY, StatusState.ERROR],
  [StatusState.ERROR]: [StatusState.NOT_READY],
}

export interface StateChangeEvent {
  from: StatusState
  to: StatusState
}

export class StateMachine {
  private state: StatusState = StatusState.NOT_READY
  private emitter = new EventEmitter()

  getState(): StatusState {
    return this.state
  }

  transition(newState: StatusState): void {
    const allowed = VALID_TRANSITIONS[this.state]
    if (!allowed.includes(newState)) {
      throw new InvalidTransitionError(this.state, newState)
    }

    const from = this.state
    this.state = newState
    this.emitter.emit('state-change', { from, to: newState } satisfies StateChangeEvent)
  }

  onStateChange(listener: (event: StateChangeEvent) => void): void {
    this.emitter.on('state-change', listener)
  }

  removeStateChangeListener(listener: (event: StateChangeEvent) => void): void {
    this.emitter.off('state-change', listener)
  }
}

export const stateMachine = new StateMachine()
