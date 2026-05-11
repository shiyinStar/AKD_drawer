import { spawn, execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const VITE_URL = 'http://localhost:5173'

// 先构建 Main Process + Preload（确保 IPC handler 等主进程改动生效）
console.log('[dev] Building main process...')
execSync('node scripts/build-main.mjs', { cwd: root, stdio: 'inherit' })

// 构建 Workers（推理 Worker 由主进程通过 worker_threads 加载）
console.log('[dev] Building workers...')
execSync('node scripts/build-workers.mjs', { cwd: root, stdio: 'inherit' })

const vite = spawn('npx', ['vite'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
})

async function waitForVite(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status === 304) return
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error('Vite dev server did not start within ' + timeoutMs + 'ms')
}

async function main(): Promise<void> {
  try {
    await waitForVite(VITE_URL, 30_000)
    console.log('[dev] Vite ready, starting Electron...')

    const electron = spawn('npx', ['electron', '.'], {
      cwd: root,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        VITE_DEV_SERVER_URL: VITE_URL,
      },
    })

    electron.on('close', (code: number | null) => {
      vite.kill()
      process.exit(code ?? 0)
    })
  } catch (err) {
    console.error('[dev]', err)
    vite.kill()
    process.exit(1)
  }
}

vite.on('close', (code: number | null) => {
  if (code !== null) {
    console.error('[dev] Vite exited unexpectedly with code', code)
    process.exit(code ?? 1)
  }
})

main()
