import { defineConfig } from 'tsup';
import { writeFileSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  entry: ['src/index.ts'],
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
  async onSuccess() {
    const { DEFAULT_STYLES } = await import('@pro6pp/infer-core');
    const cssContent = `/* Pro6PP Infer SDK - Default Styles */\n${DEFAULT_STYLES.trim()}\n`;
    writeFileSync(join(import.meta.dirname, 'dist', 'styles.css'), cssContent, 'utf-8');
    console.log('Generated: dist/styles.css');
  },
});
