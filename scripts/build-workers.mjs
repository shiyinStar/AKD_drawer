import * as esbuild from 'esbuild'

// Workers 使用非打包模式：esbuild 仅编译 TypeScript → JavaScript，
// import 语句原样保留，由 Node.js 原生解析（处理 CJS→ESM 互操作）。
// bundle: true 会将 CJS 依赖包裹在 __require() 中，与 ESM Worker 不兼容。
await esbuild.build({
  entryPoints: [
    'src/workers/inference/worker.ts',
    'src/workers/path-extraction/worker.ts',
  ],
  format: 'esm',
  platform: 'node',
  target: 'node20',
  bundle: false,
  sourcemap: true,
  outdir: 'dist',
  outbase: 'src',
})
