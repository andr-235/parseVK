import 'reflect-metadata';
import { vi } from 'vitest';

const jestFn = () => vi.fn();
(globalThis as typeof globalThis & { jest: { fn: typeof jestFn } }).jest = {
  fn: jestFn,
};
