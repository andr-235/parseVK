import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shimsDir = path.join(__dirname, 'jest-shims', 'node_modules');

export default defineConfig({
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    exclude: ['**/node_modules/**'],
    environment: 'node',
    globals: true,
    pool: 'forks',
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
