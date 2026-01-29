const path = require('path');
const Module = require('module');

const shimNodeModules = path.join(__dirname, 'node_modules');
const existing = process.env.NODE_PATH
  ? process.env.NODE_PATH.split(path.delimiter)
  : [];

if (!existing.includes(shimNodeModules)) {
  existing.push(shimNodeModules);
  process.env.NODE_PATH = existing.join(path.delimiter);
  Module._initPaths();
}

module.exports = {};
