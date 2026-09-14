import { defineConfig } from 'tsup';
import { writeFileSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react'],
  noExternal: ['@pro6pp/infer-core'],
  async onSuccess() {
    const { DEFAULT_STYLES } = await import('@pro6pp/infer-core');
    const cssContent = `/* Pro6PP Infer SDK - Default Styles */\n${DEFAULT_STYLES.trim()}\n`;
    writeFileSync(join(import.meta.dirname, 'dist', 'styles.css'), cssContent, 'utf-8');
    console.log('Generated: dist/styles.css');
  },
});
