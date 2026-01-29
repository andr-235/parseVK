import fs from 'node:fs';
import path from 'node:path';

const targetDir = process.argv[2];
if (!targetDir) {
  console.error('Usage: node add-js-extensions.mjs <directory>');
  process.exit(1);
}

const rootDir = path.resolve(process.cwd(), targetDir);
if (!fs.existsSync(rootDir) || !fs.statSync(rootDir).isDirectory()) {
  console.error('Directory not found:', rootDir);
  process.exit(1);
}

const RELATIVE_PATTERN = /(from|import)\s+(['"])((?:\.\.?\/)[^'"]+)(\2)/g;
const EXPORT_FROM_PATTERN =
  /(export\s+(?:\*|\{[^}]*\})\s+from)\s+(['"])((?:\.\.?\/)[^'"]+)(\2)/g;
const ALIAS_PATTERN = /(from|import)\s+(['"])(@\/[^'"]+)(\2)/g;
const ALIAS_EXPORT_PATTERN =
  /(export\s+(?:\*|\{[^}]*\})\s+from)\s+(['"])(@\/[^'"]+)(\2)/g;

function resolveImportPath(importPath, fromFile) {
  if (importPath.endsWith('.js') || importPath.endsWith('.json'))
    return importPath;
  const fromDir = path.dirname(fromFile);
  const resolved = path.resolve(fromDir, importPath);
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    const idx = path.join(resolved, 'index');
    if (fs.existsSync(idx + '.ts') || fs.existsSync(idx + '.tsx')) {
      return importPath.replace(/\/?$/, '') + '/index.js';
    }
  }
  return importPath + (importPath.endsWith('/') ? 'index.js' : '.js');
}

function aliasToRelative(aliasPath, filePath, root) {
  const pathWithoutAlias = aliasPath.replace(/^@\//, '');
  const rel = path.relative(path.dirname(filePath), root);
  const joined = rel ? path.join(rel, pathWithoutAlias) : pathWithoutAlias;
  const withSlash = joined.replace(/\\/g, '/');
  const normalized = withSlash.startsWith('.') ? withSlash : `./${withSlash}`;
  return (
    normalized +
    (normalized.endsWith('.js') || normalized.endsWith('.json') ? '' : '.js')
  );
}

function addExtensionsToContent(content, filePath, root) {
  const aliasReplacer = (match, prefix, quote, importPath, closeQuote) => {
    const newPath = aliasToRelative(importPath, filePath, root);
    return `${prefix} ${quote}${newPath}${closeQuote}`;
  };
  let out = content.replace(ALIAS_PATTERN, aliasReplacer);
  out = out.replace(ALIAS_EXPORT_PATTERN, aliasReplacer);

  const relativeReplacer = (match, prefix, quote, importPath, closeQuote) => {
    const newPath = resolveImportPath(importPath, filePath);
    return `${prefix} ${quote}${newPath}${closeQuote}`;
  };
  out = out.replace(RELATIVE_PATTERN, relativeReplacer);
  out = out.replace(EXPORT_FROM_PATTERN, relativeReplacer);
  return out;
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') {
      walk(full);
      continue;
    }
    if (!e.isFile() || !/\.ts$/.test(e.name) || e.name.endsWith('.d.ts'))
      continue;
    const content = fs.readFileSync(full, 'utf8');
    const newContent = addExtensionsToContent(content, full, rootDir);
    if (newContent !== content) {
      fs.writeFileSync(full, newContent, 'utf8');
      console.log('Updated:', path.relative(rootDir, full));
    }
  }
}

walk(rootDir);
