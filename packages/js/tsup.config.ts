import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'pro6pp-infer': 'src/index.ts',
  },
  format: ['cjs', 'esm', 'iife'],
  globalName: 'Pro6PP',
  dts: true,
  clean: true,
  minify: true,
  noExternal: ['@pro6pp/infer-core'],
  target: 'es2017',
  outExtension({ format }) {
    return {
      js: format === 'iife' ? '.global.js' : format === 'cjs' ? '.cjs' : '.mjs',
    };
  },
});
