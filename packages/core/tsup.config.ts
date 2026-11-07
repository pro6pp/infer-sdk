import { defineConfig } from 'tsup';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm', 'iife'],
  globalName: 'Pro6PPCore',
  dts: true,
  clean: true,
  minify: true,
  async onSuccess() {
    const distPath = join(import.meta.dirname, 'dist', 'index.js');
    const { DEFAULT_STYLES } = await import(pathToFileURL(distPath).href);
    const cssContent = `/* Pro6PP Infer SDK - Default Styles */\n${DEFAULT_STYLES.trim()}\n`;
    writeFileSync(join(import.meta.dirname, 'dist', 'styles.css'), cssContent, 'utf-8');
    console.log('Generated: dist/styles.css');
  },
});
