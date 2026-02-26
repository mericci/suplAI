import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  outDir: 'dist',
  target: 'node20',
  sourcemap: true,
  clean: true,
  // Bundle local code without .js extension. Bundle CJS deps that break as ESM externals.
});
