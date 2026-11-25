import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/dist', '**/coverage']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    // Test doubles stand in for DOM events, observers and partial API results.
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['packages/react/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
    rules: {
      // useInfer reads and writes refs during render to recreate a core that StrictMode destroyed.
      'react-hooks/refs': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
]);
