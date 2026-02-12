import { defineConfig } from 'tsup';
import { writeFileSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm', 'iife'],
  globalName: 'Pro6PPCore',
  dts: true,
  clean: true,
  minify: true,
  async onSuccess() {
    const { DEFAULT_STYLES } = await import('./dist/index.js');
    const cssContent = `/* Pro6PP Infer SDK - Default Styles */\n${DEFAULT_STYLES.trim()}\n`;
    writeFileSync(join(import.meta.dirname, 'dist', 'styles.css'), cssContent, 'utf-8');
    console.log('Generated: dist/styles.css');
  },
});
