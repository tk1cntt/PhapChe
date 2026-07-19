import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      '**/.claude/**',
      '**/node_modules/**',
      // Playwright E2E tests — not vitest
      'e2e/**',
      'tests/e2e/**',
      '**/*.e2e.test.ts',
      '**/*.e2e.test.tsx',
      // Node.js native test runner — not vitest
      '**/*.node.test.ts',
      // Service tests using node:test (not vitest)
      'src/lib/delivery/*.test.ts',
      'src/lib/documents/*.test.ts',
      'src/lib/intake/*.test.ts',
      'src/lib/reviews/*.test.ts',
      'src/lib/routing/*.test.ts',
      'src/lib/workflow/*.test.ts',
      'src/lib/audit/*.test.ts',
      'src/lib/admin/*.test.ts',
      'src/lib/admin-i18n-api-fix.test.ts',
      // Tests importing stale/deleted customer components
      'tests/customer-dashboard/**',
      // Playwright tests (my-cases, dashboard e2e)
      'tests/my-cases/*.spec.tsx',
      'tests/e2e/*.spec.ts',
      // Intake API tests — deprecated, route rewritten to FormData + Zod
      'src/app/api/intake/submit/__tests__/**',
      'src/app/api/intake/draft/**/__tests__/**',
      // Non-vitest test files (node:test, different runner, broken imports)
      'tests/api/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
