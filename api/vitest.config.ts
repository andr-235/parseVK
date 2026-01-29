import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shimsDir = path.join(__dirname, 'jest-shims', 'node_modules');

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    exclude: ['**/node_modules/**', 'test/**/*.e2e-spec.ts'],
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        '**/*.module.ts',
        'src/main.ts',
        '**/*.spec.ts',
        '**/*.e2e-spec.ts',
      ],
      thresholds: {
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/generated/prisma/client': path.join(
        shimsDir,
        '@prisma/client/index.js',
      ),
      'vk-io': path.join(shimsDir, 'vk-io/index.js'),
      '@nestjs/cache-manager': path.join(
        shimsDir,
        '@nestjs/cache-manager/index.js',
      ),
      '@nestjs/bullmq': path.join(shimsDir, '@nestjs/bullmq/index.js'),
      bullmq: path.join(shimsDir, 'bullmq/index.js'),
      'libphonenumber-js/max': path.join(shimsDir, 'libphonenumber-js/max.js'),
      got: path.join(shimsDir, 'got/index.js'),
    },
  },
});
