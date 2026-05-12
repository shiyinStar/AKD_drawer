import { Tray, Menu, nativeImage } from 'electron'
import { join } from 'node:path'
import type { BrowserWindow } from 'electron'
import { StatusState } from '../shared/types.js'
import type { StateMachine } from './state-machine.js'
import type { AppContext } from './app-context.js'

const STATE_LABELS: Record<StatusState, string> = {
  [StatusState.NOT_READY]: '未就绪',
  [StatusState.IDLE]: '空闲',
  [StatusState.PREVIEWING]: '预览中',
  [StatusState.DRAWING]: '绘制中',
  [StatusState.ERROR]: '错误',
}

const ICON_MAP: Record<StatusState, string> = {
  [StatusState.NOT_READY]: 'not-ready.png',
  [StatusState.IDLE]: 'idle.png',
  [StatusState.PREVIEWING]: 'previewing.png',
  [StatusState.DRAWING]: 'drawing.png',
  [StatusState.ERROR]: 'error.png',
}

export interface TrayManagerDeps {
  getMainWindow: () => BrowserWindow | null
  getContext: () => AppContext
  stateMachine: StateMachine
  iconDir: string
  exportLineArt: () => Promise<void>
  requestQuit: () => void
}

export function createTrayManager(deps: TrayManagerDeps) {
  const iconPath = (state: StatusState) => join(deps.iconDir, ICON_MAP[state])

  const tray = new Tray(
    nativeImage.createFromPath(iconPath(StatusState.NOT_READY)).resize({ width: 16, height: 16 }),
  )
  tray.setToolTip('AKD')

  function buildMenu(): Menu {
    const state = deps.stateMachine.getState()
    const ctx = deps.getContext()
    const hasLineArt = state === StatusState.IDLE && ctx.lineArtBuffer !== null

    return Menu.buildFromTemplate([
      {
        label: '打开主窗口',
        click: () => {
          const win = deps.getMainWindow()
          if (win) {
            win.show()
            win.focus()
          }
        },
      },
      { type: 'separator' },
      {
        label: `状态: ${STATE_LABELS[state]}`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: '导出线稿 PNG',
        enabled: hasLineArt,
        click: () => {
          deps.exportLineArt().catch((err) => {
            console.error('[AKD] 托盘导出线稿失败:', err)
          })
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          deps.requestQuit()
        },
      },
    ])
  }

  function updateTray() {
    const state = deps.stateMachine.getState()
    const img = nativeImage.createFromPath(iconPath(state)).resize({ width: 16, height: 16 })
    tray.setImage(img)
    tray.setToolTip(`AKD - ${STATE_LABELS[state]}`)
    tray.setContextMenu(buildMenu())
  }

  tray.setContextMenu(buildMenu())

  tray.on('click', () => {
    const win = deps.getMainWindow()
    if (win) {
      win.show()
      win.focus()
    }
  })

  deps.stateMachine.onStateChange(() => {
    updateTray()
  })

  return {
    destroy() {
      tray.destroy()
    },
  }
}
