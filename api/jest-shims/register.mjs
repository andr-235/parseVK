import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Module from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const shimNodeModules = path.join(__dirname, 'node_modules');
const existing = process.env.NODE_PATH
  ? process.env.NODE_PATH.split(path.delimiter)
  : [];

if (!existing.includes(shimNodeModules)) {
  existing.push(shimNodeModules);
  process.env.NODE_PATH = existing.join(path.delimiter);
  Module._initPaths();
}
