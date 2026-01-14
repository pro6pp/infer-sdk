import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['cjs', 'esm', 'iife'],
  globalName: 'Pro6PPReact',
  dts: true,
  clean: true,
  external: ['react', 'react-dom'],
  noExternal: ['@pro6pp/infer-core'],
  target: 'es2017',
  // FIX: Replace process.env.NODE_ENV with a string for the browser
  define: {
    'process.env.NODE_ENV': '"development"',
  },
  outExtension({ format }) {
    return {
      js: format === 'iife' ? '.global.js' : format === 'cjs' ? '.cjs' : '.mjs',
    };
  },
});
