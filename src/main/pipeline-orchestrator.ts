import type { BrowserWindow } from 'electron'
import type { AppContext } from './app-context.js'
import type { StateMachine } from './state-machine.js'
import { StatusState } from '../shared/types.js'
import { IPC_CHANNELS } from '../shared/types.js'
import type { PipelineProgress, ErrorInfo } from '../shared/types.js'
import { runInference } from './worker-manager.js'

export interface PipelineDeps {
  modelPath: string
  getContext: () => AppContext
  getMainWindow: () => BrowserWindow | null
  stateMachine: StateMachine
}

export function createPipelineOrchestrator(deps: PipelineDeps) {
  const { modelPath, getContext, getMainWindow, stateMachine } = deps

  async function run(imageBuffer: Buffer): Promise<void> {
    const win = getMainWindow()

    try {
      win?.webContents.send(IPC_CHANNELS.PIPELINE_PROGRESS, {
        stage: 'inference',
        progress: 0,
      } as PipelineProgress)

      const lineArtBuffer = await runInference(modelPath, Buffer.from(imageBuffer))

      const ctx = getContext()
      ctx.lineArtBuffer = lineArtBuffer
      ctx.lineArtBase64 = lineArtBuffer.toString('base64')

      win?.webContents.send(IPC_CHANNELS.PIPELINE_PROGRESS, {
        stage: 'inference',
        progress: 100,
      } as PipelineProgress)

      win?.webContents.send(IPC_CHANNELS.PIPELINE_COMPLETE, {
        lineArtBase64: ctx.lineArtBase64,
        pathCount: 0,
        boundingBox: null,
      })

      stateMachine.transition(StatusState.IDLE)

      win?.webContents.send(IPC_CHANNELS.APP_STATE, StatusState.IDLE)
      win?.webContents.send(IPC_CHANNELS.SHOW_TOAST, {
        type: 'success',
        message: '线稿提取完成',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : '推理失败'
      const errorInfo: ErrorInfo = {
        reason: message,
        suggestion: '请确保模型文件完整，或重新启动应用后重试',
        logPath: '',
      }

      stateMachine.transition(StatusState.ERROR)

      win?.webContents.send(IPC_CHANNELS.APP_ERROR, errorInfo)
      win?.webContents.send(IPC_CHANNELS.APP_STATE, StatusState.ERROR)
      win?.webContents.send(IPC_CHANNELS.SHOW_TOAST, {
        type: 'error',
        message: `推理失败: ${message}`,
      })
    }
  }

  return { run }
}
