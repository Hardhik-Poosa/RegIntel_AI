/**
 * RegintelAI Cross-Platform Monorepo Launcher
 */
const { spawn } = require('child_process');

console.log('🚀 Starting RegintelAI Monorepo Services...\n');

const runProcess = (name, command, args, cwd = process.cwd()) => {
  const proc = spawn(command, args, { cwd, shell: true, stdio: 'inherit' });
  proc.on('close', (code) => {
    console.log(`[${name}] process exited with code ${code}`);
  });
  return proc;
};

// Check CLI arguments
const target = process.argv[2];

if (target === 'web') {
  runProcess('WEB', 'npm', ['run', 'dev', '--filter=@regintel/web']);
} else if (target === 'mobile') {
  runProcess('MOBILE', 'npm', ['run', 'dev', '--filter=@regintel/mobile']);
} else if (target === 'backend') {
  runProcess('BACKEND', 'uvicorn', ['app.main:app', '--reload', '--port', '8000'], './backend');
} else {
  console.log('Running all services (Web + Mobile + Backend)...');
  runProcess('TURBO', 'npx', ['turbo', 'run', 'dev', '--parallel']);
}
