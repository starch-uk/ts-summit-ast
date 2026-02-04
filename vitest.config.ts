/**
 * @file Vitest configuration (test runner, coverage, environment).
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/index.ts',
      ],
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
    environment: 'node',
    globals: true,
    watch: false, // Disable watch mode by default
  },
});
