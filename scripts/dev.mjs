import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const vite = spawn('npx', ['vite'], {
  cwd: root,
  stdio: ['inherit', 'pipe', 'inherit'],
  shell: true,
})

let electronStarted = false

vite.stdout.on('data', (data: Buffer) => {
  const output = data.toString()
  process.stdout.write(output)

  if (!electronStarted && output.includes('Local:')) {
    electronStarted = true

    const electron = spawn('npx', ['electron', '.'], {
      cwd: root,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        VITE_DEV_SERVER_URL: 'http://localhost:5173',
      },
    })

    electron.on('close', (code: number | null) => {
      vite.kill()
      process.exit(code ?? 0)
    })
  }
})

vite.on('close', (code: number | null) => {
  if (!electronStarted) {
    console.error('Vite dev server exited unexpectedly with code', code)
    process.exit(code ?? 1)
  }
})
