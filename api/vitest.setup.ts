import 'reflect-metadata';
import { vi } from 'vitest';

const jestFn = () => vi.fn();
(globalThis as Record<string, unknown>).jest = { fn: jestFn };
