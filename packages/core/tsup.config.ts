import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm', 'iife'],
  globalName: 'Pro6PPCore',
  dts: true,
  clean: true,
  minify: true,
});
