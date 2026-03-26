const path = require('path');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);

if (args[0] === 'studio') {
  const hasPort = args.some((arg, idx) => {
    if (arg === '--port' || arg === '-p') return true;
    if (typeof arg === 'string' && arg.startsWith('--port=')) return true;
    if (idx > 0 && args[idx - 1] === '-p') return true;
    return false;
  });

  if (!hasPort) {
    args.splice(1, 0, '--port', '5555');
  }
}

const prismaCliPath = path.resolve(__dirname, '../node_modules/prisma/build/index.js');
const result = spawnSync(process.execPath, [prismaCliPath, ...args], {
  stdio: 'inherit',
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
