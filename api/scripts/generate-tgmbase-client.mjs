import { spawnSync } from 'node:child_process';

const result = spawnSync(
  process.execPath,
  ['scripts/add-js-extensions.mjs', 'src/generated/tgmbase'],
  {
    stdio: 'inherit',
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
