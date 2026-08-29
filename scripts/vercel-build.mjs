import { execSync } from 'node:child_process';
import { cpSync, rmSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const frontendDist = join(root, 'frontend', 'dist');
const publicDir = join(root, 'public');

function run(cmd, cwd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

// 1. Install frontend deps (including dev deps needed for the Vite build) and build
run('npm install --include=dev', join(root, 'frontend'));
run('npm run build', join(root, 'frontend'));

// 2. Ensure frontend has its API base set to /api (already the case via frontend/.env)
// 3. Clear the target public dir and copy the built static output there
if (existsSync(publicDir)) {
  rmSync(publicDir, { recursive: true, force: true });
}
mkdirSync(publicDir, { recursive: true });
cpSync(frontendDist, publicDir, { recursive: true });

console.log('\n[vercel-build] Copied frontend build output to ./public');
console.log('[vercel-build] Deploy ready.');
