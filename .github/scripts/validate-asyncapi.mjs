import path from "node:path";
import process from "node:process";

import { Parser, fromFile } from "@asyncapi/parser";

const specArgument = process.argv[2];
if (!specArgument) {
  console.error("usage: validate-asyncapi.mjs <spec-path>");
  process.exit(2);
}

const specPath = path.resolve(specArgument);
const parser = new Parser();
const { document, diagnostics = [] } = await fromFile(parser, specPath).parse();

const severityNames = new Map([
  [-1, "off"],
  [0, "error"],
  [1, "warning"],
  [2, "info"],
  [3, "hint"],
]);

for (const diagnostic of diagnostics) {
  const severity = severityNames.get(diagnostic.severity) ?? String(diagnostic.severity);
  const code = diagnostic.code ? ` [${diagnostic.code}]` : "";
  const location = Array.isArray(diagnostic.path) && diagnostic.path.length > 0
    ? ` at ${diagnostic.path.join(".")}`
    : "";
  console.error(`${severity}${code}${location}: ${diagnostic.message}`);
}

const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 0);
if (!document || errors.length > 0) {
  console.error(
    `AsyncAPI validation failed: ${errors.length} error(s), ${diagnostics.length} diagnostic(s).`,
  );
  process.exit(1);
}

console.log(
  `AsyncAPI validation passed: ${diagnostics.length} non-blocking diagnostic(s).`,
);
