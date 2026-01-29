import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedCompilerOptions;

function loadCompilerOptions() {
  if (cachedCompilerOptions) return cachedCompilerOptions;

  const configPath = path.join(__dirname, '..', 'tsconfig.json');
  const configFile = ts.readConfigFile(configPath, (filePath) =>
    fs.readFileSync(filePath, 'utf8'),
  );

  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath),
  );

  cachedCompilerOptions = {
    ...parsedConfig.options,
    module: ts.ModuleKind.ESNext,
    sourceMap: true,
  };

  return cachedCompilerOptions;
}

export default {
  process(sourceText, sourcePath) {
    if (!/\.tsx?$/.test(sourcePath)) return sourceText;

    const compilerOptions = loadCompilerOptions();
    const result = ts.transpileModule(sourceText, {
      compilerOptions,
      fileName: sourcePath,
      reportDiagnostics: false,
    });

    return {
      code: result.outputText,
      map: result.sourceMapText ?? undefined,
    };
  },
};
