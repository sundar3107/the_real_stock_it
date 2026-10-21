const { spawn } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log(' Starting Stock Management System Development Suite');
console.log(' Backend (Port 5001) & Frontend (Port 5173)');
console.log('====================================================\n');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// 1. Spawn backend dev process
const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.resolve(__dirname, '../backend'),
  stdio: 'inherit',
  shell: true,
});

// 2. Spawn frontend dev process
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.resolve(__dirname, '../frontend'),
  stdio: 'inherit',
  shell: true,
});

function cleanup() {
  console.log('\nShutting down dev servers...');
  if (backend && !backend.killed) {
    try { backend.kill(); } catch {}
  }
  if (frontend && !frontend.killed) {
    try { frontend.kill(); } catch {}
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
