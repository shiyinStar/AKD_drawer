import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: [
    'src/workers/inference/worker.ts',
    'src/workers/path-extraction/worker.ts',
  ],
  format: 'esm',
  platform: 'node',
  target: 'node20',
  bundle: true,
  sourcemap: true,
  outdir: 'dist/workers',
  external: [
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
    'node:stream',
    'node:stream/promises',
  ],
})
