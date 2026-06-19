import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Proxy API in dev so the httpOnly refresh cookie is same-origin (CLAUDE.md §10).
    // Point this at your backend; VITE_API_BASE_URL stays "/api" in dev.
    proxy: {
      // BillFlow backend (Swagger on :8081). axios baseURL is '/api', endpoints use '/v1/...'.
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Multi-step RTL flows (wizards) can exceed the 5s default under full-suite load.
    testTimeout: 20000,
    // Unit/component tests live in src; e2e/ is Playwright's.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // CLAUDE.md §18 — ≥80% on shared/ and feature model logic.
      include: ['src/shared/**', 'src/features/**/model/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
