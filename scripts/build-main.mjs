import * as esbuild from 'esbuild'

const shared = {
  platform: 'node',
  target: 'node20',
  bundle: true,
  sourcemap: true,
}

// Main Process — ESM 格式，由 Node.js 以 ESM 加载
await esbuild.build({
  ...shared,
  entryPoints: ['src/main/index.ts'],
  format: 'esm',
  outfile: 'dist/main/main/index.js',
  external: [
    'electron',
    'onnxruntime-node',
    '@techstark/opencv-js',
    'node:worker_threads',
    'node:fs',
    'node:fs/promises',
    'node:path',
    'node:url',
    'node:os',
    'node:crypto',
    'node:events',
    'node:util',
    'node:child_process',
    'node:stream',
    'node:stream/promises',
    'node:module',
    'node:process',
  ],
})

// Preload — CJS 格式 (.cjs)，绕过 package.json "type": "module"
await esbuild.build({
  ...shared,
  entryPoints: ['src/preload/index.ts'],
  format: 'cjs',
  outfile: 'dist/main/preload/index.cjs',
  external: ['electron'],
})

// Overlay Preload — 叠加窗口专用 preload
await esbuild.build({
  ...shared,
  entryPoints: ['src/preload/overlay.ts'],
  format: 'cjs',
  outfile: 'dist/main/preload/overlay.cjs',
  external: ['electron'],
})
