import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const contractsDir = resolve(scriptDir, '..');

const forgeCheck = spawnSync('forge', ['--version'], {
  stdio: 'ignore',
});

if (forgeCheck.error || forgeCheck.status !== 0) {
  console.log('Skipping contracts install: forge is not available in this environment.');
  process.exit(0);
}

const install = spawnSync('forge', ['soldeer', 'install'], {
  cwd: contractsDir,
  stdio: 'inherit',
});

if (install.error) {
  throw install.error;
}

process.exit(install.status ?? 0);
