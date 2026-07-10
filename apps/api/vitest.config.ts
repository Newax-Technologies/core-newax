import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    passWithNoTests: false,
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/main.ts'],
      reporter: ['text', 'json', 'html'],
    },
  },
});
