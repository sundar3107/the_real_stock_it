const { spawn } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log(' Starting Stock Management System Development Suite');
console.log(' Backend (Port 5001) & Frontend (Port 5173)');
console.log('====================================================\n');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Ensure Node directory is in PATH for child processes
const nodeDirs = ['C:\\Program Files\\nodejs', 'C:\\Users\\cgjai\\nodejs'];
const currentPath = process.env.PATH || process.env.Path || '';
const mergedPath = `${nodeDirs.join(';')};${currentPath}`;
const childEnv = { ...process.env, PATH: mergedPath, Path: mergedPath };

// 1. Spawn backend dev process
const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.resolve(__dirname, '../backend'),
  stdio: 'inherit',
  shell: true,
  env: childEnv,
});

// 2. Spawn frontend dev process
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.resolve(__dirname, '../frontend'),
  stdio: 'inherit',
  shell: true,
  env: childEnv,
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
