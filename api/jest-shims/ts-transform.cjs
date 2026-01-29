const fs = require('fs');
const path = require('path');
const ts = require('typescript');

let cachedCompilerOptions;

function loadCompilerOptions() {
  if (cachedCompilerOptions) {
    return cachedCompilerOptions;
  }

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
    module: ts.ModuleKind.CommonJS,
    sourceMap: true,
  };

  return cachedCompilerOptions;
}

module.exports = {
  process(sourceText, sourcePath) {
    if (!/\.tsx?$/.test(sourcePath)) {
      return sourceText;
    }

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
