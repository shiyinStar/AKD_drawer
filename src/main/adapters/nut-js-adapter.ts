/**
 * CJS → ESM Adapter for @nut-tree-fork/nut-js
 * 此文件为 AKD 项目中唯一使用 createRequire 的位置
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const nut = require('@nut-tree-fork/nut-js')

export const mouse = nut.mouse as {
  setPosition(point: { x: number; y: number }): Promise<unknown>
  pressButton(button: number): Promise<unknown>
  releaseButton(button: number): Promise<unknown>
}

export const Button = nut.Button as Record<string, number> & {
  LEFT: number
  MIDDLE: number
  RIGHT: number
}
